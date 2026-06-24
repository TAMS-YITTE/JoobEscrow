// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UniversalServiceEscrow
 * @notice Generic escrow engine for Web3 services on BNB Smart Chain.
 *
 * Hardening over earlier versions:
 *  1. Pull-over-push: funds are credited then withdrawn by the beneficiary,
 *     never pushed. Prevents griefing by reverting/blacklisted recipients.
 *  2. Ownable2Step: two-step ownership transfer prevents accidental fat-finger loss.
 *  3. Accounting invariant: totalLocked + totalWithdrawable <= balance. The
 *     stuck-token recovery function can never touch committed funds.
 *  4. Non-binary disputes: split resolution (provider 0..100%) instead of all-or-nothing.
 *  5. Evidence anchoring: evidenceHash (IPFS CID) recorded on-chain on dispute opening
 *     and via submitEvidence, by both parties.
 *  6. Provider acceptance: the client may cancel freely until the provider accepts;
 *     after acceptance, cancellation requires a dispute.
 *  7. Per-token limits: min/max amounts stored per token to handle heterogeneous decimals.
 *  8. Timelock: fee, feeRecipient, and global limits changes go through a 2-day queue.
 *  9. Emergency pause: creation/release/cancel gated by whenNotPaused, while withdraw and
 *     dispute resolution remain accessible.
 *
 * Post-audit fixes (SpyWolf):
 *  - resolveStaleDispute: 50/50 split, no bias toward either party.
 *  - batchWithdraw: isolated transfers, one failing token does not block others.
 *  - claimTimeout: requires prior provider acceptance.
 */

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract UniversalServiceEscrow is ReentrancyGuard, Ownable2Step {

    using SafeERC20 for IERC20;

    // --- Types ---

    enum Status { NULL, FUNDED, RELEASED, DISPUTED, RESOLVED, CANCELLED }

    struct Escrow {
        address client;
        address provider;
        address token;
        uint256 amount;
        uint256 feeBPS;          // fee in basis points, locked at creation time
        uint256 createdAt;       // used for acceptDelay
        uint256 timeoutDate;
        Status  status;
        bool    accepted;        // provider has committed to the job
    }

    struct TokenConfig {
        bool    allowed;
        string  symbol;
        uint256 minAmount;       // per-token bounds (in token's native decimals)
        uint256 maxAmount;
    }

    // --- Storage ---

    uint256 public escrowCounter;
    mapping(uint256 => Escrow) public escrows;

    mapping(address => uint256) public activeEscrowsByUser;     // client -> active count
    mapping(address => TokenConfig) public tokenConfigs;

    // Pull-over-push accounting
    mapping(address => mapping(address => uint256)) public withdrawable; // user -> token -> amount
    mapping(address => uint256) public totalWithdrawable;                // token -> owed
    mapping(address => uint256) public totalLocked;                      // token -> locked in escrows

    bool public paused;

    address public feeRecipient;
    uint256 public defaultFeeBPS         = 800;   // 8%
    uint256 public maxActiveEscrowsPerUser = 10;
    uint256 public minTimeoutDays        = 3;     // minimum timeout in days
    uint256 public maxTimeoutDays        = 365;
    uint256 public acceptDelaySeconds    = 0;     // optional front-running delay

    uint256 public staleDisputeTimeout   = 30 days;
    mapping(uint256 => uint256) public disputeOpenedAt;
    mapping(uint256 => address) public disputeOpener;

    // Timelock
    uint256 public constant TIMELOCK_DELAY = 2 days;
    mapping(bytes32 => uint256) public timelocks; // actionId -> earliest execution timestamp

    // Pre-whitelisted tokens on BSC Mainnet (chainId 56)
    address public constant BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    address public constant USDT = 0x55d398326f99059fF775485246999027B3197955;
    address public constant USDC = 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d;
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    // --- Events ---

    event EscrowCreated(uint256 indexed escrowId, address indexed client, address indexed provider, address token, uint256 amount, uint256 timeoutDate);
    event EscrowAccepted(uint256 indexed escrowId, address indexed provider);
    // FundsReleased is the canonical accounting event for successful payouts.
    // TimeoutClaimed is emitted additionally to indicate the specific release reason.
    event FundsReleased(uint256 indexed escrowId, uint256 providerAmount, uint256 feeAmount);
    event TimeoutClaimed(uint256 indexed escrowId, address indexed provider);
    event EscrowCancelled(uint256 indexed escrowId, address indexed client, uint256 amount);
    event DisputeOpened(uint256 indexed escrowId, address indexed opener, bytes32 evidenceHash);
    event EvidenceSubmitted(uint256 indexed escrowId, address indexed party, bytes32 evidenceHash);
    event DisputeResolved(uint256 indexed escrowId, uint256 providerBps, uint256 providerAmount, uint256 clientAmount, uint256 feeAmount);
    event StaleDisputeResolved(uint256 indexed escrowId, address resolver, uint256 settledAmount);
    event Credited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event TokensRecovered(address indexed token, address indexed to, uint256 amount);

    event TokenConfigUpdated(address indexed token, bool allowed, string symbol, uint256 minAmount, uint256 maxAmount);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event DefaultFeeUpdated(uint256 oldFee, uint256 newFee);
    event LimitsUpdated(uint256 maxActive, uint256 minTimeout, uint256 maxTimeout, uint256 acceptDelay);
    event PauseToggled(bool paused);
    event ActionQueued(bytes32 indexed actionId, uint256 executeAfter);
    event ActionCancelled(bytes32 indexed actionId);

    // --- Constructor ---

    constructor(address _feeRecipient, uint256 _initialFeeBPS) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_initialFeeBPS <= 2000, "Fee too high (max 20%)");
        feeRecipient = _feeRecipient;
        defaultFeeBPS = _initialFeeBPS;

        // Auto-whitelist only on BSC Mainnet (chainId 56)
        if (block.chainid == 56) {
            if (BUSD.code.length > 0) _whitelistToken(BUSD, "BUSD", 1 ether, 100000 ether);
            if (USDT.code.length > 0) _whitelistToken(USDT, "USDT", 1 ether, 100000 ether);
            if (USDC.code.length > 0) _whitelistToken(USDC, "USDC", 1 ether, 100000 ether);
            if (WBNB.code.length > 0) _whitelistToken(WBNB, "WBNB", 0.01 ether, 1000 ether);
        }
    }

    // --- Modifiers ---

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // --- Admin: token whitelist (immediate, owner-only) ---

    function setTokenAllowed(
        address _token,
        string calldata _symbol,
        uint256 _minAmount,
        uint256 _maxAmount,
        bool _allowed
    ) external onlyOwner {
        require(_token != address(0) && _token.code.length > 0, "Invalid token address");
        if (_allowed) {
            require(_minAmount > 0 && _maxAmount > _minAmount, "Invalid amount bounds");
            _whitelistToken(_token, _symbol, _minAmount, _maxAmount);
        } else {
            string memory oldSymbol = tokenConfigs[_token].symbol;
            delete tokenConfigs[_token];
            emit TokenConfigUpdated(_token, false, oldSymbol, 0, 0);
        }
    }

    function _whitelistToken(address _token, string memory _symbol, uint256 _min, uint256 _max) internal {
        try IERC20(_token).totalSupply() returns (uint256 supply) {
            require(supply > 0, "Token has no supply");
            tokenConfigs[_token] = TokenConfig({allowed: true, symbol: _symbol, minAmount: _min, maxAmount: _max});
            emit TokenConfigUpdated(_token, true, _symbol, _min, _max);
        } catch {
            revert("Invalid BEP-20 token");
        }
    }

    // --- Admin: emergency pause (immediate, by design) ---

    function togglePause() external onlyOwner {
        paused = !paused;
        emit PauseToggled(paused);
    }

    // --- Admin: timelocked parameter changes ---

    function _queue(bytes32 actionId) internal {
        timelocks[actionId] = block.timestamp + TIMELOCK_DELAY;
        emit ActionQueued(actionId, timelocks[actionId]);
    }

    function _consume(bytes32 actionId) internal {
        uint256 t = timelocks[actionId];
        require(t != 0 && block.timestamp >= t, "Action not ready");
        delete timelocks[actionId];
    }

    function cancelQueuedAction(bytes32 actionId) external onlyOwner {
        require(timelocks[actionId] != 0, "Nothing queued");
        delete timelocks[actionId];
        emit ActionCancelled(actionId);
    }

    // Fee
    function queueDefaultFee(uint256 _newFeeBPS) external onlyOwner {
        require(_newFeeBPS <= 2000, "Fee too high (max 20%)");
        _queue(keccak256(abi.encode("FEE", _newFeeBPS)));
    }
    function executeDefaultFee(uint256 _newFeeBPS) external onlyOwner {
        _consume(keccak256(abi.encode("FEE", _newFeeBPS)));
        uint256 oldFee = defaultFeeBPS;
        defaultFeeBPS = _newFeeBPS;
        emit DefaultFeeUpdated(oldFee, _newFeeBPS);
    }

    // Fee recipient
    function queueFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        _queue(keccak256(abi.encode("RECIPIENT", _newRecipient)));
    }
    function executeFeeRecipient(address _newRecipient) external onlyOwner {
        _consume(keccak256(abi.encode("RECIPIENT", _newRecipient)));
        address oldRecipient = feeRecipient;
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(oldRecipient, _newRecipient);
    }

    // Global limits
    function queueLimits(uint256 _maxActive, uint256 _minTimeout, uint256 _maxTimeout, uint256 _acceptDelay) external onlyOwner {
        require(_maxActive > 0 && _minTimeout > 0 && _maxTimeout > _minTimeout && _maxTimeout <= 730, "Invalid limits");
        _queue(keccak256(abi.encode("LIMITS", _maxActive, _minTimeout, _maxTimeout, _acceptDelay)));
    }
    function executeLimits(uint256 _maxActive, uint256 _minTimeout, uint256 _maxTimeout, uint256 _acceptDelay) external onlyOwner {
        _consume(keccak256(abi.encode("LIMITS", _maxActive, _minTimeout, _maxTimeout, _acceptDelay)));
        require(_minTimeout > 0, "Min timeout must be > 0");
        maxActiveEscrowsPerUser = _maxActive;
        minTimeoutDays = _minTimeout;
        maxTimeoutDays = _maxTimeout;
        acceptDelaySeconds = _acceptDelay;
        emit LimitsUpdated(_maxActive, _minTimeout, _maxTimeout, _acceptDelay);
    }

    // Stale dispute timeout
    function queueStaleTimeout(uint256 _newTimeoutDays) external onlyOwner {
        require(_newTimeoutDays >= 7 && _newTimeoutDays <= 90, "Stale timeout out of range");
        _queue(keccak256(abi.encode("STALE_TIMEOUT", _newTimeoutDays)));
    }
    function executeStaleTimeout(uint256 _newTimeoutDays) external onlyOwner {
        _consume(keccak256(abi.encode("STALE_TIMEOUT", _newTimeoutDays)));
        staleDisputeTimeout = _newTimeoutDays * 1 days;
    }

    // --- Core: escrow creation ---

    function createAndFundEscrow(
        address _provider,
        address _token,
        uint256 _amount,
        uint256 _timeoutDurationInDays
    ) external nonReentrant whenNotPaused returns (uint256) {
        TokenConfig memory cfg = tokenConfigs[_token];
        require(cfg.allowed, "Token not whitelisted");
        require(_provider != address(0) && _provider != msg.sender, "Invalid provider");
        require(_amount >= cfg.minAmount && _amount <= cfg.maxAmount, "Amount out of bounds");
        require(_timeoutDurationInDays >= minTimeoutDays && _timeoutDurationInDays <= maxTimeoutDays, "Invalid timeout");
        require(activeEscrowsByUser[msg.sender] < maxActiveEscrowsPerUser, "Too many active escrows");

        // Measure actual received amount (handles fee-on-transfer tokens)
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 actualAmount = IERC20(_token).balanceOf(address(this)) - balanceBefore;
        require(actualAmount > 0, "Transfer returned zero tokens");

        uint256 escrowId = ++escrowCounter;
        escrows[escrowId] = Escrow({
            client: msg.sender,
            provider: _provider,
            token: _token,
            amount: actualAmount,
            feeBPS: defaultFeeBPS,
            createdAt: block.timestamp,
            timeoutDate: block.timestamp + (_timeoutDurationInDays * 1 days),
            status: Status.FUNDED,
            accepted: false
        });

        activeEscrowsByUser[msg.sender]++;
        totalLocked[_token] += actualAmount;

        emit EscrowCreated(escrowId, msg.sender, _provider, _token, actualAmount, escrows[escrowId].timeoutDate);
        return escrowId;
    }

    // --- Core: provider acceptance ---

    function acceptEscrow(uint256 _escrowId) external whenNotPaused {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.provider, "Only provider");
        require(e.status == Status.FUNDED, "Not FUNDED");
        require(block.timestamp >= e.createdAt + acceptDelaySeconds, "Accept delay not met");
        require(!e.accepted, "Already accepted");
        e.accepted = true;
        emit EscrowAccepted(_escrowId, msg.sender);
    }

    // --- Core: happy path ---

    function releaseFunds(uint256 _escrowId) external nonReentrant whenNotPaused {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.client, "Only client");
        require(e.status == Status.FUNDED, "Not FUNDED");

        e.status = Status.RELEASED;
        activeEscrowsByUser[e.client]--;

        uint256 feeAmount = (e.amount * e.feeBPS) / 10000;
        uint256 providerAmount = e.amount - feeAmount;

        totalLocked[e.token] -= e.amount;
        _credit(feeRecipient, e.token, feeAmount);
        _credit(e.provider, e.token, providerAmount);

        emit FundsReleased(_escrowId, providerAmount, feeAmount);
    }

    function claimTimeout(uint256 _escrowId) external nonReentrant whenNotPaused {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.provider, "Only provider");
        require(e.status == Status.FUNDED, "Not FUNDED");
        require(e.accepted, "Provider never accepted");
        require(block.timestamp > e.timeoutDate, "Timeout not reached");

        e.status = Status.RELEASED;
        activeEscrowsByUser[e.client]--;

        uint256 feeAmount = (e.amount * e.feeBPS) / 10000;
        uint256 providerAmount = e.amount - feeAmount;

        totalLocked[e.token] -= e.amount;
        _credit(feeRecipient, e.token, feeAmount);
        _credit(e.provider, e.token, providerAmount);

        emit TimeoutClaimed(_escrowId, msg.sender);
        emit FundsReleased(_escrowId, providerAmount, feeAmount);
    }

    // --- Core: cancellation (only before provider acceptance) ---

    function cancelEscrow(uint256 _escrowId) external nonReentrant whenNotPaused {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.client, "Only client");
        require(e.status == Status.FUNDED && !e.accepted, "Cannot cancel");

        e.status = Status.CANCELLED;
        activeEscrowsByUser[e.client]--;

        totalLocked[e.token] -= e.amount;
        _credit(e.client, e.token, e.amount); // full refund, no fee

        emit EscrowCancelled(_escrowId, e.client, e.amount);
    }

    // --- Disputes ---

    function openDispute(uint256 _escrowId, bytes32 _evidenceHash) external nonReentrant {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.client || msg.sender == e.provider, "Not party to escrow");
        require(e.status == Status.FUNDED, "Not FUNDED");

        e.status = Status.DISPUTED;
        disputeOpenedAt[_escrowId] = block.timestamp;
        disputeOpener[_escrowId] = msg.sender;

        emit DisputeOpened(_escrowId, msg.sender, _evidenceHash);
    }

    function submitEvidence(uint256 _escrowId, bytes32 _evidenceHash) external {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.client || msg.sender == e.provider, "Not party to escrow");
        require(e.status == Status.DISPUTED, "Not DISPUTED");
        emit EvidenceSubmitted(_escrowId, msg.sender, _evidenceHash);
    }

    /**
     * @notice Resolves a dispute with a proportional split.
     * @param _providerBps Provider's share in basis points (10000 = 100% to provider).
     *        Fee is charged only on the provider's portion.
     * @dev NOT gated by whenNotPaused: a dispute must be resolvable even during a pause.
     */
    function resolveDispute(uint256 _escrowId, uint256 _providerBps) external onlyOwner nonReentrant {
        require(_providerBps <= 10000, "Invalid split");
        Escrow storage e = escrows[_escrowId];
        require(e.status == Status.DISPUTED, "Not DISPUTED");

        uint256 providerShare = (e.amount * _providerBps) / 10000;
        uint256 clientShare = e.amount - providerShare;
        uint256 feeAmount = (providerShare * e.feeBPS) / 10000;
        uint256 providerNet = providerShare - feeAmount;

        e.status = Status.RESOLVED;
        activeEscrowsByUser[e.client]--;
        totalLocked[e.token] -= e.amount;
        delete disputeOpenedAt[_escrowId];
        delete disputeOpener[_escrowId];

        _credit(feeRecipient, e.token, feeAmount);
        _credit(e.provider, e.token, providerNet);
        _credit(e.client, e.token, clientShare);

        emit DisputeResolved(_escrowId, _providerBps, providerNet, clientShare, feeAmount);
    }

    /**
     * @notice Resolves an abandoned (stale) dispute after staleDisputeTimeout has passed.
     *         Splits funds 50/50 – no party benefits from the other's inaction.
     * @dev    The timer is NOT paused when the contract is paused.
     */
    function resolveStaleDispute(uint256 _escrowId) external nonReentrant {
        Escrow storage e = escrows[_escrowId];
        require(e.status == Status.DISPUTED, "Not DISPUTED");
        require(msg.sender == e.client || msg.sender == e.provider, "Not party to escrow");
        require(block.timestamp > disputeOpenedAt[_escrowId] + staleDisputeTimeout, "Dispute not stale");

        e.status = Status.RESOLVED;
        activeEscrowsByUser[e.client]--;
        totalLocked[e.token] -= e.amount;
        delete disputeOpenedAt[_escrowId];
        delete disputeOpener[_escrowId];

        // 50/50 split – fee only on the provider's half
        uint256 providerShare = e.amount / 2;
        uint256 clientShare = e.amount - providerShare;
        uint256 feeAmount = (providerShare * e.feeBPS) / 10000;
        uint256 providerNet = providerShare - feeAmount;

        _credit(feeRecipient, e.token, feeAmount);
        _credit(e.provider, e.token, providerNet);
        _credit(e.client, e.token, clientShare);

        emit StaleDisputeResolved(_escrowId, msg.sender, providerNet);
    }

    // --- Pull-over-push settlement ---

    function _credit(address _user, address _token, uint256 _amount) internal {
        if (_amount == 0) return;
        withdrawable[_user][_token] += _amount;
        totalWithdrawable[_token] += _amount;
        emit Credited(_user, _token, _amount);
    }

    /**
     * @notice Withdraws owed funds for a single token.
     * @dev    NOT gated by whenNotPaused; users must always be able to retrieve their funds.
     */
    function withdraw(address _token) external nonReentrant {
        uint256 amount = withdrawable[msg.sender][_token];
        require(amount > 0, "Nothing to withdraw");

        withdrawable[msg.sender][_token] = 0;
        totalWithdrawable[_token] -= amount;

        IERC20(_token).safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, _token, amount);
    }

    /**
     * @notice Batch withdrawal across multiple tokens.
     *         Each transfer is isolated: a failure in one token does not block the others.
     */
    function batchWithdraw(address[] calldata _tokens) external nonReentrant {
        for (uint256 i = 0; i < _tokens.length; i++) {
            address token = _tokens[i];
            uint256 amount = withdrawable[msg.sender][token];
            if (amount > 0) {
                withdrawable[msg.sender][token] = 0;
                totalWithdrawable[token] -= amount;

                // Low-level call to handle non-standard tokens (e.g., USDT)
                (bool success, bytes memory data) = token.call(
                    abi.encodeWithSelector(IERC20.transfer.selector, msg.sender, amount)
                );
                bool transferOk = success && (data.length == 0 || abi.decode(data, (bool)));

                if (!transferOk) {
                    // Re-credit on failure so the user can try again later
                    withdrawable[msg.sender][token] += amount;
                    totalWithdrawable[token] += amount;
                } else {
                    emit Withdrawn(msg.sender, token, amount);
                }
            }
        }
    }

    // --- Bounded stuck-token recovery (cannot drain committed funds) ---

    /**
     * @notice Recovers tokens accidentally sent to the contract.
     *         Only the surplus (balance - totalLocked - totalWithdrawable) can be swept.
     */
    function recoverStuckTokens(address _token, address _to, uint256 _amount) external onlyOwner nonReentrant {
        require(_to != address(0), "Invalid recipient");
        uint256 bal = IERC20(_token).balanceOf(address(this));
        uint256 committed = totalLocked[_token] + totalWithdrawable[_token];
        require(bal > committed, "No surplus");
        require(_amount <= bal - committed, "Exceeds surplus");

        IERC20(_token).safeTransfer(_to, _amount);
        emit TokensRecovered(_token, _to, _amount);
    }

    // --- Views ---

    function getEscrowDetails(uint256 _escrowId) external view returns (
        address client, address provider, address token, string memory sym,
        uint256 amount, uint256 feeBPS, uint256 timeoutDate, Status status, bool accepted
    ) {
        Escrow storage e = escrows[_escrowId];
        require(e.client != address(0), "Escrow does not exist");
        return (e.client, e.provider, e.token, tokenConfigs[e.token].symbol, e.amount, e.feeBPS, e.timeoutDate, e.status, e.accepted);
    }

    /**
     * @notice Paginated view of active escrows for a user. Costly; intended for off-chain calls.
     *         For high volume, index events via The Graph rather than calling this on-chain.
     */
    function getActiveEscrowsByUser(address _user, uint256 _offset, uint256 _limit) external view returns (uint256[] memory) {
        uint256 total = escrowCounter;
        uint256[] memory temp = new uint256[](total);
        uint256 count = 0;

        for (uint256 i = 1; i <= total && count < _offset + _limit; i++) {
            Escrow storage e = escrows[i];
            if ((e.client == _user || e.provider == _user) && (e.status == Status.FUNDED || e.status == Status.DISPUTED)) {
                if (count >= _offset) temp[count - _offset] = i;
                count++;
            }
        }

        uint256 resultSize = count > _offset ? (count - _offset > _limit ? _limit : count - _offset) : 0;
        uint256[] memory result = new uint256[](resultSize);
        for (uint256 i = 0; i < resultSize; i++) result[i] = temp[i];
        return result;
    }

    function getActiveEscrowCount(address _user) external view returns (uint256) {
        return activeEscrowsByUser[_user];
    }

    function canClaimTimeout(uint256 _escrowId) external view returns (bool) {
        Escrow storage e = escrows[_escrowId];
        return e.status == Status.FUNDED && block.timestamp > e.timeoutDate;
    }

    function tokenSymbol(address _token) external view returns (string memory) {
        return tokenConfigs[_token].symbol;
    }

    // ABI-compatible alias for earlier versions
    function tokenSymbols(address _token) external view returns (string memory) {
        return tokenConfigs[_token].symbol;
    }

    function allowedTokens(address _token) external view returns (bool) {
        return tokenConfigs[_token].allowed;
    }
}

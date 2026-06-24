// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Standard compliant ERC20 (returns true). Acts as USDC/BUSD-like.
contract MockStandardToken is ERC20 {
    constructor(string memory n, string memory s) ERC20(n, s) {
        _mint(msg.sender, 1_000_000 ether);
    }
}

// Real-USDT-like: transfer/transferFrom return NO data (not a bool).
// SafeERC20 must tolerate this. We move funds, then return nothing via assembly.
contract MockNoReturnUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {
        _mint(msg.sender, 1_000_000 ether);
    }
    function transfer(address to, uint256 amount) public override returns (bool) {
        _transfer(_msgSender(), to, amount);
        assembly { return(0, 0) } // no return data, like Tether
    }
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _spendAllowance(from, _msgSender(), amount);
        _transfer(from, to, amount);
        assembly { return(0, 0) }
    }
}

// Liar token: actually MOVES funds but returns false. SafeERC20 must revert on this.
// Used to prove batchWithdraw does not double-credit when a token lies.
contract MockLiarToken is ERC20 {
    constructor() ERC20("Liar", "LIE") { _mint(msg.sender, 1_000_000 ether); }
    function transfer(address to, uint256 amount) public override returns (bool) {
        super.transfer(to, amount);
        return false;
    }
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        super.transferFrom(from, to, amount);
        return false;
    }
}

// Fee-on-transfer: deducts 3% on each transfer.
contract MockFeeOnTransferToken is ERC20 {
    uint256 public constant FEE_PERCENT = 3;
    constructor() ERC20("Fee Token", "FEE") { _mint(msg.sender, 1_000_000 ether); }
    function transfer(address to, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * FEE_PERCENT) / 100;
        return super.transfer(to, amount - fee);
    }
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * FEE_PERCENT) / 100;
        super.transferFrom(from, address(this), fee);
        super.transferFrom(from, to, amount - fee);
        return true;
    }
}

// Flaky: owner toggles revert on transfer. DEFAULT = false (healthy), opt-in to break.
contract MockFlakyToken is ERC20 {
    bool public shouldRevert = false;
    constructor() ERC20("Flaky Token", "FLKY") { _mint(msg.sender, 1_000_000 ether); }
    function setRevert(bool _r) external { shouldRevert = _r; }
    function transfer(address to, uint256 amount) public override returns (bool) {
        if (shouldRevert) revert("Flaky: transfer failed");
        return super.transfer(to, amount);
    }
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (shouldRevert) revert("Flaky: transferFrom failed");
        return super.transferFrom(from, to, amount);
    }
}

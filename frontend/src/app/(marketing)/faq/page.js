import Link from 'next/link';

export const metadata = {
  title: 'Frequently Asked Questions | JoobEscrow',
  description: 'Learn how JoobEscrow secures your funds and resolves disputes securely.',
};

export default function FAQPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked <span className="text-gradient">Questions</span></h1>
        <p className="text-gray-400 text-lg">Everything you need to know about how JoobEscrow secures your transactions.</p>
      </div>

      <div className="space-y-6">
        
        {/* Q1 */}
        <div className="glass-panel p-6">
          <h3 className="font-bold text-xl text-white mb-3">What if the smart contract has a bug?</h3>
          <p className="text-gray-400">
            The escrow contract (<code>UniversalServiceEscrow.sol</code>) is built on OpenZeppelin libraries and was audited by
            SpyWolf: no critical or high-severity issue, and every finding was fixed and re-checked. It uses pull-over-push
            payouts, reentrancy guards and a pause switch for emergencies (dispute resolution and withdrawals of credited funds keep
            working). An audit reduces risk but cannot rule out every bug: only escrow amounts you can afford to lose.
          </p>
        </div>

        {/* Q2 */}
        <div className="glass-panel p-6">
          <h3 className="font-bold text-xl text-white mb-3">Who resolves disputes and how?</h3>
          <p className="text-gray-400 mb-2">
            If the client and provider cannot agree, either party can open a dispute. During a dispute:
          </p>
          <ul className="list-disc pl-5 text-gray-400 space-y-1">
            <li>Both parties share their evidence (deliverables, messages, requirements). The contract can record a fingerprint (hash) of each piece of evidence on-chain; in-app evidence upload is coming.</li>
            <li>JoobEscrow&apos;s arbitration team acts as the impartial Owner.</li>
            <li>We review the evidence and split the funds fairly (e.g., 70% to provider, 30% to client) depending on the work delivered.</li>
          </ul>
        </div>

        {/* Q3 */}
        <div className="glass-panel p-6">
          <h3 className="font-bold text-xl text-white mb-3">What happens if the provider disappears?</h3>
          <p className="text-gray-400">
            Every escrow has a delivery deadline set at creation. If the provider never accepts, the client can cancel at any time and retrieve the full deposit.
            If the provider accepted but stops communicating without delivering, the client must open a dispute <strong>before the deadline</strong>:
            otherwise, after the deadline, the provider can trigger <code>claimTimeout</code>. Once a dispute is open, our arbitration team reviews the case to decide a fair split.
            If a dispute remains unresolved for 30 days, either party can call <code>resolveStaleDispute</code> on-chain to trigger a 50/50 fallback split, so funds are never permanently locked.
          </p>
        </div>

        {/* Q4 */}
        <div className="glass-panel p-6">
          <h3 className="font-bold text-xl text-white mb-3">Exactly what fees do I pay?</h3>
          <p className="text-gray-400">
            The fee depends entirely on the niche contract you are using. We offer contracts ranging from 2% to 10% fees. 
            <strong> The fee is ONLY deducted from the provider&apos;s final payout upon successful release.</strong> 
            There are zero hidden fees for creating or funding an escrow. If a project is canceled before the provider accepts, 
            the client gets a 100% refund (minus blockchain gas fees).
          </p>
        </div>

        {/* Q5 */}
        <div className="glass-panel p-6">
          <h3 className="font-bold text-xl text-white mb-3">Is my money safe? Can JoobEscrow access it?</h3>
          <p className="text-gray-400">
            JoobEscrow operates on non-custodial smart contracts audited by SpyWolf. We never hold your private keys, and the protocol has no function allowing the team to withdraw deposited escrow funds to arbitrary addresses. Funds can only be released upon client approval, claimed after the agreed deadline, or split by the multi-sig Safe strictly during dispute arbitration. As with any smart contract system, residual technical risks exist. Read our full disclosure on the <Link href="/risks" className="text-emerald-400 underline hover:text-emerald-300">Risks page</Link>.
          </p>
        </div>

        {/* Q6 */}
        <div className="glass-panel p-6">
          <h3 className="font-bold text-xl text-white mb-3">Are my messages and files secure? What is XMTP?</h3>
          <p className="text-gray-400">
            JoobEscrow integrates <strong>XMTP (Extensible Message Transport Protocol)</strong> for in-app communications. 
            All chat messages and shared links between client and provider are end-to-end encrypted directly between wallet identities, meaning neither JoobEscrow nor external third parties can read the content of your private conversations. 
            <br/><br/>
            Note that on-chain transactions, contract interactions, and wallet addresses remain publicly recorded on the BNB Smart Chain ledger.
          </p>
        </div>

      </div>

      <div className="mt-12 text-center">
        <Link href="/app" className="btn btn-primary px-8 py-3">
          Launch App
        </Link>
      </div>
    </div>
  );
}

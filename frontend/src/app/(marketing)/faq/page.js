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
            Every escrow has a delivery deadline. If the provider never accepts, the client can cancel and get a full refund.
            If the provider accepted but does not deliver, the client should open a dispute <strong>before the deadline</strong>:
            after it, a provider who accepted can claim the payment. Once a dispute is open, the arbitration team decides the split;
            if nobody resolves it within 30 days, either party can trigger a 50/50 split so funds are never locked forever.
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
            Your money is 100% safe. JoobEscrow is a non-custodial platform. We do not hold your private keys, and we cannot 
            withdraw your deposited funds for ourselves. The smart contract acts as an immutable vault that can only be unlocked 
            by the Client&apos;s approval, or by the Arbitrator strictly resolving a dispute between the two parties.
          </p>
        </div>

        {/* Q6 */}
        <div className="glass-panel p-6">
          <h3 className="font-bold text-xl text-white mb-3">Are my messages and files secure? What is XMTP?</h3>
          <p className="text-gray-400">
            Absolutely. JoobEscrow uses the <strong>XMTP (Extensible Message Transport Protocol)</strong> for all in-app communications. 
            This means every message, link, or file you share with the other party is <strong>End-to-End Encrypted</strong> and tied directly to your wallet addresses. 
            <br/><br/>
            Because it is decentralized, neither JoobEscrow nor any third party can read your messages. It guarantees total privacy for your negotiations and deliverables.
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

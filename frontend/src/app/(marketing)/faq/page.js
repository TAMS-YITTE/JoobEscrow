import Link from 'next/link';

export const metadata = {
  title: 'Frequently Asked Questions | JoobEscrow',
  description: 'Learn how JoobEscrow secures your funds and resolves disputes in a decentralized way.',
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
            Our smart contract (`UniversalServiceEscrow.sol`) is based on industry standards (OpenZeppelin) and has been 
            rigorously audited by an independent security firm (SpyWolf). We implement maximum safety measures such as 
            pull-over-push accounting, Reentrancy Guards, and emergency pause mechanisms to prevent any loss of funds.
          </p>
        </div>

        {/* Q2 */}
        <div className="glass-panel p-6">
          <h3 className="font-bold text-xl text-white mb-3">Who resolves disputes and how?</h3>
          <p className="text-gray-400 mb-2">
            If the client and provider cannot agree, either party can open a dispute. During a dispute:
          </p>
          <ul className="list-disc pl-5 text-gray-400 space-y-1">
            <li>Both parties submit their evidence to the blockchain via a cryptographic hash (e.g., an IPFS link).</li>
            <li>JoobEscrow&apos;s arbitration team acts as the impartial Owner.</li>
            <li>We review the evidence and split the funds fairly (e.g., 70% to provider, 30% to client) depending on the work delivered.</li>
          </ul>
        </div>

        {/* Q3 */}
        <div className="glass-panel p-6">
          <h3 className="font-bold text-xl text-white mb-3">What happens if the provider disappears?</h3>
          <p className="text-gray-400">
            Every escrow is created with a strict timeout period. If the provider accepts the job but then disappears, they 
            will fail to complete the work before the timeout date. In this scenario, either a dispute can be opened, or 
            if no action is taken, the funds are handled through our stale dispute and timeout fallback mechanisms to protect the client.
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

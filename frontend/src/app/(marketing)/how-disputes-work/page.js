import Link from 'next/link';

export const metadata = {
  title: 'How Disputes Work | JoobEscrow',
  description: 'Understand the lifecycle of a dispute and how our arbitration process ensures fairness.',
};

export default function HowDisputesWorkPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">How <span className="text-gradient">Disputes</span> Work</h1>
        <p className="text-gray-400 text-lg">A transparent look into our impartial arbitration lifecycle.</p>
      </div>

      {/* Visual Timeline */}
      <div className="relative border-l-2 border-gray-700 ml-4 md:ml-8 space-y-12 mb-16">
        
        {/* Step 1: Open Dispute */}
        <div className="relative pl-8">
          <div className="absolute w-6 h-6 bg-red-500/20 border-2 border-red-500 rounded-full -left-[13px] top-1"></div>
          <h3 className="text-2xl font-bold text-white mb-2">1. Open a Dispute</h3>
          <p className="text-gray-400 mb-4">
            If the client and provider cannot reach an agreement, either party can trigger the <code>openDispute(id, evidenceHash)</code> function on the smart contract.
          </p>
          <div className="glass-panel p-4 inline-block text-sm">
            <span className="text-red-400 font-bold">Status changes to:</span> <span className="px-2 py-1 bg-red-900/50 text-red-200 rounded text-xs ml-2">DISPUTED</span>
          </div>
        </div>

        {/* Step 2: Submit Evidence */}
        <div className="relative pl-8">
          <div className="absolute w-6 h-6 bg-blue-500/20 border-2 border-blue-500 rounded-full -left-[13px] top-1"></div>
          <h3 className="text-2xl font-bold text-white mb-2">2. Submit Evidence</h3>
          <p className="text-gray-400 mb-4">
            Both parties have the opportunity to submit their proof of work or proof of failure. This evidence is anchored on-chain 
            via a cryptographic hash (e.g., an IPFS CID containing chat logs, deliverables, and requirements).
          </p>
        </div>

        {/* Step 3: Arbitration & Split */}
        <div className="relative pl-8">
          <div className="absolute w-6 h-6 bg-purple-500/20 border-2 border-purple-500 rounded-full -left-[13px] top-1"></div>
          <h3 className="text-2xl font-bold text-white mb-2">3. Arbitration & Resolution</h3>
          <p className="text-gray-400 mb-4">
            Our specialized arbitration team reviews the immutable evidence. We use the <code>resolveDispute(id, providerBps)</code> function 
            to enforce a fair split based on the work completed.
          </p>
          <div className="glass-panel p-4 text-sm text-gray-300">
            <strong>Example Split:</strong> If the provider finished 80% of the milestone before the dispute, the contract 
            routes 80% of the funds to the provider and refunds 20% back to the client.
          </div>
        </div>

        {/* Step 4: Stale Timeout (Fallback) */}
        <div className="relative pl-8">
          <div className="absolute w-6 h-6 bg-gray-500/20 border-2 border-gray-500 rounded-full -left-[13px] top-1"></div>
          <h3 className="text-2xl font-bold text-white mb-2">4. Stale Dispute Fallback</h3>
          <p className="text-gray-400">
            If a dispute is opened but abandoned by all parties for 30 days, the smart contract activates a stale dispute 
            fallback mechanism. It automatically splits the locked funds <strong>50/50</strong> between the client and provider, 
            ensuring funds are never locked forever.
          </p>
        </div>

      </div>

      <div className="text-center">
        <Link href="/faq" className="text-gray-400 hover:text-white underline">
          Back to FAQ
        </Link>
      </div>
    </div>
  );
}

import React from 'react';

export const metadata = {
  title: 'Regulatory & Compliance | JoobEscrow',
  description: 'Information regarding JoobEscrow\'s regulatory positioning, arbitration role, and non-custodial nature.',
};

export default function CompliancePage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Regulatory & <span className="text-gradient">Compliance</span></h1>
        <p className="text-gray-400 text-lg">Transparent information about our protocol, our role, and user responsibilities.</p>
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-8 border-blue-500/30 bg-blue-900/10">
          <h2 className="text-xl font-bold text-white mb-3">1. Non-Custodial Software Protocol</h2>
          <p className="text-gray-400">
            JoobEscrow is a non-custodial software protocol deployed on the BNB Smart Chain (BSC). <strong>We do not take custody of your funds.</strong> All funds are locked and managed autonomously by immutable smart contracts. JoobEscrow does not provide investment services, financial advice, or portfolio management. Our service is strictly limited to providing a technological infrastructure for escrow and an optional arbitration layer.
          </p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold text-white mb-3">2. The Role of the Arbitrator</h2>
          <p className="text-gray-400 mb-4">
            While the protocol is non-custodial, it is not entirely trustless in the event of a dispute. The JoobEscrow Administrator acts as an impartial arbitrator. If a dispute is raised by either party, the Administrator reviews the provided evidence and has the technical capability to:
          </p>
          <ul className="list-disc pl-6 text-gray-400 space-y-2 mb-4">
            <li>Release the funds to the Provider (payment).</li>
            <li>Return the funds to the Client (refund).</li>
            <li>Split the funds equally between both parties (50/50).</li>
          </ul>
          <p className="text-gray-400">
            <strong>Stale Dispute Fallback:</strong> To prevent funds from being locked indefinitely if the arbitrator becomes unavailable, the smart contract includes a fallback mechanism. If a dispute remains unresolved for 30 days, any party can trigger a forced 50/50 split to unlock the funds.
          </p>
          <p className="text-gray-400 mt-4">
            <strong>Timelock Security:</strong> Any critical changes to the smart contract parameters (such as updating the fee recipient address) are protected by a mandatory 2-day (48-hour) Timelock, ensuring transparency and preventing sudden malicious alterations.
          </p>
        </div>

        <div className="glass-panel p-8 border-yellow-500/30 bg-yellow-900/10">
          <h2 className="text-xl font-bold text-yellow-500 mb-3">3. Eligibility and User Responsibility</h2>
          <p className="text-gray-400">
            Users are solely responsible for ensuring that their use of JoobEscrow complies with all applicable laws and regulations in their respective jurisdictions. The availability of this interface does not constitute an offer or solicitation to use our services in any jurisdiction where such use would be illegal. 
            <br/><br/>
            <strong>Nothing on this website should be construed as financial, legal, or investment advice.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';

export const metadata = {
  title: 'Risks & Disclaimers | JoobEscrow',
  description: 'Understand the risks involved in using JoobEscrow. We believe in 100% transparency.',
};

export default function RisksPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Risks & <span className="text-gradient">Disclaimers</span></h1>
        <p className="text-gray-400 text-lg">We believe in absolute transparency. Before using JoobEscrow, please read and understand the following risks.</p>
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold text-white mb-3">1. Smart Contract Risk</h2>
          <p className="text-gray-400">
            While our smart contracts have been rigorously audited by SpyWolf (a reputable Web3 security firm), there is always a non-zero risk of undiscovered vulnerabilities in any software. If a critical bug is exploited, funds locked in the escrow could be lost. We mitigate this through continuous monitoring and our Bug Bounty program.
          </p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold text-white mb-3">2. Non-Custodial Nature</h2>
          <p className="text-gray-400">
            JoobEscrow is a decentralized, non-custodial protocol. We do not have access to your private keys, nor can we arbitrarily move your funds outside of the strict rules defined by the smart contract. If you lose access to your wallet, JoobEscrow cannot recover your funds.
          </p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold text-white mb-3">3. Irreversibility of Blockchain Transactions</h2>
          <p className="text-gray-400">
            Transactions on the BNB Smart Chain (BSC) are permanent and irreversible. If you release funds to a provider prematurely, or send funds to the wrong address, those actions cannot be undone by JoobEscrow or anyone else. Always double-check contract addresses and wallet addresses before signing a transaction.
          </p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold text-white mb-3">4. Asset Volatility</h2>
          <p className="text-gray-400">
            While we primarily support stablecoins like USDT to mitigate volatility, the underlying blockchain networks and assets are subject to extreme market fluctuations. JoobEscrow is not responsible for any loss of purchasing power that occurs while funds are locked in escrow.
          </p>
        </div>

        <div className="glass-panel p-8 border-yellow-500/30 bg-yellow-900/10">
          <h2 className="text-xl font-bold text-yellow-500 mb-3">5. Administrator Dispute Resolution</h2>
          <p className="text-gray-400">
            In the event of a dispute, the JoobEscrow administrator acts as a neutral third party to resolve it based on the evidence provided. By using the platform, you agree to abide by the administrator&apos;s final decision. If the administrator is unavailable for a prolonged period, the protocol has a &quot;stale dispute&quot; fallback that allows anyone to force a 50/50 split of the funds.
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/security" className="btn btn-outline mr-4">
          View Security Audit
        </Link>
        <Link href="/app" className="btn btn-primary">
          I Understand, Continue to App
        </Link>
      </div>
    </div>
  );
}

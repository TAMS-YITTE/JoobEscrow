import Link from 'next/link';

export const metadata = {
  title: 'Bug Bounty Program | JoobEscrow',
  description: 'Help us secure Web3 freelancing. Earn rewards for finding vulnerabilities in JoobEscrow smart contracts.',
};

export default function BugBountyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Bug <span className="text-gradient">Bounty</span></h1>
        <p className="text-gray-400 text-lg">Security is our top priority. We reward security researchers who help us keep JoobEscrow safe.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="glass-panel p-6 text-center border-red-500/30 bg-red-900/10">
          <h3 className="text-red-400 font-bold mb-2">Critical</h3>
          <p className="text-3xl font-black text-white mb-2">TBD</p>
          <p className="text-xs text-gray-400">Theft of funds, unauthorized releases, permanent freezing of user funds.</p>
        </div>
        <div className="glass-panel p-6 text-center border-yellow-500/30 bg-yellow-900/10">
          <h3 className="text-yellow-400 font-bold mb-2">High</h3>
          <p className="text-3xl font-black text-white mb-2">TBD</p>
          <p className="text-xs text-gray-400">Bypassing dispute logic, manipulation of fee calculations.</p>
        </div>
        <div className="glass-panel p-6 text-center border-blue-500/30 bg-blue-900/10">
          <h3 className="text-blue-400 font-bold mb-2">Medium / Low</h3>
          <p className="text-3xl font-black text-white mb-2">TBD</p>
          <p className="text-xs text-gray-400">Smart contract logic errors that do not lead to direct loss of funds, gas griefing.</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-white mb-4">In Scope</h2>
          <ul className="list-disc pl-5 text-gray-400 space-y-2">
            <li><code>UniversalServiceEscrow.sol</code> - Main Escrow Logic</li>
            <li>Token handling, Fee extraction, and Timelock governance</li>
          </ul>
          <p className="text-gray-400 mt-4 italic">Note: The frontend codebase and website infrastructure are currently OUT OF SCOPE for monetary rewards, unless the vulnerability directly enables the theft of user funds via wallet interaction.</p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Out of Scope</h2>
          <ul className="list-disc pl-5 text-gray-400 space-y-2">
            <li>Attacks requiring compromised user private keys.</li>
            <li>Social engineering or phishing attacks against JoobEscrow staff or users.</li>
            <li>Vulnerabilities in third-party libraries (e.g., OpenZeppelin) unless used insecurely by our code.</li>
            <li>Issues already documented in our SpyWolf Audit Report.</li>
          </ul>
        </div>

        <div className="glass-panel p-8 text-center bg-green-900/10 border-green-500/30">
          <h2 className="text-2xl font-bold text-white mb-4">How to Report</h2>
          <p className="text-gray-400 mb-6">
            If you have found a vulnerability, please do NOT disclose it publicly. Email our security team directly with a detailed PoC (Proof of Concept).
          </p>
          <a href="mailto:security@joobescrow.com" className="text-xl font-bold text-green-400 hover:text-green-300 underline">
            security@joobescrow.com
          </a>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/security" className="text-gray-500 hover:text-white transition">
          ← Back to Security Page
        </Link>
      </div>
    </div>
  );
}

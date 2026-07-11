'use client';

import { useNiche } from '../context/NicheContext';

export default function SecurityBanner() {
  const niche = useNiche();
  
  if (!niche) return null;

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '56';
  const explorerUrl = chainId === '56' 
    ? `https://bscscan.com/address/${niche.contractAddress}`
    : `https://testnet.bscscan.com/address/${niche.contractAddress}`;

  return (
    <div className="bg-yellow-900/30 border border-yellow-500/30 text-yellow-200 p-3 md:p-4 rounded-xl mb-6 text-sm flex items-start gap-3 relative overflow-hidden shadow-lg backdrop-blur-sm">
      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
      <span className="text-xl">⚠️</span>
      <div>
        <p className="mb-1 leading-relaxed">
          <strong>Seeing an "untrusted contract" warning?</strong> That's normal for a new platform — our contracts just aren't listed in every wallet's database yet. Funds are non-custodial and only ever go to you or your counterparty.
        </p>
        <p className="mt-2 text-yellow-400 font-medium flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-yellow-200/50">Verify us anytime:</span>
          <a href="#" className="hover:text-yellow-300 underline decoration-yellow-500/50 transition-colors">Audit (Soon)</a>
          <a href="#" className="hover:text-yellow-300 underline decoration-yellow-500/50 transition-colors">Multisig (Soon)</a>
          <a href={explorerUrl} target="_blank" rel="noreferrer" className="hover:text-yellow-300 underline decoration-yellow-500/50 transition-colors">BscScan Contract</a>
        </p>
      </div>
    </div>
  );
}

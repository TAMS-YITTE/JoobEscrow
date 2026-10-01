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
    <div className="security-banner">
      <span className="security-banner-icon">⚠️</span>
      <div>
        <p>
          <strong>Seeing an &quot;untrusted contract&quot; warning?</strong>{' '}That&apos;s normal for a new platform — our contracts just aren&apos;t listed in every wallet&apos;s database yet. Funds are non-custodial and only ever go to you or your counterparty.
        </p>
        <p className="security-banner-links">
          <span>Verify us anytime:</span>
          <a href="https://spywolf.co/audits/Universal_Service_Escrow_V4_Audit.pdf" target="_blank" rel="noreferrer">Audit Report</a>
          <a href="https://app.safe.global/home?safe=bnb:0x872F979aa868145bE3c3A6EA787614BE2A18C7f7" target="_blank" rel="noreferrer">Multisig Safe</a>
          <a href={explorerUrl} target="_blank" rel="noreferrer">BscScan Contract</a>
        </p>
      </div>
    </div>
  );
}

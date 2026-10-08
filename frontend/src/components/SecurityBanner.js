'use client';

import { useSyncExternalStore, useState, useCallback } from 'react';
import { useNiche } from '../context/NicheContext';

const STORAGE_KEY = 'joob_security_banner_dismissed';

function subscribe(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

export default function SecurityBanner() {
  const niche = useNiche();
  const isStoredDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [localDismissed, setLocalDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setLocalDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
      window.dispatchEvent(new Event('storage'));
    } catch {
      /* ignore */
    }
  }, []);

  if (!niche || isStoredDismissed || localDismissed) return null;

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '56';
  const explorerUrl = chainId === '56'
    ? `https://bscscan.com/address/${niche.contractAddress}`
    : `https://testnet.bscscan.com/address/${niche.contractAddress}`;

  return (
    <div className="security-banner">
      <svg className="security-banner-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <div className="security-banner-body">
        <span className="security-banner-text">
          <strong>Seeing an &quot;untrusted contract&quot; warning?</strong>{' '}
          That&apos;s normal for a new platform — our contracts just aren&apos;t listed in every wallet&apos;s database yet. Funds are non-custodial and only ever go to you or your counterparty.
        </span>
        <span className="security-banner-links">
          <span className="security-banner-verify">Verify us anytime:</span>
          <a href="https://spywolf.co/audits/Universal_Service_Escrow_V4_Audit.pdf" target="_blank" rel="noreferrer">Audit Report</a>
          <span className="security-banner-sep">·</span>
          <a href="https://app.safe.global/home?safe=bnb:0x872F979aa868145bE3c3A6EA787614BE2A18C7f7" target="_blank" rel="noreferrer">Multisig Safe</a>
          <span className="security-banner-sep">·</span>
          <a href={explorerUrl} target="_blank" rel="noreferrer">BscScan Contract</a>
        </span>
      </div>
      <button type="button" onClick={handleDismiss} className="security-banner-close" aria-label="Dismiss security notice">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

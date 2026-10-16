'use client';

import { usePathname } from 'next/navigation';
import { useWeb3 } from '../context/Web3Context';

// Pages consultables sans wallet (profils publics des partenaires KOL, roadmap, vue des categories).
const PUBLIC_PATH = /^\/([^/]+\/(kol\/[^/]+|whats-next)|app)\/?$/;

export default function AppGuard({ children }) {
  const { account, error, isTestnet, connectWallet } = useWeb3();
  const isPublic = PUBLIC_PATH.test(usePathname() || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {isTestnet && (
        <div style={{ background: '#ef4444', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          You are on BSC Testnet. Funds used are not real.
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', textAlign: 'center', borderBottom: '1px solid #ef4444' }}>
          {error}
        </div>
      )}
      {!account && !isPublic ? (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div className="glass-panel connect-card">
            <div className="connect-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="connect-title">Connect your <span className="text-gradient">wallet</span></h2>
            <p className="connect-text">
              Please connect your Web3 wallet (MetaMask, TrustWallet) to access the dashboard, manage your contracts, and secure your transactions.
            </p>
            <ul className="connect-points">
              <li>Funds locked in an audited contract</li>
              <li>0% fee for the client</li>
              <li>We never ask for your seed phrase</li>
            </ul>
            <button className="btn btn-primary btn-lg" onClick={connectWallet}>
              Connect Wallet
            </button>
            <div className="connect-powered">Powered by Reown · 700+ wallets</div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          {children}
        </div>
      )}
    </div>
  );
}

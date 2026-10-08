'use client';

import { usePathname } from 'next/navigation';
import { useWeb3 } from '../context/Web3Context';

// Pages consultables sans wallet (profils publics des partenaires KOL).
const PUBLIC_PATH = /^\/[^/]+\/(kol\/[^/]+|whats-next)\/?$/;

export default function AppGuard({ children }) {
  const { account, error, isTestnet, connectWallet } = useWeb3();
  const isPublic = PUBLIC_PATH.test(usePathname() || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {isTestnet && (
        <div style={{ background: '#ef4444', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          ⚠️ You are on BSC Testnet. Funds used are not real.
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
            <div className="connect-icon" aria-hidden="true">🔐</div>
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

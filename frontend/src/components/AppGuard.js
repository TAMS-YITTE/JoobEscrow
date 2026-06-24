'use client';

import { useWeb3 } from '../context/Web3Context';

export default function AppGuard({ children }) {
  const { account, error, isTestnet, connectWallet } = useWeb3();

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
      {!account ? (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
            <h2 style={{ marginBottom: '15px' }}>Wallet Not Connected</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', lineHeight: 1.6 }}>
              Please connect your Web3 wallet (MetaMask, TrustWallet) to access the dashboard, manage your contracts, and secure your transactions.
            </p>
            <button className="btn btn-primary" onClick={connectWallet} style={{ fontSize: '1.1rem', padding: '12px 30px' }}>
              Connect Wallet
            </button>
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

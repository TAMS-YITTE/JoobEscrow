'use client';
import { useDisconnect } from '@reown/appkit/react';
import './WalletConnect.css';

export default function WalletConnect() {
  const { disconnect } = useDisconnect();
  
  return (
    <div className="wallet-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <appkit-button />
      <button 
        onClick={() => disconnect()} 
        style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
      >
        Disconnect
      </button>
    </div>
  );
}

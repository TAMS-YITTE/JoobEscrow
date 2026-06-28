'use client';
import { useDisconnect, useAppKitAccount, useAppKit } from '@reown/appkit/react';
import './WalletConnect.css';

export default function WalletConnect() {
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAppKitAccount();
  const { open } = useAppKit();
  
  return (
    <div className="wallet-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
      
      {isConnected ? (
        <button 
          onClick={() => open()}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'var(--panel-bg, #1e293b)', 
            borderRadius: '24px', 
            padding: '4px 16px 4px 4px', 
            border: '1px solid var(--border-color, #334155)', 
            cursor: 'pointer',
            color: 'white',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#334155'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--panel-bg, #1e293b)'}
        >
          <img src="/logo.png" alt="JoobEscrow" style={{ width: '28px', height: '28px', borderRadius: '50%', marginRight: '8px', objectFit: 'cover' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: '500', fontFamily: 'monospace' }}>
            {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}
          </span>
        </button>
      ) : (
        <appkit-button />
      )}

      {isConnected && (
        <button 
          onClick={() => disconnect()} 
          title="Disconnect"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'var(--panel-bg, #1e293b)', 
            border: '1px solid var(--border-color, #334155)', 
            cursor: 'pointer', 
            color: '#ef4444',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--panel-bg, #1e293b)'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      )}
    </div>
  );
}

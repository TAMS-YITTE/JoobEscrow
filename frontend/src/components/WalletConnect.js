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
            background: 'var(--app-surface-2, #171E1A)', 
            borderRadius: '24px', 
            padding: '4px 14px 4px 4px', 
            border: '1px solid var(--app-border-default, #2A362E)', 
            cursor: 'pointer',
            color: 'var(--app-text-primary, #F2F5F3)',
            transition: 'background 0.2s ease, border-color 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--app-surface-3, #1F2923)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--app-surface-2, #171E1A)'; }}
        >
          <img src="/logo.svg" alt="JoobEscrow" style={{ width: '28px', height: '28px', borderRadius: '50%', marginRight: '8px', objectFit: 'cover' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: '500', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}
          </span>
        </button>
      ) : (
        <button
          onClick={() => open()}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '24px',
            padding: '10px 20px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
          </svg>
          Connect Wallet
        </button>
      )}

      {isConnected && (
        <button 
          onClick={() => disconnect()} 
          title="Disconnect"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '38px', 
            height: '38px', 
            borderRadius: '50%', 
            background: 'var(--app-surface-2, #171E1A)', 
            border: '1px solid rgba(239, 68, 68, 0.35)', 
            cursor: 'pointer', 
            color: 'var(--app-red, #EF4444)',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--app-surface-2, #171E1A)'; }}
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

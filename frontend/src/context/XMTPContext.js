'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Client, IdentifierKind } from '@xmtp/browser-sdk';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Context';

const XMTPContext = createContext();

export function XMTPProviderWrapper({ children }) {
  // Le client XMTP est lie au wallet qui l'a cree : on garde son adresse avec lui.
  const [session, setSession] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { account } = useWeb3();
  // Si le compte change ou se deconnecte, on n'expose plus l'ancien client,
  // sinon les messages partiraient sous l'identite du compte precedent.
  const client = session && account && session.address === account.toLowerCase() ? session.client : null;

  useEffect(() => {
    // Polyfill Buffer for XMTP
    if (typeof window !== 'undefined' && !window.Buffer) {
      window.Buffer = require('buffer').Buffer;
    }
  }, []);

  const initialize = async (ethersSigner) => {
    if (!ethersSigner) return null;
    setIsInitializing(true);
    try {
      const address = await ethersSigner.getAddress();
      
      // Build the Signer expected by V3
      const v3Signer = {
        type: 'EOA',
        getIdentifier: () => ({ 
          identifier: address.toLowerCase(), 
          identifierKind: IdentifierKind.Ethereum 
        }),
        signMessage: async (message) => {
          const sig = await ethersSigner.signMessage(message);
          return ethers.getBytes(sig); // Must be a Uint8Array in V3
        }
      };

      // Create native browser SDK Client V3
      const xmtpClient = await Client.create(v3Signer, { env: "production" });
      setSession({ client: xmtpClient, address: address.toLowerCase() });
      setIsInitializing(false);
      return xmtpClient;
    } catch (err) {
      console.error("XMTP V3 initialization failed", err);
      setIsInitializing(false);
      throw err;
    }
  };

  return (
    <XMTPContext.Provider value={{ client, initialize, isInitializing }}>
      {children}
    </XMTPContext.Provider>
  );
}

export function useXMTP() {
  return useContext(XMTPContext);
}

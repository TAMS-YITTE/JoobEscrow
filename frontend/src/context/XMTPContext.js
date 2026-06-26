'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Client, IdentifierKind } from '@xmtp/browser-sdk';
import { ethers } from 'ethers';

const XMTPContext = createContext();

export function XMTPProviderWrapper({ children }) {
  const [client, setClient] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

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
      
      // Construire le Signer attendu par la V3
      const v3Signer = {
        type: 'EOA',
        getIdentifier: () => ({ 
          identifier: address.toLowerCase(), 
          identifierKind: IdentifierKind.Ethereum 
        }),
        signMessage: async (message) => {
          const sig = await ethersSigner.signMessage(message);
          return ethers.getBytes(sig); // Doit être un Uint8Array en V3
        }
      };

      // Create native browser SDK Client V3
      const xmtpClient = await Client.create(v3Signer, { env: "production" });
      setClient(xmtpClient);
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

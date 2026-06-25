'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Client } from '@xmtp/browser-sdk';

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

  const initialize = async (signer) => {
    if (!signer) return null;
    setIsInitializing(true);
    try {
      // Create native browser SDK Client
      const xmtpClient = await Client.create(signer, { env: "production" });
      setClient(xmtpClient);
      setIsInitializing(false);
      return xmtpClient;
    } catch (err) {
      console.error("XMTP initialization failed", err);
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

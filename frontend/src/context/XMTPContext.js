'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Client, IdentifierKind } from '@xmtp/browser-sdk';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Context';

const XMTPContext = createContext();

export function XMTPProviderWrapper({ children }) {
  // Un client XMTP par wallet (adresse en minuscules) : apres un changement de compte,
  // on n'expose que le client du compte connecte, jamais celui du compte precedent.
  const [sessions, setSessions] = useState({});
  const [isInitializing, setIsInitializing] = useState(false);
  const { account } = useWeb3();
  const addr = account ? account.toLowerCase() : null;
  const client = addr ? sessions[addr] || null : null;

  // Reconnexion silencieuse : si ce navigateur a deja active le chat pour ce wallet,
  // on rouvre la base locale sans nouvelle signature, et l'historique reste visible.
  useEffect(() => {
    if (!addr || sessions[addr]) return;
    let cancelled = false;
    (async () => {
      try {
        const restored = await Client.build({ identifier: addr, identifierKind: IdentifierKind.Ethereum }, { env: 'production' });
        if (!cancelled && (await restored.isRegistered())) {
          setSessions((prev) => ({ ...prev, [addr]: restored }));
        } else {
          restored.close?.();
        }
      } catch (e) {
        // Pas encore active dans ce navigateur : l'utilisateur clique sur "Activate Chat".
      }
    })();
    return () => { cancelled = true; };
  }, [addr, sessions]);

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
      setSessions((prev) => ({ ...prev, [address.toLowerCase()]: xmtpClient }));
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

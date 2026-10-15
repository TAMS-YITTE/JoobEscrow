'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Client, IdentifierKind } from '@xmtp/browser-sdk';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Context';

const XMTPContext = createContext();

export function XMTPProviderWrapper({ children }) {
  // Un seul client XMTP ouvert a la fois : deux clients dans la meme page se disputent
  // la base locale (OPFS) et bloquent. On garde l'adresse du wallet avec son client.
  const [session, setSession] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { account } = useWeb3();
  const addr = account ? account.toLowerCase() : null;
  // Jamais le client d'un autre compte : sinon les messages partiraient sous la mauvaise identite.
  const client = session && session.address === addr ? session.client : null;

  // Changement de compte : on ferme le client precedent, puis on rouvre en silence
  // celui du nouveau compte s'il a deja active le chat dans ce navigateur (sans signature).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (session && session.address !== addr) {
        try { await session.client.close?.(); } catch (e) {}
        if (!cancelled) setSession(null);
        return;
      }
      if (!addr || session) return;
      // Seulement si ce navigateur a deja active le chat pour ce wallet : evite de charger
      // XMTP (wasm ~11 Mo) pour chaque visiteur connecte qui n'utilise pas le chat.
      let activatedHere = false;
      try { activatedHere = localStorage.getItem(`xmtp:activated:${addr}`) === '1'; } catch (e) {}
      if (!activatedHere) return;
      try {
        const restored = await Client.build({ identifier: addr, identifierKind: IdentifierKind.Ethereum }, { env: 'production' });
        if (!cancelled && (await restored.isRegistered())) {
          setSession({ address: addr, client: restored });
        } else {
          await restored.close?.();
        }
      } catch (e) {
        // Pas encore active dans ce navigateur : l'utilisateur clique sur "Activate Chat".
      }
    })();
    return () => { cancelled = true; };
  }, [addr, session]);

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

      // Ferme le client deja ouvert (meme base OPFS) avant d'en creer un nouveau.
      if (session) {
        try { await session.client.close?.(); } catch (e) {}
      }

      // Create native browser SDK Client V3
      const xmtpClient = await Client.create(v3Signer, { env: "production" });
      setSession({ address: address.toLowerCase(), client: xmtpClient });
      try { localStorage.setItem(`xmtp:activated:${address.toLowerCase()}`, '1'); } catch (e) {}
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

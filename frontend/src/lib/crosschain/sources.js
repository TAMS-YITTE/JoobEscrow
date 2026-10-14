// Catalogue des moyens de paiement : par chaine EVM, le token natif + USDT/USDC
// (+ ARB sur Arbitrum, OP sur Optimism). USDT/USDC sur BSC = achat direct.
import { ChainType, getChains, getTokens } from '@lifi/sdk';
import { useEffect, useState } from 'react';
import { PRESALE_ADDRESSES } from '../../config/presale';
import { BSC_CHAIN_ID, lifiReadClient } from './lifi';

// EVM uniquement : LI.FI n'execute pas l'appel buyFor() a l'arrivee quand le
// paiement part de Solana, Bitcoin, Tron ou Sui.
export const SOURCE_CHAINS = [BSC_CHAIN_ID, 1, 42161, 8453, 137, 10, 43114];
const STABLES = ['USDT', 'USDC'];
const CHAIN_TOKENS = { 42161: ['ARB'], 10: ['OP'] };
// USDT s'appelle USDT0 sur Arbitrum.
const COIN_ALIASES = { USDT0: 'USDT' };
const coinOf = (t) => (t.coinKey ? COIN_ALIASES[t.coinKey] ?? t.coinKey : undefined);
export const NATIVE = '0x0000000000000000000000000000000000000000';

/**
 * Source : { chainId, chainName, chainLogoURI, address, symbol, logoURI,
 * decimals, priceUSD, direct ('USDT' | 'USDC' sur BSC : achat direct, sans bridge) }
 */
function toSource(chain, token, symbol) {
  const isBsc = chain.id === BSC_CHAIN_ID;
  const addr = token.address.toLowerCase();
  const direct = isBsc && addr === PRESALE_ADDRESSES.USDT.toLowerCase() ? 'USDT'
    : isBsc && addr === PRESALE_ADDRESSES.USDC.toLowerCase() ? 'USDC' : undefined;
  return {
    chainId: chain.id, chainName: chain.name, chainLogoURI: chain.logoURI,
    address: token.address, symbol, logoURI: token.logoURI, decimals: token.decimals,
    priceUSD: Number(token.priceUSD) || undefined, direct,
  };
}

let cache = null;
export function loadCatalog() {
  cache ??= (async () => {
    const client = lifiReadClient();
    const [allChains, tokens] = await Promise.all([
      getChains(client, { chainTypes: [ChainType.EVM] }),
      getTokens(client, { chains: SOURCE_CHAINS }),
    ]);
    const chains = SOURCE_CHAINS.map((id) => allChains.find((c) => c.id === id)).filter(Boolean);
    const rows = [];
    for (const chain of chains) {
      const list = tokens.tokens[chain.id] ?? [];
      const pick = (key) => list.find((t) => coinOf(t) === key && t.symbol === key) ?? list.find((t) => coinOf(t) === key);
      const seen = new Set();
      const push = (token, symbol) => {
        if (!token || seen.has(token.address.toLowerCase())) return;
        seen.add(token.address.toLowerCase());
        rows.push(toSource(chain, token, symbol));
      };
      if (chain.id === BSC_CHAIN_ID) {
        // Les tokens de paiement de la vente d'abord : ce sont ceux de l'achat direct.
        push(list.find((t) => t.address.toLowerCase() === PRESALE_ADDRESSES.USDT.toLowerCase()), 'USDT');
        push(list.find((t) => t.address.toLowerCase() === PRESALE_ADDRESSES.USDC.toLowerCase()), 'USDC');
      }
      for (const key of STABLES) push(pick(key), key);
      if (chain.nativeToken) push(chain.nativeToken, chain.nativeToken.symbol);
      for (const key of CHAIN_TOKENS[chain.id] ?? []) push(pick(key), key);
    }
    return { chains, rows };
  })().catch((err) => { cache = null; throw err; });
  return cache;
}

export function useCatalog() {
  const [catalog, setCatalog] = useState(null);
  useEffect(() => {
    let alive = true;
    loadCatalog().then((c) => { if (alive) setCatalog(c); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return catalog;
}

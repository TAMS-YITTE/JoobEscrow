import { useEffect, useState } from 'react';
import { createPublicClient, erc20Abi, http } from 'viem';
import { lifiReadClient, quote, QUOTE_PLACEHOLDER } from './lifi';
import { NATIVE, loadCatalog } from './sources';

// Devis LI.FI relance (avec un delai) a chaque changement de montant, de
// source ou d'acheteur ; le precedent est annule. `params` undefined = pas de devis.
// Retour : { status: 'idle' | 'loading' | 'ok' | 'error', step? }. Le resultat est
// range avec sa cle : tant qu'il ne correspond pas a la saisie courante, on est en 'loading'.
export function useRouteQuote(params) {
  const [result, setResult] = useState({ key: '', status: 'idle' });
  const key = params
    ? [params.fromChainId, params.fromToken, params.useUSDT, params.amountWei, params.minTokens, params.buyer, params.referrer].join(':')
    : '';
  useEffect(() => {
    if (!params) return undefined;
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      quote(lifiReadClient(), { ...params, buyer: params.buyer ?? QUOTE_PLACEHOLDER }, ctrl.signal)
        .then((step) => { if (!ctrl.signal.aborted) setResult({ key, status: 'ok', step }); })
        .catch(() => { if (!ctrl.signal.aborted) setResult({ key, status: 'error' }); });
    }, 500);
    return () => { ctrl.abort(); clearTimeout(id); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!params) return { status: 'idle' };
  return result.key === key ? result : { status: 'loading' };
}

const clients = new Map();

// Solde du token choisi, sur sa chaine (RPC public fourni par LI.FI).
// `tick` change apres un achat pour relire le solde. undefined tant qu'il n'est pas lu.
export function useSourceBalance(source, account, tick) {
  const [result, setResult] = useState({ key: '', value: undefined });
  const key = source && account ? `${source.chainId}:${source.address}:${account}:${tick}` : '';
  useEffect(() => {
    if (!source || !account) return undefined;
    let alive = true;
    (async () => {
      let client = clients.get(source.chainId);
      if (!client) {
        const chain = (await loadCatalog()).chains.find((c) => c.id === source.chainId);
        // publicnode d'abord : deja autorise par la CSP du site (vercel.json).
        const urls = chain?.metamask?.rpcUrls ?? [];
        const rpc = urls.find((u) => u.includes('publicnode.com')) ?? urls[0];
        if (!rpc) return;
        client = createPublicClient({ transport: http(rpc) });
        clients.set(source.chainId, client);
      }
      const value = source.address.toLowerCase() === NATIVE
        ? await client.getBalance({ address: account })
        : await client.readContract({ address: source.address, abi: erc20Abi, functionName: 'balanceOf', args: [account] });
      if (alive) setResult({ key, value });
    })().catch(() => {});
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return key && result.key === key ? result.value : undefined;
}

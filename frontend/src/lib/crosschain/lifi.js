// Paiement de la presale depuis un autre token ou une autre chaine EVM.
// LI.FI sert de moteur invisible (aucun ecran LI.FI) : devis et execution via
// son SDK, avec le wallet deja connecte au site (AppKit). Le bridge livre
// l'USDT/USDC sur BSC et appelle lui-meme buyFor() au nom de l'acheteur.
import { convertQuoteToRoute, createClient, executeRoute, getContractCallsQuote } from '@lifi/sdk';
import { EthereumProvider } from '@lifi/sdk-provider-ethereum';
import { createWalletClient, custom, encodeFunctionData, parseAbiItem } from 'viem';
import { PRESALE_ADDRESSES } from '../../config/presale';

export const LIFI_INTEGRATOR = 'joobescrow';
export const BSC_CHAIN_ID = 56;
const API_KEY = process.env.NEXT_PUBLIC_LIFI_API_KEY || undefined;
// Adresse fictive pour chiffrer un devis avant que l'acheteur ne se connecte.
export const QUOTE_PLACEHOLDER = '0x1111111111111111111111111111111111111111';
// Gas reserve pour buyFor() a l'arrivee.
const CALL_GAS_LIMIT = '500000';
const BUY_FOR = parseAbiItem('function buyFor(address beneficiary, uint256 payment, uint256 minTokensExpected, bool useUSDT, address referrer)');

export function makeLifiClient(eip1193, account, switchToChain) {
  const walletClient = () => createWalletClient({ account, transport: custom(eip1193) });
  return createClient({
    integrator: LIFI_INTEGRATOR,
    apiKey: API_KEY,
    providers: [
      EthereumProvider({
        getWalletClient: async () => walletClient(),
        switchChain: async (chainId) => {
          await switchToChain(chainId);
          return walletClient();
        },
      }),
    ],
  });
}

// Client de lecture seule (devis avant connexion).
let readClient = null;
export function lifiReadClient() {
  readClient ??= createClient({ integrator: LIFI_INTEGRATOR, apiKey: API_KEY });
  return readClient;
}

/**
 * p : { fromChainId, fromToken, useUSDT, amountWei (montant livre au contrat,
 * 18 decimales), minTokens, buyer, referrer }
 */
export function contractCalls(p) {
  const paymentToken = p.useUSDT ? PRESALE_ADDRESSES.USDT : PRESALE_ADDRESSES.USDC;
  const data = encodeFunctionData({
    abi: [BUY_FOR],
    functionName: 'buyFor',
    args: [p.buyer, p.amountWei, p.minTokens, p.useUSDT, p.referrer],
  });
  return [{
    fromAmount: p.amountWei.toString(),
    fromTokenAddress: paymentToken,
    toContractAddress: PRESALE_ADDRESSES.PRESALE,
    toContractCallData: data,
    toContractGasLimit: CALL_GAS_LIMIT,
    toApprovalAddress: PRESALE_ADDRESSES.PRESALE,
  }];
}

// Devis pour livrer exactement `amountWei` a buyFor() sur BSC.
export function quote(client, p, signal) {
  return getContractCallsQuote(client, {
    fromChain: p.fromChainId,
    fromToken: p.fromToken,
    fromAddress: p.buyer,
    toChain: BSC_CHAIN_ID,
    toToken: p.useUSDT ? PRESALE_ADDRESSES.USDT : PRESALE_ADDRESSES.USDC,
    toAmount: p.amountWei.toString(),
    contractCalls: contractCalls(p),
    toFallbackAddress: p.buyer,
  }, { signal });
}

// Ce qui sera reellement debite : montant envoye + gas de la chaine source.
export function quoteCost(step) {
  const from = Number(step.action.fromAmount) / 10 ** step.action.fromToken.decimals;
  const gas = (step.estimate.gasCosts ?? []).reduce((s, g) => s + Number(g.amountUSD ?? 0), 0);
  return { fromAmount: from, usd: from * Number(step.action.fromToken.priceUSD ?? 0) + gas };
}

// Etape en cours d'une route ('approve' | 'confirm' | 'bridging' | 'finalizing'),
// d'apres les actions que le SDK met a jour.
export function progressOf(route) {
  const actions = route.steps.flatMap((s) => s.execution?.actions ?? []);
  const waiting = actions.find((a) => a.status === 'ACTION_REQUIRED' || a.status === 'MESSAGE_REQUIRED');
  if (waiting) {
    return ['CHECK_ALLOWANCE', 'SET_ALLOWANCE', 'RESET_ALLOWANCE', 'PERMIT', 'NATIVE_PERMIT'].includes(waiting.type) ? 'approve' : 'confirm';
  }
  const pending = [...actions].reverse().find((a) => a.status === 'PENDING' || a.status === 'STARTED');
  if (pending?.type === 'RECEIVING_CHAIN') return 'finalizing';
  if (pending?.type === 'CROSS_CHAIN' || pending?.type === 'SWAP') return 'bridging';
  return 'confirm';
}

export function runRoute(client, step, calls, onUpdate) {
  return executeRoute(client, convertQuoteToRoute(step), {
    updateRouteHook: onUpdate,
    // Juste avant la signature, le SDK refait le devis d'une route avec appel
    // de contrat et redemande cet appel : on renvoie le meme.
    getContractCalls: async () => ({ contractCalls: calls }),
    // Le montant livre au contrat est fixe ; une variation de cours ne change
    // que le cout a la source, que le wallet affiche avant signature.
    acceptExchangeRateUpdateHook: async () => true,
  });
}

// Presale JOOB (VestingPresale) — BNB Smart Chain mainnet.
import { parseUnits } from 'ethers';
// Adresses verifiees on-chain : token(), paymentToken() (USDC), usdtToken().
export const PRESALE_CHAIN_ID = 56;

export const PRESALE_ADDRESSES = {
  PRESALE: '0xd3F3598Ff8efB2cF6643488e66e8df683804F63d',
  TOKEN: '0x4bf3D2a4d88109bBb6340f3f1B88bD0Aa17c10E2',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  SAFE: '0x872F979aa868145bE3c3A6EA787614BE2A18C7f7',
};

export const BSCSCAN = 'https://bscscan.com';

// Rapports SpyWolf publies (edition JoobEscrow).
export const AUDITS = {
  PRESALE: 'https://spywolf.co/audits/VestingPresale_Airdrop_Audit_JoobEscrow.pdf',
  TOKEN: 'https://spywolf.co/audits/StandardToken_Audit_JoobEscrow.pdf',
  ESCROW_V4: 'https://spywolf.co/audits/Universal_Service_Escrow_V4_Audit.pdf',
  STAKING: 'https://spywolf.co/audits/StandardStaking_Audit_JoobEscrow.pdf',
};

// Enum State du contrat.
export const PRESALE_STATE = { PENDING: 0, ACTIVE: 1, ENDED: 2 };

export const PRESALE_ABI = [
  'function presaleName() view returns (string)',
  'function tokenDecimals() view returns (uint8)',
  'function paymentTokenDecimals() view returns (uint8)',
  'function presaleTokensCap() view returns (uint256)',
  'function basePrice() view returns (uint256)',
  'function priceIncreaseBps() view returns (uint256)',
  'function priceIncreasePeriod() view returns (uint256)',
  'function tgeBps() view returns (uint256)',
  'function vestingDuration() view returns (uint256)',
  'function referralBps() view returns (uint256)',
  'function maxExtensions() view returns (uint8)',
  'function extensionDuration() view returns (uint256)',
  'function extensionsUsed() view returns (uint8)',
  'function startTime() view returns (uint256)',
  'function endTime() view returns (uint256)',
  'function tgeTimestamp() view returns (uint256)',
  'function state() view returns (uint8)',
  'function paused() view returns (bool)',
  'function totalRaised() view returns (uint256)',
  'function totalTokensOwed() view returns (uint256)',
  'function depositedTokens() view returns (uint256)',
  'function remainingTokens() view returns (uint256)',
  'function getCurrentPrice() view returns (uint256)',
  'function estimateTokens(uint256 payment) view returns (uint256)',
  'function getVolumeBonusTiers() view returns (uint256[] thresholds, uint256[] bps)',
  'function allocations(address) view returns (uint256)',
  'function purchasedTokens(address) view returns (uint256)',
  'function volumeBonusPaid(address) view returns (uint256)',
  'function claimed(address) view returns (uint256)',
  'function claimable(address user) view returns (uint256)',
  'function contributionsUSDC(address) view returns (uint256)',
  'function contributionsUSDT(address) view returns (uint256)',
  'function buy(uint256 payment, uint256 minTokensExpected, bool useUSDT, address referrer)',
  'function claim()',
  'function finalize()',
];

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

/** Prix au temps `t` (s) — meme formule que getCurrentPrice() du contrat. */
export function priceAt(config, t) {
  if (t < config.startTime) return config.basePrice;
  const steps = (t - config.startTime) / config.priceIncreasePeriod;
  return config.basePrice + (config.basePrice * config.priceIncreaseBps * steps) / 10_000n;
}

/** Prochain changement de prix apres `t` (s). */
export function nextStepAt(config, t) {
  if (t < config.startTime) return config.startTime + config.priceIncreasePeriod;
  const steps = (t - config.startTime) / config.priceIncreasePeriod;
  return config.startTime + (steps + 1n) * config.priceIncreasePeriod;
}

/** Palier de bonus de volume pour une contribution cumulee (bps, 0 si aucun). */
export function volumeTierBps(config, cumulative) {
  for (let i = config.tierThresholds.length - 1; i >= 0; i--) {
    if (cumulative >= config.tierThresholds[i]) return config.tierBps[i];
  }
  return 0n;
}

/** Message lisible a partir d'une erreur ethers / wallet. */
export function readableError(err) {
  const msg = err?.shortMessage || err?.reason || err?.info?.error?.message || err?.message || String(err);
  if (err?.code === 'ACTION_REJECTED' || /user rejected|user denied/i.test(msg)) return 'Transaction rejected in your wallet.';
  const revert = msg.match(/Presale: [^"'\n]+/);
  if (revert) {
    const r = revert[0];
    if (r.includes('slippage')) return 'The price changed before your transaction was executed. Nothing was charged: please try again.';
    if (r.includes('not active')) return 'The sale is not open.';
    if (r.includes('exceeds remaining cap')) return 'This amount exceeds the tokens still available. Try a smaller amount.';
    if (r.includes('cannot refer yourself')) return 'You cannot refer yourself.';
    if (r.includes('nothing to claim')) return 'Nothing to claim yet.';
    return r;
  }
  if (/insufficient funds/i.test(msg)) return 'Not enough BNB to pay the network fee.';
  return msg.length > 160 ? `${msg.slice(0, 160)}…` : msg;
}

// Prix initial prevu de la pool PancakeSwap JOOB/USDT (LAUNCH_PLAN_JOOB.md : 50 JOOB pour 1 USDT).
// Prix d'ouverture fixe par le Safe, pas une garantie : le marche fixe ensuite le prix.
export const PLANNED_LISTING_PRICE = '0.02';

// Seuil de "poussiere" pour l'etat sold-out, en unites du token de paiement (USDT/USDC, ex. '1' = 1 $).
// La vente se finalise seule quand le plafond est atteint au wei pres ; sinon il peut rester un reliquat
// trop petit pour un achat utile. '0' = sold-out seulement quand plus rien n'est achetable. Valeur A CONFIRMER.
export const SOLD_OUT_DUST_PAYMENT = '0';

/** Montant maximal achetable (en unites de paiement) avec le reliquat, bonus maximum inclus. */
export function maxPurchasablePayment(config, global, price) {
  if (!config || !global || !price) return 0n;
  const maxBonusBps = (config.tierBps.length ? config.tierBps[config.tierBps.length - 1] : 0n) + config.referralBps;
  const tokens = (global.remainingTokens * 10_000n) / (10_000n + maxBonusBps);
  return (tokens * price) / 10n ** BigInt(config.tokenDecimals);
}

/** Vente ouverte mais reliquat <= seuil de poussiere : affichee comme sold-out. */
export function isSoldOut(config, global, price) {
  if (!config || !global || !price) return false;
  const dust = parseUnits(SOLD_OUT_DUST_PAYMENT, config.paymentDecimals);
  return maxPurchasablePayment(config, global, price) <= dust;
}

/** Instant de cloture du prix : finalisation (tgeTimestamp) si elle a eu lieu avant la fin, sinon endTime. */
export function closingTime(global) {
  if (!global) return 0n;
  return global.tgeTimestamp > 0n && global.tgeTimestamp < global.endTime ? global.tgeTimestamp : global.endTime;
}

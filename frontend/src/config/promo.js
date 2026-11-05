// Bonus temporaires de la presale, hors contrat (le contrat est immuable) : pris sur
// l'allocation Marketing et livres au TGE avec le vesting de la presale. Affichage seulement :
// la liste des beneficiaires est calculee on-chain (events TokensBought) apres la periode.
// Decision du 31/10/2026 : +50 % des JOOB achetes, achat >= 20 USDT, + 25 % pour les achats anterieurs.
export const PROMO = {
  name: 'Flash Weekend Bonus',
  start: '2026-10-31T00:00:00Z',
  end: '2026-11-02T14:00:00Z',
  bonusBps: 5000,
  minUsd: 20,
  earlyBonusBps: 2500,
};

/** Promo en cours a l'instant nowSec (secondes, Number ou BigInt), sinon null. */
export function activePromo(nowSec, promo = PROMO) {
  const now = Number(nowSec) * 1000;
  const start = Date.parse(promo.start);
  const end = Date.parse(promo.end);
  if (Number.isNaN(start) || Number.isNaN(end) || now < start || now >= end) return null;
  return { ...promo, endSec: BigInt(Math.floor(end / 1000)) };
}

// Bonus « Fair Share » (decision du 05/11/2026) : 5 JOOB par dollar achete, des 1 $, a partir de `start`
// et jusqu'a ce que le montant leve atteigne `capRaisedUsd` (objectif de listing). Corrige l'ecart des petits
// acheteurs (pas de bonus de volume sous 100 $). Hors contrat : pris sur l'allocation Airdrop, livre au TGE
// avec le vesting de la presale. Un achat compte en entier si le montant leve avant lui est sous le plafond.
export const SALES_BONUS = {
  name: 'Fair Share Bonus',
  start: '2026-11-05T13:00:00Z',
  joobPerUsd: 5,
  capRaisedUsd: 25000,
};

/** Bonus actif a nowSec si le montant leve (USD, Number) est encore sous le plafond, sinon null. */
export function activeSalesBonus(nowSec, raisedUsd, bonus = SALES_BONUS) {
  const start = Date.parse(bonus.start) / 1000;
  if (Number(nowSec) < start || raisedUsd >= bonus.capRaisedUsd) return null;
  return { ...bonus, leftUsd: bonus.capRaisedUsd - raisedUsd };
}

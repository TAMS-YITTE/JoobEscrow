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

// Refus volontaire dans le wallet : pas un echec, aucun toast d'erreur a afficher.
// ethers v6 renvoie code ACTION_REJECTED avec reason "rejected" ; les wallets EIP-1193 renvoient le code 4001.
export function isUserRejection(err) {
  if (!err) return false;
  if (err.code === 'ACTION_REJECTED' || err.code === 4001 || err.info?.error?.code === 4001 || err.error?.code === 4001) return true;
  return /user rejected|user denied/i.test(`${err.shortMessage || ''} ${err.message || ''}`);
}

// Refus volontaire dans le wallet : pas un echec, aucun toast d'erreur a afficher.
// ethers v6 renvoie code ACTION_REJECTED avec reason "rejected" ; les wallets EIP-1193 renvoient le code 4001.
// Message lisible pour l'utilisateur. Certains wallets mobiles (WalletConnect, Phantom...) renvoient une
// erreur non standard qu'ethers enveloppe dans « could not coalesce error » : on va chercher le vrai
// message du wallet a l'interieur, puis on traduit les cas frequents (session expiree, gas, nonce).
export function walletErrorMessage(err) {
  if (!err) return 'Unknown error';
  // Nos propres messages (gas insuffisant, mauvais reseau, wallet absent) sont deja lisibles.
  if (!err.code && /^(Not enough BNB|Please switch your wallet|Connect your wallet)/.test(err.message || '')) return err.message;
  const inner =
    err.info?.error?.message ||
    err.error?.message ||
    err.data?.message ||
    err.info?.error?.data?.message ||
    '';
  const raw = `${err.reason || ''} ${inner} ${err.shortMessage || ''} ${err.message || ''}`;
  if (/insufficient funds|gas required exceeds|not enough (bnb|balance|funds)/i.test(raw)) {
    return 'Not enough BNB to pay the network fee. Add a little BNB on BNB Smart Chain to this wallet, then try again.';
  }
  if (/expired|timed? ?out|timeout|session|disconnected|no matching key|request without listeners/i.test(raw)) {
    return 'Your wallet connection expired. Disconnect and reconnect your wallet on the site, then try again.';
  }
  if (/nonce too low|replacement transaction underpriced|already known/i.test(raw)) {
    return 'A previous transaction is still pending in your wallet. Wait a moment, then try again.';
  }
  const readable = err.reason || inner || err.shortMessage || err.message || 'Unknown error';
  // Le message brut d'ethers contient tout le payload JSON : on n'en garde que la premiere phrase.
  return /could not coalesce/i.test(readable)
    ? 'Your wallet returned an unexpected error. Disconnect and reconnect your wallet, then try again.'
    : String(readable).split(' (')[0].slice(0, 200);
}

export function isUserRejection(err) {
  if (!err) return false;
  if (err.code === 'ACTION_REJECTED' || err.code === 4001 || err.info?.error?.code === 4001 || err.error?.code === 4001) return true;
  return /user rejected|user denied/i.test(`${err.shortMessage || ''} ${err.message || ''}`);
}

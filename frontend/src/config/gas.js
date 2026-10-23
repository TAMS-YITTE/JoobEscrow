// Frais de reseau (gas BNB) : une seule source pour l'alerte et l'aide au prestataire.

// Gaz maximal d'une de nos transactions (approve, creation, accept, claim, litige) : sert a calculer,
// au prix du gaz du moment, le solde minimal sous lequel la transaction echouerait.
export const MAX_TX_GAS = 300000n;

// Montant que le client peut offrir au prestataire pour ses frais (Accept, Claim, litige eventuel).
export const GAS_TOPUP_BNB = '0.001';

// Sous ce solde, le client voit la proposition d'envoyer GAS_TOPUP_BNB au prestataire.
export const LOW_GAS_BNB = '0.0003';

// Demo a 1 $ : le 2e wallet du testeur est souvent vide ; montant reduit, proportionne a l'escrow.
// Le seuil reste sous le montant envoye pour que l'aide disparaisse une fois le BNB recu.
export const GAS_TOPUP_BNB_DEMO = '0.0002';
export const LOW_GAS_BNB_DEMO = '0.0001';

/** Montant propose et seuil d'alerte selon le contrat (demo ou payant). */
export const gasHelp = (isDemo) => (isDemo
  ? { topup: GAS_TOPUP_BNB_DEMO, low: LOW_GAS_BNB_DEMO }
  : { topup: GAS_TOPUP_BNB, low: LOW_GAS_BNB });

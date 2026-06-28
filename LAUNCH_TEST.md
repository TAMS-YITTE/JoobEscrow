# ✅ Checklist — Test grandeur nature avant lancement

> Objectif : valider en **conditions réelles sur BSC Mainnet** tout ce qui n'a pas pu être testé à distance (XMTP runtime, Crisp, cycle escrow complet, et surtout **résolution de litige via le multisig**).
> Règle d'or : **ne pas lancer (socials) tant que la Phase 2 — litige via multisig — n'est pas validée.**

---

## 📋 Prérequis

- [ ] **2 wallets distincts** dans MetaMask :
  - Wallet **A** = Client (celui qui paie)
  - Wallet **B** = Provider (celui qui livre)
- [ ] Un peu de **BNB** sur A et B (gas, ~0,01 BNB suffit largement).
- [ ] Un peu d'**USDT BSC** sur le wallet A (montant de test, ex : **2–5 USDT**). Token USDT mainnet : `0x55d398326f99059fF775485246999027B3197955`
- [ ] **Multisig Gnosis Safe** déployé et **ownership des 5 contrats transféré** au Safe (via `transferOwnership` + `acceptOwnership` — Ownable2Step).
- [ ] Accès au Safe pour signer (les signataires dispo demain).

### Contrats mainnet (référence)
| Tier | Adresse |
|---|---|
| 10% | `0xD5B180580D183A7A9278118312207bc8a9C9f89E` |
| 8%  | `0xa45f887b938a08B295A5b96b6559600632F09Ab0` |
| 5%  | `0x56c2227E06dBC16062179Be397839b101a8e58c7` |
| 3%  | `0x3EEEA456daCF2247CB0023a70923E60C3E13D6C3` |
| 2%  | `0x7986Bd37C4DA6d1822958fCB97E7a284b40DD7Cc` |

---

## Phase 0 — Vérification du multisig

- [ ] `owner()` des 5 contrats = adresse du **Gnosis Safe** (plus l'ancienne EOA `0x944b6b22…`).
- [ ] Le Safe peut bien initier une transaction sur un contrat escrow (test à blanc, ex : lire/préparer un `togglePause` sans l'exécuter).
- [ ] Vérifier le contrat sur BscScan (lien public, onglet "Read/Write as Proxy" ou "Contract").

---

## Phase 1 — Cycle parfait (happy path)

Sur une niche (ex : `/talent`, contrat 8%).

- [ ] Wallet **A** : connecter, vérifier réseau **BSC Mainnet (56)**.
- [ ] A : "Create Escrow" → adresse Provider = wallet **B**, montant = 2 USDT.
- [ ] A : approuver le **montant exact** (pas illimité) — vérifier dans MetaMask que l'allowance = 2 USDT.
- [ ] A : confirmer `createAndFundEscrow` → tx réussie, escrow visible "FUNDED".
- [ ] Wallet **B** : connecter, voir l'escrow, cliquer **"Accept"** → statut passe à "Accepted".
- [ ] A : **"Release Funds"** → tx réussie.
- [ ] B : **"Withdraw"** → reçoit **1,84 USDT** (2 − 8% de frais).
- [ ] Vérifier que la **trésorerie** (feeRecipient) a reçu **0,16 USDT**.
- [ ] Vérifier sur BscScan que les montants correspondent au centime.

---

## Phase 2 — 🔴 LITIGE RÉSOLU VIA LE MULTISIG (test critique)

> C'est LE test qui définit ton produit. Si ça échoue, ne lance pas.

- [ ] A : créer + financer un nouvel escrow vers B (2 USDT).
- [ ] B : "Accept".
- [ ] A ou B : **"Open Dispute"** (avec un hash de preuve) → statut "DISPUTED".
- [ ] (optionnel) Soumettre une evidence des deux côtés.
- [ ] **Depuis le Gnosis Safe** : initier `resolveDispute(escrowId, providerBps)` — ex : `5000` (50/50).
- [ ] Faire **signer le nombre requis de signataires** du Safe.
- [ ] Exécuter la tx du Safe → vérifier qu'elle **passe** (statut "RESOLVED").
- [ ] A et B : **"Withdraw"** → vérifier la répartition (50% à chacun, frais uniquement sur la part provider).
- [ ] ✅ **Confirmer que le flux de litige fonctionne entièrement via le multisig.**

---

## Phase 3 — Timeout (provider protégé)

- [ ] A : créer + financer un escrow vers B avec le **timeout minimum** (3 jours) — OU utiliser un escrow existant accepté dont le timeout est court.
- [ ] B : "Accept".
- [ ] Après dépassement du `timeoutDate` : le bouton **"Claim Timeout"** apparaît côté B (et **seulement** si accepté).
- [ ] B : "Claim Timeout" → reçoit les fonds (montant − frais).
- [ ] ⚠️ Vérifier qu'avant le timeout, le bouton **n'apparaît pas** (cohérence avec le contrat).

> Note : 3 jours étant le minimum on-chain, ce test peut être validé plus tard / en différé. Ne pas bloquer le lancement dessus si Phase 1 & 2 sont OK.

---

## Phase 4 — Annulation (avant acceptation)

- [ ] A : créer + financer un escrow vers B.
- [ ] **Avant** que B n'accepte : A clique **"Cancel (Refund)"**.
- [ ] A est **remboursé à 100%** (aucun frais prélevé).
- [ ] Vérifier qu'après acceptation par B, le bouton Cancel **disparaît** (impossible d'annuler).

---

## Phase 5 — XMTP (chat chiffré)

- [ ] Sur une carte escrow, A clique **"💬 Chat"** → "Activate Chat" → signer dans MetaMask.
- [ ] **Console DevTools (F12)** : AUCUNE erreur CSP / WebAssembly.
- [ ] B fait pareil de son côté (active le chat une fois).
- [ ] A envoie un message → **A voit son propre message** s'afficher.
- [ ] B reçoit le message **en temps réel**.
- [ ] B répond → A reçoit en temps réel.
- [ ] Vérifier l'alignement gauche/droite (is-me) et l'horodatage.
- [ ] Tester le cas "peer pas encore activé" : message clair affiché.

---

## Phase 6 — Crisp (support)

- [ ] La **bulle Crisp** s'affiche sur la **landing** (et pages marketing).
- [ ] La bulle s'affiche aussi dans l'**app** (dashboard).
- [ ] **Console** : aucune erreur CSP bloquant `client.crisp.chat`.
- [ ] Envoyer un message test → vérifier qu'il **arrive dans ton inbox Crisp / email**.
- [ ] (recommandé) Connecter Crisp à Gmail pour recevoir les notifs de litige.

---

## Phase 7 — Plan d'urgence

- [ ] Savoir déclencher `togglePause()` **via le Safe** (test à blanc ou réel sur un contrat).
- [ ] Vérifier qu'en pause : création/release bloqués, mais **withdraw et résolution de litige restent possibles** (les fonds ne sont jamais séquestrés).
- [ ] Ne pas oublier de **dé-pauser** après le test si fait en réel.

---

## 🚦 GO / NO-GO Lancement

**GO** si :
- [ ] Phase 0 (multisig owner) ✅
- [ ] Phase 1 (cycle parfait) ✅
- [ ] **Phase 2 (litige via multisig) ✅** ← bloquant absolu
- [ ] Phase 5 (XMTP runtime) ✅
- [ ] Phase 6 (Crisp + notifs) ✅
- [ ] Pages `/risks` et `/terms` relues (couverture juridique) ✅

**NO-GO** tant que la Phase 2 n'est pas validée, ou si une question réglementaire (détention de fonds + arbitrage en France) reste ouverte.

→ Si tout est ✅ : **socials + lancement.** 🚀

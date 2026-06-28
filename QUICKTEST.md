# ⚡ QUICKTEST — Test KISS avant lancement

Owner = ta clé (EOA). 2 wallets. Petits montants réels sur BSC Mainnet.

## Avant de commencer
- [ ] Wallet **A** (Client) : un peu de BNB + **2 USDT**
- [ ] Wallet **B** (Provider) : un peu de BNB
- [ ] Ta clé d'arbitre (owner) accessible dans MetaMask
- [ ] App ouverte sur https://www.joobescrow.com, réseau **BSC Mainnet (56)**

---

## TEST 1 — Paiement normal (le cas qui doit marcher)
1. [ ] **A** se connecte → "Create Escrow" → Provider = **B**, montant = **1 USDT**
2. [ ] **A** approuve (montant exact) puis confirme → escrow **FUNDED**
3. [ ] **B** se connecte → **"Accept"**
4. [ ] **A** → **"Release Funds"**
5. [ ] **B** → **"Withdraw"** → reçoit **0,92 USDT** ✅ (8% de frais = 0,08)

➡️ Si B reçoit 0,92 USDT : **TEST 1 OK**

---

## TEST 1.5 — Annulation / Refund (optionnel mais recommandé)
1. [ ] **A** se connecte → "Create Escrow" → Provider = **B**, montant = **1 USDT**
2. [ ] **A** approuve et confirme → escrow **FUNDED**
3. [ ] *Avant que B n'accepte*, **A** clique sur **"Cancel"**
4. [ ] **A** → **"Withdraw"** → récupère son **1 USDT** en intégralité ✅ (0 frais)

➡️ Si A récupère son argent sans accroc : **TEST 1.5 OK**

---

## TEST 2 — Litige (LE test critique)
1. [ ] **A** crée + finance un escrow vers **B** (1 USDT), **B** clique **Accept**
2. [ ] **A** (ou B) → **"Open Dispute"** → statut **DISPUTED**
3. [ ] Avec **ta clé owner** (ton portefeuille perso `0x944b...` qui a déployé les contrats, tant que le Safe n'est pas finalisé) : appeler `resolveDispute(escrowId, 5000)` (= 50/50)
   - via l'app si tu as un bouton admin, sinon via BscScan → "Write Contract" → `resolveDispute`
4. [ ] **A** → Withdraw → reçoit ~**0,50 USDT**
5. [ ] **B** → Withdraw → reçoit ~**0,46 USDT** (0,50 − frais de plateforme sur sa part)

➡️ Si le litige se résout et chacun retire sa part : **TEST 2 OK** ← indispensable pour lancer

---

## TEST 3 — Chat (XMTP)
1. [ ] Sur une carte escrow, **A** → "💬 Chat" → "Activate Chat" → signer
2. [ ] **F12 (console)** : aucune erreur rouge CSP/WASM
3. [ ] **B** active aussi le chat de son côté
4. [ ] **A** envoie un message → A le voit, **B** le reçoit
5. [ ] **B** répond → **A** reçoit

➡️ Échange dans les 2 sens : **TEST 3 OK**

---

## TEST 4 — Support (Crisp)
1. [ ] La **bulle Crisp** apparaît (landing + app)
2. [ ] Envoyer un message test → il **arrive dans ton inbox Crisp / email**

➡️ Message reçu : **TEST 4 OK**

---

## 🚦 GO LANCEMENT si :
- [ ] TEST 1 ✅
- [ ] TEST 1.5 ✅ (Refund simple)
- [ ] **TEST 2 ✅** (bloquant)
- [ ] TEST 3 ✅
- [ ] TEST 4 ✅
- [ ] `executeFeeRecipient` exécuté sur les 5 contrats (après les 48h sur BscScan)

Sinon : on corrige avant d'annoncer sur les réseaux.

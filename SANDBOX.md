# Guide du Bac-à-sable Local (Local Sandbox)

Ce guide t'explique comment tester entièrement la plateforme Joob Escrow sur ta machine sans dépenser un seul centime (ni BNB ni USDT réel).

> **Important (Node.js)** : Veille à utiliser une version de Node.js LTS (idéalement la v20 ou la v22) pour exécuter la Sandbox. Hardhat ne garantit pas la compatibilité avec les versions impaires ou trop récentes (ex: v25).

## 🛠️ Démarrer l'environnement Sandbox

Pour commencer à tester, tu vas devoir ouvrir 3 terminaux différents.

### Terminal 1 : Lancer la Blockchain Locale (Hardhat Node)
Ouvre un terminal, va dans le dossier `contracts/` et lance le nœud local. Ce nœud simule une blockchain ultra-rapide sur ton PC.

```bash
cd contracts
npm run node
```
*(Garde ce terminal ouvert. Si tu le fermes, la blockchain s'éteint et l'historique est supprimé).*

### Terminal 2 : Déployer et Financer les comptes
Ouvre un deuxième terminal. Toujours dans `contracts/`, lance le script de sandbox :

```bash
cd contracts
npm run sandbox
```

**Ce script fait automatiquement :**
1. Déploiement de `MockUSDT` (Faux USDT)
2. Déploiement de `UniversalServiceEscrow` (avec 8% de frais)
3. Financement des deux premiers comptes Hardhat avec 10 000 USDT et 1 ETH (pour le gas) chacun.
4. **Mise à jour automatique** de l'application front-end (`frontend/src/config/contract.js` et `instances.js`) pour pointer sur cette blockchain locale.

### Terminal 3 : Lancer l'interface Web (Next.js)
Ouvre un troisième terminal, va dans le dossier `frontend/` et lance l'app :

```bash
cd frontend
npm run dev
```

Visite [http://localhost:3000](http://localhost:3000) dans ton navigateur.

---

## 🦊 Configuration de MetaMask

Pour que ton navigateur puisse interagir avec ce bac-à-sable, il faut configurer MetaMask.

### 1. Ajouter le réseau "Hardhat Local"
Quand tu cliqueras sur "Connect Wallet" ou "Create Escrow", le site va te proposer automatiquement d'ajouter le réseau "Hardhat Local". Tu as juste à accepter !
Si tu veux le faire manuellement :
- **Network Name:** Hardhat Local
- **RPC URL:** http://127.0.0.1:8545
- **Chain ID:** 31337
- **Currency Symbol:** ETH

### 2. Importer les comptes de test (Client & Provider)
Dans MetaMask, clique sur le menu de tes comptes -> "Add account or hardware wallet" -> "Import account".
Copie l'une des clés privées affichées par le script `npm run sandbox`.
- **Clé Client** : `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Clé Provider** : `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

### 3. Importer le jeton Mock USDT
Toujours dans MetaMask, va dans "Tokens" -> "Import tokens".
Copie l'adresse du **Mock USDT** (affichée dans le terminal 2 après `npm run sandbox`). Tu verras apparaître un solde de 10 000 USDT !

---

## ⚠️ Notes Importantes et Erreurs Fréquentes

1. **Erreur de Nonce (MetaMask)** :
   Si tu redémarres ton Terminal 1 (`npm run node`), la blockchain est effacée (remise à zéro). 
   Mais MetaMask se souvient de tes anciennes transactions ! Ça va bloquer tes prochains envois.
   **Solution :** Dans MetaMask, va dans `Settings` > `Advanced` > `Clear activity tab data` (ou Reset Account).

2. **Financer un compte MetaMask personnel** :
   Si tu ne veux pas importer les clés privées Hardhat et que tu préfères utiliser tes propres adresses de test MetaMask, tu peux passer la variable d'environnement `SANDBOX_FUND_ADDRESSES` lors de l'exécution du script :
   ```bash
   SANDBOX_FUND_ADDRESSES="0xTonAdresse1,0xTonAdresse2" npm run sandbox
   ```
   Ces adresses recevront aussi 10 000 faux USDT.

3. **Avant de déployer sur testnet/mainnet** :
   Les scripts Sandbox ont été conçus pour ne **jamais** écraser tes fichiers de configuration source (`frontend/src/config/contract.js` et `instances.js`). 
   Les adresses des contrats déployés localement sont injectées uniquement dans `frontend/.env.local` via les variables `NEXT_PUBLIC_ESCROW_ADDRESS` et `NEXT_PUBLIC_USDT_ADDRESS`. 
   Ainsi, tu ne risques pas de committer une adresse `localhost` sur GitHub et de casser ta prod. Si tu souhaites repasser en prod, arrête le dev server et supprime simplement `.env.local` (ou commente ces lignes). Le code de l'application repassera automatiquement aux adresses Mainnet/Testnet codées en dur.

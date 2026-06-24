# Suite de tests Hardhat — UniversalServiceEscrow

38 tests, tous verts (testé sous Hardhat 2.28, solc 0.8.20, OpenZeppelin v5, ethers v6).

## Arborescence attendue
```
contracts/
  UniversalServiceEscrow.sol   (le contrat audité)
  Mocks.sol                    (fourni ici)
test/
  escrow.test.js               (fourni ici)
hardhat.config.js
```

## Dépendances
```
npm i -D hardhat @nomicfoundation/hardhat-toolbox
npm i @openzeppelin/contracts@5
```

## hardhat.config.js
```js
require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  solidity: { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } }
};
```

## Lancer
```
npx hardhat test
```

## Couverture
1. Happy path (création → acceptation → release → withdraw, token USDT no-return)
2. Annulation (avant/après acceptation)
3. Timeout (exige acceptation, échoue avant échéance)
4. Litige owner (split proportionnel, fee sur la part provider)
5. Stale dispute 50/50 (client/provider, arrondi du wei vers le client, pas-encore-stale)
6. batchWithdraw (isolation d'un token qui revert + re-crédit, token no-return)
7. Fee-on-transfer (mesure par delta de balance ; cas documenté : montant sous le min après fee)
8. Pause (bloque création/release/cancel ; autorise withdraw/résolution)
9. Timelock (fee, recipient, limites, stale ; annulation ; mismatch de params)
10. Contrôle d'accès (onlyOwner via OwnableUnauthorizedAccount ; non-partie ; acceptEscrow)
11. Bornes & validation (split, fee max, stale range, timeout min, token non whitelisté, withdraw vide, provider==client)
12. De-whitelisting V3 (escrow en cours toujours réglable, symbole vidé)
13. Invariant comptable (balance == locked + withdrawable) + compteur actif revient à 0
14. Pagination
15. Somme de règlement == montant sur valeurs limites (équivalent fuzz)

## Notes
- Mock USDT = vrai comportement Tether (transfer sans valeur de retour), géré par SafeERC20.
- Le mock "menteur" (déplace les fonds mais renvoie false) n'est volontairement pas whitelistable :
  `safeTransferFrom` le rejette dès le financement, donc le chemin batchWithdraw à double-crédit
  n'est pas atteignable via le flux normal.

# Évolution Future : API B2B & Widgets (Le "Stripe du Web3")

Ce document résume la stratégie technique et commerciale pour la "Phase 3" de JoobEscrow : s'ouvrir aux plateformes tierces via une API non-custodiale et des widgets embarqués.

## 1. La Vision Stratégique
L'objectif est de transformer JoobEscrow d'une simple plateforme B2C en une infrastructure d'escrow universelle (B2B2C).
- **Widgets (B2C/B2B)** : Permettre aux freelances et agences d'intégrer un bouton "Pay me with JoobEscrow" directement sur leur site/portfolio (via une `<iframe>`).
- **API / SDK (B2B)** : Permettre à des places de marché Web3, des bots Discord/Telegram ou des jeux vidéo d'intégrer l'escrow de manière invisible dans leur propre flux.

## 2. L'Architecture de l'API B2B (Non-Custodiale)

### Principe de base : "Sign-It-Yourself"
L'API ne détient **JAMAIS** de clés privées et ne signe **JAMAIS** de transactions pour les clients ou les providers.
L'API agit comme un générateur de `calldata` :
1. Le partenaire B2B envoie une requête REST (ex: `POST /escrows`).
2. L'API renvoie la transaction pré-encodée (`to`, `data`, `value`).
3. Le partenaire injecte cette transaction dans son frontend (via Wagmi/Ethers) et fait signer son propre utilisateur final avec MetaMask/WalletConnect.

### Stack Recommandée
- **Backend** : Node.js avec **Fastify** (idéal pour les webhooks) et **TypeScript**.
- **Web3** : **viem** (léger, moderne, typé) pour l'encodage ABI et l'écoute d'events.
- **Base de données** : **PostgreSQL + Prisma** (pour gérer les clés API partenaires et les recommandations de litiges).

## 3. Schéma de l'API REST (MVP V1)
Ciblée sur un seul contrat (le tier à 5%). Auth via clé API (`Authorization: Bearer <KEY>`).

1. **`POST /escrows`** : Prépare `createAndFundEscrow`. Renvoie le calldata.
2. **`POST /escrows/:id/accept`** : Prépare `acceptEscrow`. Renvoie le calldata.
3. **`POST /escrows/:id/release`** : Prépare `releaseFunds`. Renvoie le calldata.
4. **`POST /escrows/:id/dispute`** : Prépare `openDispute`. Renvoie le calldata.
5. **`POST /escrows/:id/evidence`** : Prépare `submitEvidence`. Renvoie le calldata.
6. **`GET /escrows/:id`** : Lecture de l'état du contrat on-chain.

## 4. Gestion des Litiges : Le modèle "Recommandation"
Pour se protéger légalement (MiCA) et déléguer le travail de vérification :
- Le partenaire B2B (qui connaît les utilisateurs et le contexte de la mission) s'occupe du KYC et de la due diligence sur le litige.
- Le partenaire appelle un endpoint spécifique off-chain : **`POST /escrows/:id/recommend-resolution`** avec sa décision (ex: `providerBps: 7000` pour un split 70/30).
- Cette recommandation est stockée en base de données et notifie l'équipe JoobEscrow.
- **L'exécution finale** reste manuelle : un humain côté JoobEscrow valide la recommandation et exécute le `resolveDispute` via le Gnosis Safe Multisig de la plateforme.

## 5. Le système de Webhooks
Pour que le partenaire B2B puisse réagir aux actions on-chain de ses utilisateurs, l'API inclut un service d'écoute (listener) sur les events du Smart Contract (`EscrowCreated`, `FundsReleased`, `DisputeOpened`, etc.).
À chaque event détecté, l'API envoie une requête HTTP POST (Webhook) au serveur du partenaire pour qu'il mette à jour son interface en temps réel.

## 6. Structure des Domaines
- **`joobescrow.com`** : Site marketing et dApp principale.
- **`joobescrow.com/embed`** : Route ultra-légère servant les widgets pour les iframes.
- **`docs.joobescrow.com`** : Documentation développeur pour l'intégration de l'API/SDK.
- **NPM / GitHub** : Hébergement du SDK JavaScript public (ex: `@joobescrow/sdk`).

## 7. Phase Suivante (Post-API) : Rétention & Settings (B2C)
Une fois le volume d'utilisateurs acquis via l'API et les Widgets, la plateforme devra consolider sa rétention utilisateur via un centre de paramètres avancé :
- **Notifications Multicanal** : Alertes push via un bot Telegram, un Webhook Discord, ou des e-mails pour le suivi des litiges et paiements.
- **Profil Public & Réputation** : Possibilité d'associer un pseudo (ENS) ou un profil social pour humaniser les factures (au lieu d'une adresse 0x brute).
- **Préférences Financières** : Choix du token par défaut pour facturer (USDC, BUSD) et informations de facturation pour la génération automatique de reçus PDF.
- **Personnalisation** : Multilinguisme (EN, FR, ES) et affichage des devises locales (fiat conversion).

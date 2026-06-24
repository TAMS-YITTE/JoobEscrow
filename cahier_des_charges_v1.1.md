# Cahier des charges — Version 1.1

**Projet** : Audit Market — Marketplace d'audits de smart contracts (Basée sur un Moteur d'Escrow)
**Version** : 1.1 — MVP
**Date** : 21 juin 2026
**Statut** : En cours de définition

---

## 1. Contexte et problème
Le marché des audits de smart contracts est aujourd'hui dominé par quelques acteurs (Certik, Trail of Bits, OpenZeppelin) avec des tarifs allant de 20 000 à 200 000 USD par audit, des délais de 6 à 12 semaines, et aucun système de réputation transparent.
Les projets early-stage n'ont pas accès à ces services. Des milliers de contrats sont déployés chaque semaine sans audit faute de budget, exposant les utilisateurs à des risques majeurs de hack.

### 1.1 Opportunité
*   Marché de niche sous-adressé : projets early-stage, hackathons, MVPs.
*   Douleur réelle et mesurable : willingness to pay existante.
*   Pas de concurrent direct sur le segment marketplace + **escrow on-chain**.

---

## 2. Vision du produit
Audit Market est une marketplace Web2 classique connectée à un **smart contract d'Escrow (séquestre) Web3** pour la gestion des paiements. Les projets soumettent leur code, des auditeurs certifiés réalisent l'audit, et le paiement est géré automatiquement via escrow on-chain — sans intermédiaire financier.

### 2.1 Principe hybride Web2 / Web3
| Couche | Technologie |
| :--- | :--- |
| **Interface & UX** | Web2 — Next.js, base de données (Supabase) |
| **Communication** | Web2 — chat intégré, emails, notifications |
| **Dépôt de code** | Web2 — lien GitHub / hash testnet |
| **Rapport d'audit** | Web2 — lien externe (Google Doc, Notion, PDF) |
| **Paiement & Escrow** | Web3 — **Smart contract d'Escrow sur Base (Paiement 100% en USDC)** |
| **Réputation auditeur** | Web3 — score on-chain, badge NFT soulbound |

---

## 3. Flux fonctionnel principal
Le flux complet d'une mission se déroule en 6 étapes séquentielles et vérifiables.

**Étape 1 — Dépôt du script (Preuve d'Immuabilité)**
*   Le développeur déploie son smart contract sur un réseau testnet (Sepolia, Base Goerli...).
*   Il soumet le hash de transaction testnet sur la plateforme.
*   *Avantage : Ce hash est immuable et vérifiable. Le code soumis est figé, empêchant le développeur de modifier le code pendant l'audit (Scope Creep).*

**Étape 2 — Dépôt des fonds dans l'Escrow**
*   Le client connecte son wallet et dépose **100% ou 50% du montant total en USDC**.
*   Les fonds sont **bloqués (locked)** dans le smart contract d'Escrow de la mission.
*   La mission est activée côté plateforme — l'auditeur peut commencer.

**Étape 3 — Réalisation de l'audit**
*   L'auditeur analyse le script soumis (code pointé par le hash testnet).
*   Il livre son rapport via un lien externe.
*   Le nombre de révisions incluses est affiché de façon permanente.

**Étape 4 — Validation de l'audit (Paiement partiel)**
*   Le client valide le rapport sur la plateforme.
*   Le smart contract libère automatiquement la première tranche (ex: 50%) vers l'auditeur, avec prélèvement automatique de la commission plateforme (8%).

**Étape 5 — Corrections et nouveau dépôt**
*   Le développeur corrige les failles et soumet le nouveau hash testnet.
*   L'auditeur vérifie que les corrections correspondent aux recommandations.

**Étape 6 — Déploiement mainnet, Paiement du Solde et Time-out**
*   Le développeur déploie le contrat corrigé sur le réseau mainnet et soumet l'adresse.
*   Le client valide, et le smart contract libère les 50% restants.
*   **Mécanisme de Time-out (Sécurité Auditeur) :** Si le client ne valide pas et ne donne pas signe de vie après la livraison (ex: 14 jours), l'auditeur peut déclencher un Time-out pour récupérer les fonds bloqués.
*   Un **badge NFT soulbound** est mintable par le projet. Il contient dans ses métadonnées le hash exact du contrat audité (pour éviter qu'il soit falsifié et utilisé sur un autre contrat).

---

## 4. Architecture technique
### 4.1 Stack Web2 — Marketplace
*   **Frontend :** Next.js (React)
*   **Base de données :** PostgreSQL via Supabase
*   **Authentification :** Wallet connect (RainbowKit)
*   **Stockage fichiers :** Liens externes uniquement (pour le MVP)
*   **Hébergement :** Vercel

### 4.2 Stack Web3 — Smart Contract d'Escrow
*   **Réseau :** Base (frais quasi nuls, paiement en USDC).
*   **Logique de base :** Inspirée du contrat *PerShare V1*, mais allégée (pas de tokens de redistribution, pas de pool de liquidité).
*   **Rôles :** `client`, `auditor`, `feeRecipient` (Plateforme).
*   **Commission :** 8% prélevés automatiquement lors de la libération des fonds.

---

## 5. Modèle économique
### 5.1 Sources de revenus
*   **Commission marketplace :** 8% du montant de chaque audit, prélevés automatiquement en USDC.
*   *(Post-MVP)* **Badge NFT certifié :** 0.05 ETH par badge (optionnel pour le projet).
*   *(Post-MVP)* **Certification auditeur :** Frais annuels pour être listé dans le "Tier 1".

### 5.2 Projection MVP (30 premiers jours)
*   **Auditeurs listés :** 3 à 5 auditeurs recrutés manuellement (profils type Code4rena/Sherlock).
*   **Projets clients :** 5 à 10 projets issus de hackathons ETHGlobal.
*   **Ticket moyen :** 1 000 à 2 000 USDC par audit.

---

## 6. Gestion des litiges (Disputes)
Phase MVP : Arbitrage manuel par l'équipe fondatrice.

1. Le client ou l'auditeur ouvre un litige via l'interface avant l'expiration du Time-out.
2. Les fonds restent bloqués de force (Gelez de l'Escrow).
3. L'équipe plateforme analyse le rapport vs les conditions définies.
4. Le smart contract est débloqué manuellement par le wallet Admin (la plateforme) qui appelle une fonction `resolveDispute(bool payAuditor)` pour distribuer les fonds à l'un ou à l'autre.

---

## 7. Points de vigilance & Risques Juridiques

### 7.1 Réglementaire (Escrow vs DeFi)
En utilisant un pur **Escrow contractuel** sans Pool de liquidité (pas de LP, pas de jetons ERC-20 de parts à rendement), la plateforme évite d'être qualifiée de produit financier (DeFi / Securities). Elle reste une pure marketplace de prestation de services B2B, dont le séquestre est géré par la blockchain.

### 7.2 Responsabilité en cas de Hack (Liability)
Il est impératif de se protéger juridiquement.
*   Les **Conditions Générales d'Utilisation (CGU)** doivent préciser de manière explicite qu'un audit "réduit les risques mais ne garantit en aucun cas une sécurité absolue". 
*   La plateforme Audit Market agit **uniquement comme un intermédiaire de mise en relation et de paiement**. Ni l'auditeur ni la plateforme ne sont tenus responsables des fonds perdus en cas de piratage futur du protocole audité.

### 7.3 Sécurité du smart contract d'Escrow
L'Escrow sera le cœur de la confiance. Il doit être testé rigoureusement et s'appuyer sur des logiques éprouvées (comme la structure de collecte et distribution déjà présente et en cours d'audit dans le contrat PerShare V1).

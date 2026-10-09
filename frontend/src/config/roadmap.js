// Roadmap : source unique pour l'accueil (resume par phase), /presale et le whitepaper (detail par etape).
// Statut d'une phase deduit de ses etapes : tout fait = done, une etape faite ou en cours = now, sinon next / a venir.
import { PLANNED_LISTING_PRICE } from './presale';

export const ROADMAP_STATUS_LABEL = { done: 'Done', now: 'In progress', next: 'Next' };

export const ROADMAP_PHASES = [
  {
    phase: '01',
    title: 'Architecture & Security',
    summary: 'Escrow contracts deployed on BNB Smart Chain, SpyWolf audits, 3-of-5 Safe multisig and on-chain vesting.',
    steps: [
      { title: 'Foundations', status: 'done', items: 'Audited escrow contract, verified on BscScan, owned by a Safe multisig. 15 categories and encrypted in-app chat.' },
    ],
  },
  {
    phase: '02',
    title: 'Trust layer & Presale',
    summary: '$1 interactive demo (/try) and shareable escrow links are live. JOOB presale from October 15, 2026, with a sealed vault and vesting for every participant.',
    steps: [
      { title: 'Trust layer', status: 'now', items: 'Check a deal before you pay. Live: $1 demo with a step-by-step guide, shareable escrow links. Next: public deal pages anyone can verify without a wallet, Telegram alerts, dispute evidence recorded on-chain.' },
      { title: 'JOOB presale', status: 'next', items: 'October 15, 2026 → January 13, 2027. Sealed vault, vesting for every participant, unsold tokens returned to the Safe and burned in a public transaction.' },
    ],
  },
  {
    phase: '03',
    title: 'TGE & Liquidity',
    summary: 'PancakeSwap JOOB/USDT pool with LP locked 12 months or more, unsold presale tokens burned in a public transaction, audited staking opens.',
    steps: [
      { title: 'TGE & liquidity', items: `JOOB/USDT pool on PancakeSwap at an initial price of $${PLANNED_LISTING_PRICE}, JOOB staking opens (contract already audited), JOOB activated on PerShare, first JOOB utilities (boosts & badges), Early Escrow points.` },
    ],
  },
  {
    phase: '04',
    title: 'Escrow V5, Web2 & Expansion',
    summary: 'JOOB holder fee tiers, milestone payments, email sign-in and gasless payouts, then multichain, co-funded escrow and JOOB governance.',
    steps: [
      { title: 'Escrow V5', items: 'JOOB holder fee tiers: stake JOOB to pay lower fees, up to a full fee waiver at the highest tier. On-chain affiliate rewards, gasless payouts, verified reputation profiles.' },
      { title: 'Escrow V5.1', items: 'Milestone payments, partial releases, amicable settlement, bulk deals for agencies.' },
      { title: 'As easy as a Web2 app', items: 'Hide the Web3 complexity: sign in with email or social accounts, no seed phrase to start, network fees covered for users, pay by card. Same on-chain security, your keys stay yours.' },
      { title: 'Expansion', items: 'Multichain, API & "Pay me with JoobEscrow" widget, receipts & invoices.' },
      { title: 'Joob ecosystem: co-funded escrow', items: 'With PerShare V2: several sponsors pool funds and open one JoobEscrow escrow, paid only on delivery; refunds return pro-rata in the same currency. Built on Escrow V5, audited before launch.' },
      { title: 'JOOB governance', items: 'JOOB holders vote on protocol decisions: new categories, fee tiers, ecosystem grants. Off-chain votes first, then on-chain governance, and staked arbitrators.' },
    ],
  },
];

const phaseStatus = (steps) => {
  const has = (st) => steps.some((s) => s.status === st);
  if (steps.every((s) => s.status === 'done')) return 'done';
  if (has('now') || has('done')) return 'now';
  return has('next') ? 'next' : undefined;
};

export const ROADMAP_PHASES_WITH_STATUS = ROADMAP_PHASES.map((p) => ({ ...p, status: phaseStatus(p.steps) }));

export const ROADMAP_STEPS = ROADMAP_PHASES.flatMap((p) => p.steps);

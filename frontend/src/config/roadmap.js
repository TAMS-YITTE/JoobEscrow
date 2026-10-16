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
      { title: 'Foundations', status: 'done', items: 'The Universal Escrow V4 contract is live on BNB Smart Chain, deployed with the same audited code on five fee tiers (2%, 3%, 5%, 8% and 10%) plus a 0% demo contract. SpyWolf found no critical or high issue, every contract is verified on BscScan and owned by a 3-of-5 Safe multisig, so no single person can act alone. Users are paid through pull payments that keep working even if the contract is paused, and any change to fees or limits sits in a public 2-day timelock. The app covers 15 categories, from freelance work to OTC deals, with an end-to-end encrypted chat between client and provider.' },
      { title: 'JOOB token & vesting', status: 'done', items: 'JOOB has a fixed supply of 1,000,000,000 tokens, with no mint function and no transfer tax, audited by SpyWolf. Team tokens are locked until January 2028 and treasury tokens until July 2027 in OpenZeppelin vesting contracts owned by the Safe, so they cannot be sold early.' },
    ],
  },
  {
    phase: '02',
    title: 'Trust layer & Presale',
    summary: '$1 interactive demo (/try) and shareable escrow links are live. JOOB presale live since October 15, 2026, with a sealed vault and vesting for every participant.',
    steps: [
      { title: 'Trust layer', status: 'now', items: 'Goal: anyone can check a deal before paying or before starting work. Live today: a $1 demo that runs the full escrow cycle between two of your own wallets, and public deal pages where a provider can check that the funds are locked before starting work, even without a wallet. Next: personal Telegram alerts for your own escrows (opt-in, you link your wallet yourself), and dispute evidence submitted directly from the app, which the contract already supports.' },
      { title: 'JOOB presale', status: 'now', items: 'Live since October 15, 2026, it closes on January 13, 2027 at 13:59 UTC. The price starts at $0.001 and rises by $0.0002 every 2 days, set by the contract, not by us. You can pay in USDT or USDC on BNB Chain, or from 6 other EVM chains through LI.FI, check any allocation without connecting a wallet, and follow purchases live on Telegram. The full 163.5M JOOB allocation was deposited before opening (sealed vault), every buyer has the same vesting, and unsold tokens will be returned to the Safe and burned in a public transaction.' },
    ],
  },
  {
    phase: '03',
    title: 'TGE & Liquidity',
    summary: 'Right after the presale closes: PancakeSwap JOOB/USDT pool with LP locked 12 months or more, unsold presale tokens burned in a public transaction, audited staking opens.',
    steps: [
      { title: 'TGE & liquidity', items: `Right after the presale closes, anyone can finalize the sale on-chain: 20% of every allocation becomes claimable, then the rest unlocks linearly over 180 days. Unsold tokens are burned in a public transaction. A JOOB/USDT pool opens on PancakeSwap at a planned initial price of $${PLANNED_LISTING_PRICE}, funded with part of the funds raised, with LP tokens locked 12 months or more.` },
      { title: 'First JOOB utilities', items: 'JOOB staking opens (contract already deployed and audited): stake JOOB, earn JOOB in 30-day periods, with a 7-day withdrawal delay and no guaranteed yield. JOOB is activated on PerShare, boosts and badges arrive in the app, and Early Escrow points start rewarding real escrow usage.' },
    ],
  },
  {
    phase: '04',
    title: 'Escrow V5, Web2 & Expansion',
    summary: 'JOOB holder fee tiers, milestone payments, email sign-in and gasless payouts, then multichain, co-funded escrow and JOOB governance.',
    steps: [
      { title: 'Escrow V5', items: 'JOOB holder fee tiers: stake JOOB to pay lower fees, up to a full fee waiver at the highest tier. Also on-chain affiliate rewards, gasless payouts so providers do not need BNB to get paid, and verified reputation profiles that show the track record of each provider. Audited before launch.' },
      { title: 'Escrow V5.1', items: 'Milestone payments for longer projects: pay a deal in stages, release part of the funds at each step, settle amicably without a dispute, and run bulk deals for agencies managing many providers.' },
      { title: 'As easy as a Web2 app', items: 'Hide the Web3 complexity: sign in with email or social accounts, no seed phrase to start, network fees covered for users, pay by card. Same on-chain security, your keys stay yours.' },
      { title: 'Expansion', items: 'More networks, a public API and a "Pay me with JoobEscrow" widget any website or media can add to get paid safely, plus receipts and invoices for every deal.' },
      { title: 'Joob ecosystem: co-funded escrow', items: 'With PerShare V2: several sponsors pool funds and open one JoobEscrow escrow, paid only on delivery; refunds return pro-rata in the same currency. Built on Escrow V5, audited before launch.' },
      { title: 'JOOB governance', items: 'JOOB holders vote on protocol decisions: new categories, fee tiers, ecosystem grants. Off-chain votes first, then on-chain governance, and staked arbitrators to settle disputes.' },
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

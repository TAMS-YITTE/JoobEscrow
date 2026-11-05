// FAQ escrow : source unique pour /faq (reponse complete) et l'accueil (extrait = summary).
// Verifie sur UniversalServiceEscrow V4 (BscScan, lecture on-chain du 2026-10-09) :
// sorties de fonds = releaseFunds (client), cancelEscrow (avant acceptation), claimTimeout
// (prestataire, apres la deadline, sans litige), resolveDispute (Safe 3/5, partage client/prestataire),
// resolveStaleDispute (50/50 apres staleDisputeTimeout = 30 jours) ; withdraw non bloque par la pause.
export const FAQ = [
  {
    id: 'funds-safety',
    q: 'Is my money safe? Can JoobEscrow access it?',
    summary:
      'Your funds sit in an audited non-custodial smart contract, not in a JoobEscrow wallet, and the team cannot send escrowed funds to an arbitrary address. Funds leave an escrow only when the client releases them, when the client cancels before the provider accepts, when the provider claims them after the deadline with no dispute open, or when a dispute is settled between client and provider.',
    details: [
      'In a dispute, the 3-of-5 Safe multisig can only split the escrowed amount between the client and the provider (any split from 0% to 100%). If a dispute stays unresolved for 30 days, either party can call resolveStaleDispute to split it 50/50 on-chain.',
      'As with any smart contract system, residual technical risks exist.',
    ],
    link: { href: '/risks', label: 'Read the full risk disclosure' },
  },
  {
    id: 'disputes',
    q: 'Who resolves disputes and how?',
    summary:
      'Either party can open a dispute while the escrow is funded and share evidence. The JoobEscrow arbitration team reviews it, and the 3-of-5 Safe multisig splits the funds between client and provider (any split from 0% to 100%). If a dispute stays unresolved for 30 days, either party can call resolveStaleDispute to trigger a 50/50 split on-chain.',
    details: [
      'Both parties share their evidence (deliverables, messages, requirements). The contract can record a fingerprint (hash) of each piece of evidence on-chain; in-app evidence upload is coming.',
      'The split depends on the work delivered, for example 70% to the provider and 30% to the client.',
    ],
    link: { href: '/how-disputes-work', label: 'How disputes work' },
  },
  {
    id: 'provider-disappears',
    q: 'What happens if the provider disappears?',
    summary:
      'Every escrow has a delivery deadline set at creation. If the provider never accepts, the client can cancel and get the full deposit back. If the provider accepted but stops delivering, the client should open a dispute before the deadline: after the deadline, the provider can call claimTimeout if no dispute is open.',
    details: [
      'Once a dispute is open, the arbitration team reviews the case and the Safe decides the split. If the dispute stays unresolved for 30 days, either party can call resolveStaleDispute on-chain to split the funds 50/50.',
    ],
  },
  {
    id: 'fees',
    q: 'What fees do I pay for an escrow?',
    summary:
      'Clients pay 0% fees. Providers pay between 2% and 10% depending on the category, deducted from the provider\'s payout only when funds are released. There is no fee for creating or funding an escrow.',
    details: [
      'If an escrow is cancelled before the provider accepts, the client gets a full refund (minus network gas). In a dispute, the fee applies only to the provider\'s share.',
    ],
  },
  {
    id: 'contract-bug',
    q: 'What if the smart contract has a bug?',
    summary:
      'The escrow contract is built on OpenZeppelin libraries and was audited by SpyWolf: no critical or high-severity issue, and every finding was fixed and re-checked.',
    details: [
      'It uses pull-over-push payouts, reentrancy guards and a pause switch for emergencies; dispute resolution and withdrawals of credited funds keep working even when paused. An audit reduces risk but cannot rule out every bug: only escrow amounts you can afford to lose.',
    ],
    link: { href: '/security', label: 'Security & audits' },
  },
  {
    id: 'messages',
    q: 'Are communications with the provider secure?',
    summary:
      'The in-app chat uses the XMTP protocol: messages are end-to-end encrypted between wallets and travel over the XMTP network, not through JoobEscrow servers.',
    details: [
      'On-chain transactions, contract interactions and wallet addresses remain publicly recorded on BNB Smart Chain.',
    ],
  },
];

// Presale : questions deplacees de /presale (texte complet conserve ici).
FAQ.push(
  {
    id: 'presale-price',
    q: 'How is the presale price set?',
    summary: 'By the smart contract, from a public schedule: it started at $0.001 and rises by $0.0002 every 2 days. You pay the price at the moment your transaction executes.',
  },
  {
    id: 'presale-claim',
    q: 'When can I claim my presale tokens?',
    summary: 'When the sale ends, 20% of your allocation becomes claimable on the presale page. The remaining 80% unlocks linearly over 180 days, and claims cannot be paused.',
  },
  {
    id: 'presale-safety',
    q: 'Is the presale safe?',
    summary: 'The token and presale contracts are verified on BscScan and audited by SpyWolf, with no critical, high or medium issue. The full cap was locked in the contract before the sale opened, so every allocation is covered. An audit reduces risk but does not remove it.',
  },
  {
    id: 'presale-payment',
    q: 'What can I pay with in the presale?',
    summary: 'USDT or USDC on BNB Smart Chain go straight to the contract. Other tokens (BNB, ETH, POL, AVAX, ARB, OP) from 7 EVM networks are converted by LI.FI, with fees shown before you confirm.',
  },
  {
    id: 'presale-listing',
    q: 'Will JOOB be tradable after the sale?',
    summary: 'A JOOB/USDT pool on PancakeSwap is planned right after the sale, opened above every presale price. After that the market sets the price, which may be lower than what you paid: only contribute what you can afford to lose.',
  },
  {
    id: 'presale-eligibility',
    q: 'Who can join the presale?',
    summary: 'Any adult (18+). Each participant is responsible for complying with the laws of their own country. There is no refund once you buy.',
    link: { href: '/presale-terms', label: 'Presale Terms' },
  },
  {
    id: 'what-is-joob',
    q: 'What is JOOB?',
    summary:
      'JOOB is the BEP-20 token of the JoobEscrow ecosystem on BNB Smart Chain (fixed supply of 1,000,000,000). It is designed to be the key to the protocol: governance (JOOB holders vote on protocol decisions such as new categories, fee tiers and ecosystem grants), fee reductions for holders who stake JOOB, by tier, up to a full fee waiver at the highest tier (with Escrow V5), JOOB staking (contract already deployed and audited by SpyWolf, opening after the TGE: stake JOOB, earn JOOB rewards, 7-day withdrawal delay, no guaranteed yield), 0% fees on PerShare (our audited collective-pool app) for holders above a threshold from the TGE, plus boosts and badges, affiliate rewards in JOOB and Early Escrow points.',
    details: [
      'These features ship progressively and are not guaranteed by a given date. JOOB gives no ownership, profit or revenue right in JoobEscrow, and using JoobEscrow escrows never requires JOOB.',
    ],
    link: { href: '/tokenomics', label: 'Tokenomics' },
  },
  {
    id: 'pay-with-sol',
    q: 'I only have SOL (Solana). Can I join the presale?',
    summary:
      'Yes, in two steps. Solana cannot pay the presale contract directly, so first swap your SOL into USDT on BNB Smart Chain, sent to your own wallet on BNB Smart Chain (for example MetaMask). A cross-chain swap such as Jumper (jumper.xyz, powered by LI.FI) can do it; check the route and fees before you confirm. Then buy on the presale page with that USDT.',
    details: [
      'Never send funds directly to the presale contract address: only purchases made through the presale page are counted.',
    ],
    link: { href: '/presale', label: 'Presale' },
  },
);

// Accueil : levee d'objections sur la presale, reponse courte et lien vers le detail.
export const HOME_FAQ = [
  {
    q: 'Is it safe?',
    summary: 'The token and presale contracts are verified on BscScan and audited by SpyWolf, and the founder is KYC verified by the same firm. The full presale cap was locked in the contract before the sale opened.',
    href: '/security',
  },
  {
    q: 'When do I get my tokens?',
    summary: 'When the sale ends, 20% of your JOOB becomes claimable on the presale page. The remaining 80% unlocks linearly over 180 days.',
    href: '/faq#presale-claim',
  },
];

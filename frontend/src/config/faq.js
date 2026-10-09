// FAQ escrow : source unique pour /faq (reponse complete) et l'accueil (extrait = summary).
// Verifie sur UniversalServiceEscrow V4 (BscScan, lecture on-chain du 2026-10-09) :
// sorties de fonds = releaseFunds (client), cancelEscrow (avant acceptation), claimTimeout
// (prestataire, apres la deadline, sans litige), resolveDispute (Safe 3/5, partage client/prestataire),
// resolveStaleDispute (50/50 apres staleDisputeTimeout = 30 jours) ; withdraw non bloque par la pause.
export const FAQ = [
  {
    id: 'funds-safety',
    home: true,
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
    home: true,
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
    home: true,
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
    home: true,
    q: 'Are communications with the provider secure?',
    summary:
      'The in-app chat uses the XMTP protocol: messages are end-to-end encrypted between wallets and travel over the XMTP network, not through JoobEscrow servers.',
    details: [
      'On-chain transactions, contract interactions and wallet addresses remain publicly recorded on BNB Smart Chain.',
    ],
  },
];

export const HOME_FAQ = FAQ.filter((f) => f.home);

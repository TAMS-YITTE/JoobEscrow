// Comparatif de l'accueil. Frais des autres plateformes : chiffres publics releves le 05/11/2026
// (sites tiers, Upwork 0-15 % variable depuis mai 2025, Fiverr 20 % + 5,5 %, Freelancer.com 10 % + 3 %,
// Escrow.com 0,89 % a 3,25 %). A revoir si une plateforme change sa grille.
export const COMPARISON_COLUMNS = ['Who holds the funds', 'Client fee', 'Provider fee', 'Pay in crypto', 'Disputes'];

export const COMPARISON = [
  { name: 'JoobEscrow', highlight: true, cells: ['Audited smart contract (non-custodial)', '0%', '2% to 10%', 'Yes, USDT and USDC', '3-of-5 Safe, 50/50 on-chain after 30 days'] },
  { name: 'Upwork', cells: ['Upwork', 'Marketplace fee', 'Up to 15%', 'No', 'Upwork support'] },
  { name: 'Fiverr', cells: ['Fiverr', '5.5% service fee', '20%', 'No', 'Fiverr support'] },
  { name: 'Freelancer.com', cells: ['Freelancer.com', '3%', '10%', 'No', 'Freelancer.com support'] },
  { name: 'Escrow.com', cells: ['Escrow.com (custodial)', '0.89% to 3.25%, shared', 'Shared', 'Selected coins', 'Escrow.com team'] },
];

export const COMPARISON_NOTE = 'Fees as publicly reported in 2026, they can vary by plan, category and amount. Check each platform before you decide.';

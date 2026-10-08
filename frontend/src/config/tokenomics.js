// Repartition de l'offre fixe de 1 Md JOOB (MASTER_PROMPT §5). Source unique pour /presale et l'accueil.
// Les 13,5 M de bonus/parrainage du plafond presale (163,5 M) sont pris sur le marketing (decision du 30/09).
// onChain = vesting impose par un contrat deploye ; contract = VestingWallet OZ (deploye le 03/10/2026, beneficiaire Safe).
export const TOTAL_SUPPLY = 1_000_000_000;

export const TOKENOMICS = [
  { name: 'Presale', pct: 15, color: '#10b981', vesting: '20% at sale end, then linear over 180 days', onChain: true },
  { name: 'Presale bonus & referral', pct: 1.35, color: '#6ee7b7', vesting: 'Same vesting as the presale', onChain: true },
  { name: 'Ecosystem & usage', highlight: 'staking rewards', pct: 25, color: '#3b82f6', vesting: 'Distributed progressively over about 48 months, every transfer disclosed' },
  { name: 'Treasury (Safe)', pct: 13, color: '#8b5cf6', vesting: 'Locked until Jul 13, 2027, then linear over 36 months', onChain: true, contract: '0x8cbac3786F61572D4571C951e9215FC289FB2ff3' },
  { name: 'Team', pct: 12, color: '#f59e0b', vesting: 'Locked until Jan 13, 2028, then linear over 24 months', onChain: true, contract: '0xc430f8C4E26FFc25326C4AA84947B3e2A1328012' },
  { name: 'DEX liquidity', pct: 10, color: '#06b6d4', vesting: 'Paired at listing, LP locked 12 months or more' },
  { name: 'Marketing', pct: 6.65, color: '#ec4899', vesting: '10% at TGE, then 18 months' },
  { name: 'Partners & KOL', pct: 7, color: '#f97316', vesting: '3-month cliff, then 12 months, always disclosed' },
  { name: 'Airdrop (points)', pct: 5, color: '#eab308', vesting: '20% at TGE, then 6 months (audited contract)' },
  { name: 'CEX reserve', pct: 5, color: '#64748b', vesting: 'Used only for a centralized exchange listing' },
];

// Debut cumule de chaque segment (donut).
export const TOKENOMICS_SEGMENTS = TOKENOMICS.map((t, i) => ({ ...t, start: TOKENOMICS.slice(0, i).reduce((a, x) => a + x.pct, 0) }));

export const fmtM = (pct) => `${((TOTAL_SUPPLY * pct) / 100 / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;

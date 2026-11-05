// Equipe affichee sur /security (pseudonymes et roles valides par le fondateur le 05/11/2026).
// Signataires du Safe : lus on-chain (getOwners du Safe 3-of-5) le 05/11/2026, sans attribution nominative.
export const TEAM_LOCATION = 'Based in France';

export const TEAM = [
  { initials: 'T.S', name: 'T.S', role: 'Founder & Lead Developer', desc: '20+ years in IT and finance, long-standing DeFi focus. KYC verified by SpyWolf.' },
  { initials: 'IN', name: 'I.N.', role: 'Lead Solidity Developer', desc: 'BNB Chain deployment specialist.' },
  { initials: 'CAB', name: 'C.A.B.', role: 'Security & Audits', desc: 'Code review, audit follow-up and monitoring.' },
  { initials: 'SY', name: 'S.Y.', role: 'Arbitration Lead', desc: 'Reviews disputes and evidence before the Safe decides.' },
  { initials: 'EMS', name: 'E.M.S.', role: 'Growth & Marketing', desc: 'Campaigns, contests and content.' },
  { initials: 'MS', name: 'Tyma (M.S.)', role: 'Admin, Community & Partnerships', desc: 'Official channels, support, KOLs, media and listings.' },
];

// Signataire nomme seulement quand le detenteur de la cle est confirme par le fondateur.
export const SAFE_SIGNERS = [
  { address: '0x944b6B2266FA2e21Ec95c507860a65769b948c39', holder: 'T.S, Founder' },
  { address: '0x8f72097717722D15c796aebD06AD7EaF3a1b41f7', holder: 'I.N., Lead Solidity Developer' },
  { address: '0x46E10f8774C331F3f18EBeca1Dd5Cf9c30C7637a', holder: 'E.M.S., Growth & Marketing' },
  { address: '0xFF26Ed2Ed32E06E09BeA8253Be0C8C2D7669532a', holder: 'S.Y., Arbitration Lead' },
  { address: '0xEc68d396DBd080fBe18b1f47629880d51727FeBC', holder: 'C.A.B., Security & Audits' },
];

// Seuls comptes officiels de l'equipe sur Telegram (anti-usurpation), confirmes par le fondateur le 05/11/2026.
export const OFFICIAL_ADMINS = [
  { handle: '@JoobEscrow', name: 'joobescrow.com', role: 'Group owner (Founder)', url: 'https://t.me/JoobEscrow' },
  { handle: '@tyma_one', name: 'Tyma', role: 'Admin', url: 'https://t.me/tyma_one' },
];

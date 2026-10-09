// Liens officiels publics (un seul endroit a mettre a jour).
export const TELEGRAM_URL = 'https://t.me/JoobEscrow_Official';
export const X_URL = 'https://x.com/JoobEscrow';
export const ZEALY_URL = 'https://zealy.io/cw/joobescrow-0522';

// Campagne Zealy affichee dans le bandeau du site. Le bandeau disparait seul apres endsAt.
// endsAt (ISO, UTC) : fin du Genesis Sprint sur Zealy, 15/10/2026 14:00 heure de Paris = 12:00 UTC.
// Pour une nouvelle campagne : changer les textes et endsAt ; endsAt null = pas de masquage automatique.
export const ZEALY_CAMPAIGN = {
  url: ZEALY_URL,
  long: 'Genesis Sprint is live: complete quests, earn XP and OG roles before Oct 15',
  short: 'Genesis Sprint live on Zealy · earn XP before Oct 15',
  endsAt: '2026-10-15T12:00:00Z',
};

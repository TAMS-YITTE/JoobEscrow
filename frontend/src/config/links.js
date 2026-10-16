// Liens officiels publics (un seul endroit a mettre a jour).
export const TELEGRAM_URL = 'https://t.me/JoobEscrow_Official';
export const X_URL = 'https://x.com/JoobEscrow';
// Article de lancement publie par BSC News (rubrique Sponsored), le 15/10/2026.
export const BSCN_ARTICLE_URL = 'https://bsc.news/sponsored/joobescrow-joob-token-presale';
export const ZEALY_URL = 'https://zealy.io/cw/joobescrow-0522';

// Campagne Zealy affichee dans le bandeau du site. Le bandeau disparait seul apres endsAt.
// endsAt (ISO, UTC) : fin du JoobEscrow Launch Sprint sur Zealy, 31/10/2026 12:00 heure de Paris (heure d'hiver) = 11:00 UTC
// (sprint du 16/10 au 31/10 12:00, heure de Paris).
// Pour une nouvelle campagne : changer les textes et endsAt ; endsAt null = pas de masquage automatique.
export const ZEALY_CAMPAIGN = {
  url: ZEALY_URL,
  long: 'JoobEscrow Sprint is live on Zealy until Oct 31: complete quests and earn XP',
  short: 'Zealy Sprint live · until Oct 31 · earn XP',
  endsAt: '2026-10-31T11:00:00Z',
};

import { firstProvider, recentBuys, SERVER_RPCS } from '../../../lib/presaleLogs';

// Derniers achats de la presale, lus cote serveur et mis en cache 5 minutes (src/lib/presaleLogs.js).
export const revalidate = 300;
export const maxDuration = 60;

export async function GET() {
  try {
    const p = await firstProvider(SERVER_RPCS(), { 'User-Agent': 'JoobEscrow-site/1.0' });
    return Response.json({ buys: await recentBuys(p), updatedAt: Math.floor(Date.now() / 1000) });
  } catch (err) {
    console.error('[recent-buys]', err?.shortMessage || err?.message || err);
    return Response.json({ buys: [], error: 'unavailable' });
  }
}

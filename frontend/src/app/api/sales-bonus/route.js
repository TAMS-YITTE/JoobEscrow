import { firstProvider, fairShare, SERVER_RPCS } from '../../../lib/presaleLogs';
import { SALES_BONUS } from '../../../config/promo';

// Beneficiaires du bonus Fair Share, calcules cote serveur, cache 10 minutes (src/lib/presaleLogs.js).
export const revalidate = 600;
export const maxDuration = 60;

export async function GET() {
  try {
    const p = await firstProvider(SERVER_RPCS(), { 'User-Agent': 'JoobEscrow-site/1.0' });
    return Response.json(await fairShare(p));
  } catch (err) {
    console.error('[sales-bonus]', err?.shortMessage || err?.message || err);
    const started = Date.now() / 1000 >= Date.parse(SALES_BONUS.start) / 1000;
    return Response.json({ campaign: SALES_BONUS.name, entries: [], started, error: 'unavailable' });
  }
}

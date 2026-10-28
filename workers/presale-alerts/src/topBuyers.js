// Classement « Top Buyers » publie sur Telegram, aux dates de la config (cron quotidien).
// Meme regles que contracts-token/scripts/top-buyers.js : achats de la periode cumules par
// wallet, Safe et ses signataires exclus (lus on-chain), cagnotte = poolBps de l'eligible,
// plafonnee. Lecture seule.
//
// Variables (wrangler.toml) : SAFE_ADDRESS, TOP_BUYERS (JSON, voir parseTopBuyers).
// Lecture des events : RPC de secours FALLBACK_RPC_URL (NodeReal, 50 000 blocs par requete).
// Les achats lus sont gardes dans le Durable Object : chaque publication ne relit que les
// blocs depuis la precedente (peu de sous-requetes, limite Cloudflare gratuite).

const TOPIC_BOUGHT = '0xbd37c6c26f83ab804758436c263701c75879733903991b821180916fd6726eb6';
const SEL_GET_OWNERS = '0xa0e67e2b'; // getOwners()
const DECIMALS = 18n;
const UNIT = 10n ** DECIMALS;
const CONFIRMATIONS = 3n;
const MAX_REQUESTS = 40; // sous-requetes par execution (Telegram compris dans la marge)
const PRESALE_LINK = 'joobescrow.com/presale?utm_source=telegram&utm_campaign=topbuyers';

const hex = (n) => `0x${n.toString(16)}`;
const day = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * TOP_BUYERS = { name, start, end (ISO UTC), postDates: ["AAAA-MM-JJ"], poolBps, poolCap (USDT),
 *                showPoolFrom (USDT), splitBps: [..] (total 10000), exclude: [adresses] }
 * Le jour de `end`, le message final part au cron qui suit la fin.
 */
export function parseTopBuyers(raw) {
  if (!raw) return null;
  const c = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const startMs = Date.parse(c.start);
  const endMs = Date.parse(c.end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) throw new Error('TOP_BUYERS: start/end invalides');
  const split = (c.splitBps ?? []).map(BigInt);
  if (!split.length || split.reduce((s, b) => s + b, 0n) !== 10000n) throw new Error('TOP_BUYERS: splitBps doit totaliser 10000');
  return {
    name: c.name ?? 'Top Buyers',
    startMs,
    endMs,
    postDates: new Set(c.postDates ?? []),
    poolBps: BigInt(c.poolBps),
    poolCap: BigInt(c.poolCap) * UNIT,
    showPoolFrom: BigInt(c.showPoolFrom ?? 0) * UNIT,
    split,
    exclude: (c.exclude ?? []).map((a) => a.toLowerCase()),
  };
}

/** Publication due a `nowMs` : 'update', 'final' ou null. */
export function dueKind(config, nowMs) {
  if (nowMs < config.startMs) return null;
  if (nowMs >= config.endMs) return day(nowMs) === day(config.endMs) ? 'final' : null;
  return config.postDates.has(day(nowMs)) ? 'update' : null;
}

/** buys : [{ buyer, paid, block }] ; endBlock : premier bloc hors periode (ou null). */
export function leaderboard(buys, config, excluded, endBlock) {
  const ex = new Set([...excluded].map((a) => a.toLowerCase()));
  const totals = new Map();
  let eligible = 0n;
  for (const b of buys) {
    if (endBlock !== null && b.block >= endBlock) continue;
    if (ex.has(b.buyer)) continue;
    eligible += b.paid;
    const t = totals.get(b.buyer) ?? { buyer: b.buyer, total: 0n, reachedAt: 0n };
    t.total += b.paid;
    t.reachedAt = b.block; // departage : premier a atteindre le total
    totals.set(b.buyer, t);
  }
  let pool = (eligible * config.poolBps) / 10000n;
  if (pool > config.poolCap) pool = config.poolCap;
  const ranking = [...totals.values()]
    .sort((a, b) => (a.total === b.total ? (a.reachedAt < b.reachedAt ? -1 : 1) : a.total > b.total ? -1 : 1))
    .map((r, i) => ({ ...r, prize: i < config.split.length ? (pool * config.split[i]) / 10000n : 0n }));
  return { eligible, pool, ranking };
}

const usd = (v) => (Number(v) / Number(UNIT)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Message Telegram (HTML, anglais, sans emoji). */
export function formatLeaderboard(result, config, kind, nowMs) {
  const podium = result.ranking.slice(0, config.split.length);
  const showPool = kind === 'final' || result.pool >= config.showPoolFrom;
  const days = Math.floor((nowMs - config.startMs) / 86_400_000);
  const lines = [kind === 'final' ? `<b>JOOB ${config.name}, final results</b>` : `<b>JOOB ${config.name}, day ${days} leaderboard</b>`, ''];
  if (!podium.length) lines.push('No eligible purchase yet.');
  podium.forEach((r, i) => {
    const prize = kind === 'final' ? `, wins ${usd(r.prize)} USDT` : showPool ? `, would win ${usd(r.prize)} USDT` : '';
    lines.push(`#${i + 1} ${short(r.buyer)}: ${usd(r.total)} USDT${prize}`);
  });
  lines.push('');
  if (kind === 'final') {
    lines.push(`Prize pool: ${usd(result.pool)} USDT. Payouts will be sent in USDT and the transaction hashes published.`, '', 'Thank you to everyone who took part.');
  } else {
    // Montant pour passer premier, arrondi aux 5 USDT superieurs.
    const top = podium.length ? podium[0].total : 0n;
    const step = 5n * UNIT;
    const lead = ((top + UNIT / 100n + step - 1n) / step) * step;
    lines.push(podium.length
      ? `The top spot is wide open: a ${usd(lead).replace('.00', '')} USDT purchase takes the lead today.`
      : 'The top spot is open: any purchase takes the lead today.');
    lines.push(`${config.poolBps / 100n}% of every purchase this week goes to the prize pool for the top ${config.split.length}${showPool ? `, now ${usd(result.pool)} USDT` : ''}.`);
    lines.push('', `Ends ${new Date(config.endMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} at ${new Date(config.endMs).toISOString().slice(11, 16)} UTC.`);
  }
  lines.push(PRESALE_LINK);
  return lines.join('\n');
}

// --- Lecture on-chain ---

function makeRpc(url) {
  let count = 0;
  const call = async (method, params) => {
    if (++count > MAX_REQUESTS) throw new Error('Top Buyers: budget de sous-requetes depasse');
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
    const json = await res.json();
    if (json.error) throw new Error(`${method}: ${json.error.message}`);
    return json.result;
  };
  return call;
}

const blockTs = async (rpc, n) => BigInt((await rpc('eth_getBlockByNumber', [hex(n), false])).timestamp) * 1000n;

/** Premier bloc dont l'horodatage est >= tsMs : interpolation (blocs BSC reguliers), quelques appels. */
export async function blockAtOrAfter(rpc, tsMs, head, headTs) {
  let lo = 0n;
  let loTs = 0n;
  let hi = head;
  let hiTs = headTs;
  const target = BigInt(tsMs);
  if (target > hiTs) return head + 1n;
  // Point de depart : ~1 000 000 blocs avant la tete couvre ~5 jours ; elargi si besoin.
  let probe = head > 2_000_000n ? head - 2_000_000n : 0n;
  let probeTs = await blockTs(rpc, probe);
  if (probeTs < target) { lo = probe; loTs = probeTs; } else { hi = probe; hiTs = probeTs; loTs = await blockTs(rpc, 0n); }
  while (hi - lo > 1n) {
    let guess = lo + ((target - loTs) * (hi - lo)) / (hiTs - loTs || 1n);
    if (guess <= lo) guess = lo + 1n;
    if (guess >= hi) guess = hi - 1n;
    const t = await blockTs(rpc, guess);
    if (t < target) { lo = guess; loTs = t; } else { hi = guess; hiTs = t; }
    // Encadrement serre : finir par dichotomie lineaire bornee.
    if (hi - lo <= 64n) {
      while (hi - lo > 1n) {
        const mid = (lo + hi) / 2n;
        if ((await blockTs(rpc, mid)) < target) lo = mid; else hi = mid;
      }
    }
  }
  return hi;
}

async function safeOwners(rpc, safe) {
  const data = await rpc('eth_call', [{ to: safe, data: SEL_GET_OWNERS }, 'latest']);
  const words = data.slice(2).match(/.{64}/g) ?? [];
  const n = Number(BigInt(`0x${words[1]}`));
  return words.slice(2, 2 + n).map((w) => `0x${w.slice(24)}`.toLowerCase());
}

/** Lit les achats de la periode jusqu'a `upto` (inclus), a partir du dernier bloc deja lu. Dedoublonne par cle. */
async function syncBuys(env, rpc, state, config, upto, uptoTs) {
  const s = state?.name === config.name && state?.v === 2 ? { ...state, buys: [...state.buys] } : { v: 2, name: config.name, buys: [] };
  if (s.startBlock === undefined) s.startBlock = (await blockAtOrAfter(rpc, config.startMs, upto, uptoTs)).toString();
  if (s.endBlock === undefined && BigInt(uptoTs) >= BigInt(config.endMs)) s.endBlock = (await blockAtOrAfter(rpc, config.endMs, upto, uptoTs)).toString();
  const range = BigInt(env.FALLBACK_RANGE ?? 50000);
  const keys = new Set(s.buys.map((b) => b.key));
  let from = s.scannedTo === undefined ? BigInt(s.startBlock) : BigInt(s.scannedTo) + 1n;
  const to = s.endBlock !== undefined && BigInt(s.endBlock) - 1n < upto ? BigInt(s.endBlock) - 1n : upto;
  while (from <= to) {
    const b = to < from + range - 1n ? to : from + range - 1n;
    const logs = await rpc('eth_getLogs', [{ address: env.PRESALE_ADDRESS, fromBlock: hex(from), toBlock: hex(b), topics: [TOPIC_BOUGHT] }]);
    for (const l of logs) {
      const key = `${l.transactionHash}:${BigInt(l.logIndex)}`;
      if (keys.has(key)) continue;
      keys.add(key);
      s.buys.push({ key, buyer: `0x${l.topics[1].slice(26)}`.toLowerCase(), paid: BigInt(`0x${l.data.slice(2, 66)}`).toString(), block: BigInt(l.blockNumber).toString(), logIndex: BigInt(l.logIndex).toString() });
    }
    s.scannedTo = b.toString();
    from = b + 1n;
  }
  // Signataires du Safe : relus au plus une fois par jour.
  if (!s.owners || s.ownersDay !== day(Number(uptoTs))) {
    s.owners = await safeOwners(rpc, env.SAFE_ADDRESS);
    s.ownersDay = day(Number(uptoTs));
  }
  return s;
}

const excludedSet = (env, config, s) => new Set([...config.exclude, env.SAFE_ADDRESS.toLowerCase(), ...s.owners]);
const toBuys = (s) => s.buys.map((b) => ({ buyer: b.buyer, paid: BigInt(b.paid), block: BigInt(b.block), logIndex: BigInt(b.logIndex ?? 0) }));

/**
 * Publication du classement. state : { v, name, startBlock, endBlock, scannedTo, buys[], owners, lastPost } (DO).
 * Renvoie { state, text } ; text = null si rien a publier.
 */
export async function runTopBuyers(env, state, nowMs) {
  const config = parseTopBuyers(env.TOP_BUYERS);
  if (!config) return { state, text: null };
  const kind = dueKind(config, nowMs);
  const postKey = `${config.name}:${day(nowMs)}`;
  if (!kind || state?.lastPost === postKey) return { state, text: null };
  if (!env.FALLBACK_RPC_URL) throw new Error('Top Buyers: FALLBACK_RPC_URL (NodeReal) manquant');

  const rpc = makeRpc(env.FALLBACK_RPC_URL);
  const head = BigInt(await rpc('eth_blockNumber', [])) - CONFIRMATIONS;
  const s = await syncBuys(env, rpc, state, config, head, await blockTs(rpc, head));
  const result = leaderboard(toBuys(s), config, excludedSet(env, config, s), s.endBlock !== undefined ? BigInt(s.endBlock) : null);
  return { state: s, text: formatLeaderboard(result, config, kind, nowMs), postKey };
}

/**
 * Rang en direct pour les alertes d'achat. purchases : [{ key, buyer, block }] (alerte).
 * Renvoie { state, ranks: Map(key -> { rank, total }) } ; vide hors periode ou si TOP_BUYERS absent.
 */
export async function liveRanks(env, state, purchases, upto, nowMs) {
  const ranks = new Map();
  const config = parseTopBuyers(env.TOP_BUYERS);
  if (!config || !env.FALLBACK_RPC_URL || !purchases.length) return { state, ranks };
  // Fenetre : de la date de debut a une heure apres la fin (achats de fin de periode lus en retard).
  if (nowMs < config.startMs || nowMs > config.endMs + 3_600_000) return { state, ranks };
  const rpc = makeRpc(env.FALLBACK_RPC_URL);
  const s = await syncBuys(env, rpc, state, config, upto, await blockTs(rpc, upto));
  const excluded = excludedSet(env, config, s);
  const all = toBuys(s);
  const endBlock = s.endBlock !== undefined ? BigInt(s.endBlock) : null;
  for (const p of purchases) {
    const [, idx] = p.key.split(':');
    const at = { block: p.block, logIndex: BigInt(idx) };
    if (BigInt(s.startBlock) > at.block || (endBlock !== null && at.block >= endBlock)) continue;
    if (excluded.has(p.buyer.toLowerCase())) continue;
    // Classement tel qu'il etait juste apres cet achat.
    const upToHere = all.filter((b) => b.block < at.block || (b.block === at.block && b.logIndex <= at.logIndex));
    const { ranking } = leaderboard(upToHere, config, excluded, endBlock);
    const i = ranking.findIndex((r) => r.buyer === p.buyer.toLowerCase());
    if (i >= 0) ranks.set(p.key, { rank: i + 1, total: ranking[i].total, endMs: config.endMs });
  }
  return { state: s, ranks };
}

/** Ligne ajoutee a l'alerte d'achat. */
export function rankLine(r) {
  const end = new Date(r.endMs);
  const when = `${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}, ${end.toISOString().slice(11, 16)} UTC`;
  return `🏆 Top Buyers: this wallet is now <b>#${r.rank}</b> with ${usd(r.total)} USDT this week. Ends ${when}.`;
}

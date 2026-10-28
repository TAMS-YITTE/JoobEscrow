import { DurableObject } from 'cloudflare:workers';
import { runTopBuyers, liveRanks, rankLine } from './topBuyers.js';

// Alertes Telegram des achats de la presale JOOB (VestingPresale, BNB Smart Chain).
// Cron chaque minute : lit totalRaised() ; seulement s'il a bouge, lit les events
// TokensBought depuis le dernier bloc traite (curseur en KV) et publie un message par
// achat. La plupart des executions ne font donc que deux appels RPC legers, que tous
// les RPC publics acceptent ; eth_getLogs (refuse ou limite par la plupart d'entre
// eux) n'est appele que lorsqu'il y a reellement un achat. Lecture seule.
//
// Le curseur vit dans un Durable Object (un seul exemplaire, ecritures immediatement
// visibles, une execution a la fois) : avec KV, une execution pouvait relire un
// curseur pas encore propage et republier un achat deja annonce.
//
// Secrets (wrangler secret put) : TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
//                                 FALLBACK_RPC_URL (optionnel, ex. Alchemy).
// Variables (wrangler.toml)     : PRESALE_ADDRESS, RPC_URLS (appels simples),
//                                 LOGS_RPC_URLS (eth_getLogs), FALLBACK_ORIGIN, DRY_RUN,
//                                 IMAGE_URL (optionnelle).

// keccak256 des signatures (verifiees contre contracts-token/src/VestingPresale.sol).
const TOPIC_BOUGHT = '0xbd37c6c26f83ab804758436c263701c75879733903991b821180916fd6726eb6'; // TokensBought(address,uint256,uint256,bool,address,uint256)
const TOPIC_BONUS = '0x43f13eddb62d931341dc084f228017290dbd879d3b2a3e727f35921afed3a8fa'; // VolumeBonusCredited(address,uint256,uint256)
const SEL_TOTAL_RAISED = '0xc5c4744c'; // totalRaised()

const CONFIRMATIONS = 3n;
const MAX_RANGE = 2000n; // blocs par requete eth_getLogs (publicnode)
// Taille des tranches du RPC de secours : variable FALLBACK_RANGE (NodeReal : 50 000 blocs ;
// Alchemy gratuit : 10). Par defaut 10, la valeur la plus prudente.
const fallbackRange = (env) => { try { const n = BigInt(env.FALLBACK_RANGE ?? 10); return n > 0n ? n : 10n; } catch { return 10n; } };
const MAX_LOG_REQUESTS = 25; // Cloudflare gratuit : 50 sous-requetes par execution, Telegram compris
const MAX_LAG = 4000n; // ~30 min de blocs BSC (~0,45 s par bloc) : au-dela, publicnode exige une cle d'archive
const MAX_SENDS_PER_RUN = 15; // limite Telegram ~20 messages/min par groupe
// KV gratuit : 1 000 ecritures/jour par compte. Le curseur n'est enregistre qu'apres un
// envoi ou tous les SAVE_EVERY blocs (~7 min) ; au pire on relit ces blocs, sans doublon.
const SAVE_EVERY = 1000n;
const CURSOR_KEY = 'cursor';
const TOP_BUYERS_CRON = '5 14 * * *'; // doit correspondre a wrangler.toml
const DECIMALS = 18; // USDT, USDC (BSC) et JOOB : 18 decimales
const BSCSCAN = 'https://bscscan.com';
const PRESALE_URL = 'https://www.joobescrow.com/presale';

const urls = (list) => (list ?? '').split(',').map((u) => u.trim()).filter(Boolean);

async function rpcAt(url, method, params, origin) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result;
}

// Appels simples (eth_blockNumber, eth_call) : premier RPC de la liste qui repond.
async function rpc(env, method, params) {
  let lastErr;
  for (const url of urls(env.RPC_URLS)) {
    try {
      return await rpcAt(url, method, params);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

const hex = (n) => `0x${n.toString(16)}`;

// totalRaised() au bloc `block` : ne fait que monter, a chaque achat.
async function raisedAt(env, block) {
  return BigInt(await rpc(env, 'eth_call', [{ to: env.PRESALE_ADDRESS, data: SEL_TOTAL_RAISED }, hex(block)]));
}

// Events de la presale entre `from` et `to`, par tranches. RPC de logs (publicnode)
// d'abord ; en cas d'echec, RPC de secours (ex. Alchemy gratuit, 10 blocs par requete).
// S'arrete au budget de requetes : renvoie le dernier bloc entierement lu.
async function getLogs(env, from, to) {
  const filter = (a, b) => [{ address: env.PRESALE_ADDRESS, fromBlock: hex(a), toBlock: hex(b), topics: [[TOPIC_BOUGHT, TOPIC_BONUS]] }];
  const logs = [];
  let requests = 0;
  let scannedTo = from - 1n;
  while (scannedTo < to && requests < MAX_LOG_REQUESTS) {
    const a = scannedTo + 1n;
    const b = to < a + MAX_RANGE - 1n ? to : a + MAX_RANGE - 1n;
    let chunk = null;
    for (const url of urls(env.LOGS_RPC_URLS ?? env.RPC_URLS)) {
      if (requests >= MAX_LOG_REQUESTS) break;
      requests++;
      try { chunk = await rpcAt(url, 'eth_getLogs', filter(a, b)); break; } catch (err) { console.warn(`getLogs ${url}: ${err.message}`); }
    }
    if (chunk) { logs.push(...chunk); scannedTo = b; continue; }
    // Secours par petites tranches ; on avance de ce qui a pu etre lu.
    if (!env.FALLBACK_RPC_URL) break;
    const range = fallbackRange(env);
    // Secours a grandes tranches (NodeReal) : on lit directement jusqu'a `to`.
    const limit = range > MAX_RANGE ? to : b;
    let c = a;
    while (c <= limit && requests < MAX_LOG_REQUESTS) {
      const d = limit < c + range - 1n ? limit : c + range - 1n;
      requests++;
      try {
        logs.push(...await rpcAt(env.FALLBACK_RPC_URL, 'eth_getLogs', filter(c, d), env.FALLBACK_ORIGIN));
      } catch (err) {
        console.warn(`getLogs fallback: ${err.message}`);
        return { logs, scannedTo };
      }
      scannedTo = d;
      c = d + 1n;
    }
    if (scannedTo < b) break;
  }
  return { logs, scannedTo };
}

const word = (data, i) => BigInt(`0x${data.slice(2 + i * 64, 2 + (i + 1) * 64)}`);
const topicAddr = (t) => `0x${t.slice(26)}`;
const toNum = (v) => Number(v) / 10 ** DECIMALS;
const fmt = (n, max = 2) => n.toLocaleString('en-US', { maximumFractionDigits: max });
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const ZERO = '0x0000000000000000000000000000000000000000';
const FIRE_USD = 25; // un 🔥 par tranche de 25 $ (aucun en dessous, au plus 40)
const fmtTok = (v) => { const n = toNum(v); return fmt(n, n < 1000 ? 2 : 0); };

function decodePurchases(logs) {
  // Bonus de volume emis dans la meme transaction, juste apres TokensBought.
  const bonus = new Map();
  for (const l of logs) {
    if (l.topics[0] === TOPIC_BONUS) {
      bonus.set(`${l.transactionHash}:${topicAddr(l.topics[1])}`, { tokens: word(l.data, 0), bps: word(l.data, 1) });
    }
  }
  return logs.filter((l) => l.topics[0] === TOPIC_BOUGHT).map((l) => {
    const buyer = topicAddr(l.topics[1]);
    return {
      key: `${l.transactionHash}:${BigInt(l.logIndex)}`,
      block: BigInt(l.blockNumber),
      tx: l.transactionHash,
      buyer,
      referrer: topicAddr(l.topics[2]),
      paid: word(l.data, 0),
      tokens: word(l.data, 1),
      useUSDT: word(l.data, 2) === 1n,
      referralBonus: word(l.data, 3),
      volumeBonus: bonus.get(`${l.transactionHash}:${buyer}`)?.tokens ?? 0n,
      volumeBps: bonus.get(`${l.transactionHash}:${buyer}`)?.bps ?? 0n,
    };
  });
}

function formatMessage(p, progress, rank) {
  const token = p.useUSDT ? 'USDT' : 'USDC';
  const paid = toNum(p.paid);
  const fires = Math.min(40, Math.floor(paid / FIRE_USD));
  const lines = [
    '🟢 <b>New JOOB presale purchase</b>',
    ...(fires > 0 ? ['🔥'.repeat(fires)] : []),
    '',
    `💵 <b>${fmt(paid)} ${token}</b> → <b>${fmtTok(p.tokens + p.volumeBonus)} JOOB</b>`,
  ];
  if (p.volumeBonus > 0n) {
    lines.push(`🎁 Volume bonus (${Number(p.volumeBps) / 100}% tier): +${fmtTok(p.volumeBonus)} JOOB`);
  }
  if (p.referrer !== ZERO && p.referralBonus > 0n && p.tokens > 0n) {
    const pct = Math.round(Number((p.referralBonus * 1_000_000n) / p.tokens) / 100) / 100; // arrondi (division entiere du contrat)
    lines.push(`🤝 Referral: +${pct}% to the referrer (+${fmtTok(p.referralBonus)} JOOB)`);
  }
  lines.push(`👤 Buyer: <a href="${BSCSCAN}/address/${p.buyer}">${short(p.buyer)}</a>`);
  if (rank) lines.push(rankLine(rank));
  if (progress) lines.push(`📊 Raised so far: $${fmt(toNum(progress.raised), 0)}`);
  lines.push(`🔗 <a href="${BSCSCAN}/tx/${p.tx}">View the transaction on BscScan</a>`, '', `👉 <a href="${PRESALE_URL}">${PRESALE_URL.replace(/^https:\/\/(www\.)?/, '')}</a>`);
  return lines.join('\n');
}

async function telegram(env, method, body) {
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, parse_mode: 'HTML', ...body }),
  });
}

// Classement Top Buyers : texte seul, sans l'image des alertes d'achat.
async function sendTelegramText(env, text) {
  if (env.DRY_RUN === '1') { console.log(`[DRY_RUN]
${text}`); return; }
  const res = await telegram(env, 'sendMessage', { text, disable_web_page_preview: true });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function sendTelegram(env, text) {
  if (env.DRY_RUN === '1') { console.log(`[DRY_RUN]${env.IMAGE_URL ? ` [photo ${env.IMAGE_URL}]` : ''}\n${text}`); return; }
  let res = null;
  if (env.IMAGE_URL) {
    res = await telegram(env, 'sendPhoto', { photo: env.IMAGE_URL, caption: text });
    // Image refusee par Telegram (400) : l'alerte part quand meme, en texte.
    if (res.status === 400) res = null;
  }
  if (!res) res = await telegram(env, 'sendMessage', { text, disable_web_page_preview: true });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// tbStore : etat du classement Top Buyers (Durable Object) ; absent en mode secours KV.
async function run(env, store, tbStore = null) {
  const latest = BigInt(await rpc(env, 'eth_blockNumber', []));
  const safe = latest - CONFIRMATIONS;
  const raised = await raisedAt(env, safe);
  // cursor = { block: dernier bloc entierement traite, sent: achats deja publies dans les
  //            blocs suivants, raised: totalRaised au bloc `block` }
  const cursor = JSON.parse((await store.get()) ?? 'null');
  if (!cursor) {
    // Premier lancement : on part du bloc courant (pas de rattrapage d'historique).
    await store.put(JSON.stringify({ block: safe.toString(), sent: [], raised: raised.toString() }));
    console.log(`Cursor initialised at block ${safe}`);
    return;
  }
  // totalRaised inchange : aucun achat depuis le curseur, rien a lire.
  if (cursor.raised !== undefined && BigInt(cursor.raised) === raised) {
    if (safe - BigInt(cursor.block) >= SAVE_EVERY) {
      await store.put(JSON.stringify({ block: safe.toString(), sent: [], raised: raised.toString() }));
    }
    return;
  }

  let from = BigInt(cursor.block) + 1n;
  if (from > safe) return;
  // Les RPC publics ne servent que les blocs recents : sans RPC de secours, apres une
  // longue panne on saute en avant (les achats manques restent visibles sur BscScan).
  if (safe - from > MAX_LAG && !env.FALLBACK_RPC_URL) {
    console.warn(`Cursor too old (${from}), skipping to ${safe - MAX_LAG}`);
    from = safe - MAX_LAG;
    cursor.sent = [];
  }
  const { logs, scannedTo } = await getLogs(env, from, safe);
  if (scannedTo < from) throw new Error(`eth_getLogs failed from block ${from}`);
  // totalRaised n'est enregistre qu'une fois le retard entierement rattrape : sinon
  // l'execution suivante doit reprendre la lecture des events la ou elle s'est arretee.
  const nextRaised = scannedTo === safe ? raised.toString() : cursor.raised;

  const already = new Set(cursor.sent);
  const all = decodePurchases(logs);
  const blockOf = new Map(all.map((p) => [p.key, p.block]));
  const purchases = all.filter((p) => !already.has(p.key));
  const progress = { raised };

  // Rang Top Buyers de chaque acheteur ; en cas d'echec, les alertes partent sans cette ligne.
  let ranks = new Map();
  if (tbStore && purchases.length) {
    try {
      const st = await tbStore.get();
      const r = await liveRanks(env, st, purchases, scannedTo, Date.now());
      ranks = r.ranks;
      if (r.state !== st) await tbStore.put(r.state);
    } catch (err) {
      console.warn(`Top Buyers rank: ${err.message}`);
    }
  }

  let sends = 0;
  for (const p of purchases) {
    // Arret (erreur ou limite) : on reprend au bloc de cet achat, sans republier ceux deja envoyes.
    const stopAt = async () => {
      const sent = [...already].filter((k) => blockOf.get(k) === p.block);
      await store.put(JSON.stringify({ block: (p.block - 1n).toString(), sent, raised: cursor.raised }));
    };
    if (sends >= MAX_SENDS_PER_RUN) { await stopAt(); return; }
    try {
      await sendTelegram(env, formatMessage(p, progress, ranks.get(p.key)));
    } catch (err) {
      console.error(err);
      await stopAt();
      return;
    }
    already.add(p.key);
    sends++;
  }
  await store.put(JSON.stringify({ block: scannedTo.toString(), sent: [], raised: nextRaised }));
}

// Curseur en KV : ancien stockage, garde a jour en copie pour le mode secours.
const kvStore = (env) => ({
  get: () => env.STATE.get(CURSOR_KEY),
  put: (value) => env.STATE.put(CURSOR_KEY, value),
});

// Execute `run` dans un seul objet : le curseur y est lu et ecrit sans delai de
// propagation, et un declenchement qui arrive pendant une execution en cours
// est ignore plutot que de traiter les memes achats en parallele.
export class AlertsRunner extends DurableObject {
  running = false;

  async tick() {
    if (this.running) return 'busy';
    this.running = true;
    try {
      const kv = kvStore(this.env);
      const store = {
        // Reprise du curseur KV de l'ancienne version au premier passage.
        get: async () => (await this.ctx.storage.get(CURSOR_KEY)) ?? (await kv.get()) ?? null,
        put: async (value) => {
          await this.ctx.storage.put(CURSOR_KEY, value);
          // Copie pour le mode secours ; un echec (quota KV) ne bloque pas les alertes.
          await kv.put(value).catch((err) => console.warn(`KV copy: ${err.message}`));
        },
      };
      const tbStore = {
        get: async () => (await this.ctx.storage.get('topBuyers')) ?? null,
        put: (value) => this.ctx.storage.put('topBuyers', value),
      };
      await run(this.env, store, tbStore);
      return 'ok';
    } catch (err) {
      // Erreur de traitement (RPC, Telegram...) : renvoyee comme resultat, pour que
      // l'appelant ne la confonde pas avec un objet injoignable.
      console.error(err);
      return `error: ${err.message}`;
    } finally {
      this.running = false;
    }
  }

  // Classement Top Buyers (cron quotidien) : publie seulement aux dates de TOP_BUYERS, une fois par jour.
  async topBuyers() {
    try {
      const state = (await this.ctx.storage.get('topBuyers')) ?? null;
      const { state: next, text, postKey } = await runTopBuyers(this.env, state, Date.now());
      if (!text) { if (next !== state) await this.ctx.storage.put('topBuyers', next); return 'nothing due'; }
      await this.ctx.storage.put('topBuyers', next);
      await sendTelegramText(this.env, text);
      await this.ctx.storage.put('topBuyers', { ...next, lastPost: postKey });
      return 'posted';
    } catch (err) {
      console.error(err);
      return `error: ${err.message}`;
    }
  }
}

export default {
  async scheduled(event, env, ctx) {
    if (event.cron === TOP_BUYERS_CRON) {
      ctx.waitUntil((async () => {
        const result = await env.ALERTS.get(env.ALERTS.idFromName('main')).topBuyers();
        console.log(`Top Buyers: ${result}`);
        if (result.startsWith('error')) throw new Error(result);
      })());
      return;
    }
    ctx.waitUntil((async () => {
      let result;
      try {
        const stub = env.ALERTS.get(env.ALERTS.idFromName('main'));
        result = await Promise.race([
          stub.tick(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('no answer after 25 s')), 25_000)),
        ]);
      } catch (err) {
        // Objet injoignable ou muet : les alertes continuent avec le curseur KV
        // (risque de doublon, mais aucun achat oublie).
        console.error(`Durable Object unavailable, KV cursor fallback: ${err.message}`);
        await run(env, kvStore(env));
        return;
      }
      // Erreur de traitement (RPC, Telegram...) : relancee pour apparaitre dans les
      // metriques Cloudflare (auparavant comptee comme un succes).
      if (typeof result === 'string' && result.startsWith('error')) throw new Error(result);
    })());
  },
};

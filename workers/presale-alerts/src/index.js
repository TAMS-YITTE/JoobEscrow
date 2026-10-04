// Alertes Telegram des achats de la presale JOOB (VestingPresale, BNB Smart Chain).
// Cron chaque minute : lit les events TokensBought depuis le dernier bloc traite
// (curseur en KV) et publie un message par achat. Lecture seule : aucune transaction.
//
// Secrets (wrangler secret put) : TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
// Variables (wrangler.toml)     : PRESALE_ADDRESS, RPC_URLS, DRY_RUN, IMAGE_URL (optionnelle).

// keccak256 des signatures (verifiees contre contracts-token/src/VestingPresale.sol).
const TOPIC_BOUGHT = '0xbd37c6c26f83ab804758436c263701c75879733903991b821180916fd6726eb6'; // TokensBought(address,uint256,uint256,bool,address,uint256)
const TOPIC_BONUS = '0x43f13eddb62d931341dc084f228017290dbd879d3b2a3e727f35921afed3a8fa'; // VolumeBonusCredited(address,uint256,uint256)
const SEL_TOTAL_RAISED = '0xc5c4744c'; // totalRaised()
const SEL_TOKENS_OWED = '0x6d350d9d'; // totalTokensOwed()
const SEL_CAP = '0x2c6382b2'; // presaleTokensCap()

const CONFIRMATIONS = 3n;
const MAX_RANGE = 2000n; // blocs par requete eth_getLogs
const MAX_LAG = 4000n; // ~30 min de blocs BSC (~0,45 s par bloc) : au-dela, publicnode exige une cle d'archive
const MAX_SENDS_PER_RUN = 15; // limite Telegram ~20 messages/min par groupe
// KV gratuit : 1 000 ecritures/jour par compte. Le curseur n'est enregistre qu'apres un
// envoi ou tous les SAVE_EVERY blocs (~7 min) ; au pire on relit ces blocs, sans doublon.
const SAVE_EVERY = 1000n;
const CURSOR_KEY = 'cursor';
const DECIMALS = 18; // USDT, USDC (BSC) et JOOB : 18 decimales
const BSCSCAN = 'https://bscscan.com';
const PRESALE_URL = 'https://www.joobescrow.com/presale';

async function rpc(env, method, params) {
  let lastErr;
  for (const url of env.RPC_URLS.split(',').map((u) => u.trim()).filter(Boolean)) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });
      const json = await res.json();
      if (json.error) throw new Error(`${method}: ${json.error.message}`);
      return json.result;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

const word = (data, i) => BigInt(`0x${data.slice(2 + i * 64, 2 + (i + 1) * 64)}`);
const topicAddr = (t) => `0x${t.slice(26)}`;
const toNum = (v) => Number(v) / 10 ** DECIMALS;
const fmt = (n, max = 2) => n.toLocaleString('en-US', { maximumFractionDigits: max });
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const ZERO = '0x0000000000000000000000000000000000000000';
const FIRE_USD = 25; // un 🔥 par tranche de 25 $ (au moins 1, au plus 40)
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

async function readProgress(env) {
  const call = (sel) => rpc(env, 'eth_call', [{ to: env.PRESALE_ADDRESS, data: sel }, 'latest']).then(BigInt);
  const [raised, owed, cap] = await Promise.all([call(SEL_TOTAL_RAISED), call(SEL_TOKENS_OWED), call(SEL_CAP)]);
  return { raised, pct: cap > 0n ? Number((owed * 10_000n) / cap) / 100 : 0 };
}

function formatMessage(p, progress) {
  const token = p.useUSDT ? 'USDT' : 'USDC';
  const paid = toNum(p.paid);
  const fires = Math.min(40, Math.max(1, Math.floor(paid / FIRE_USD)));
  const lines = [
    '🟢 <b>New JOOB presale purchase</b>',
    '🔥'.repeat(fires),
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
  if (progress) lines.push(`📊 Raised so far: $${fmt(toNum(progress.raised), 0)} · ${progress.pct.toFixed(2)}% of the cap allocated`);
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

async function run(env) {
  const latest = BigInt(await rpc(env, 'eth_blockNumber', []));
  const safe = latest - CONFIRMATIONS;
  // cursor = { block: dernier bloc entierement traite, sent: achats deja publies dans les blocs suivants }
  const cursor = JSON.parse((await env.STATE.get(CURSOR_KEY)) ?? 'null');
  if (!cursor) {
    // Premier lancement : on part du bloc courant (pas de rattrapage d'historique).
    await env.STATE.put(CURSOR_KEY, JSON.stringify({ block: safe.toString(), sent: [] }));
    console.log(`Cursor initialised at block ${safe}`);
    return;
  }
  let from = BigInt(cursor.block) + 1n;
  if (from > safe) return;
  // Les RPC publics ne servent que les blocs recents : apres une longue panne on saute
  // en avant plutot que de rester bloque (les achats manques restent visibles sur BscScan).
  if (safe - from > MAX_LAG) {
    console.warn(`Cursor too old (${from}), skipping to ${safe - MAX_LAG}`);
    from = safe - MAX_LAG;
    cursor.sent = [];
  }
  const to = safe < from + MAX_RANGE - 1n ? safe : from + MAX_RANGE - 1n;

  const logs = await rpc(env, 'eth_getLogs', [{
    address: env.PRESALE_ADDRESS,
    fromBlock: `0x${from.toString(16)}`,
    toBlock: `0x${to.toString(16)}`,
    topics: [[TOPIC_BOUGHT, TOPIC_BONUS]],
  }]);
  const already = new Set(cursor.sent);
  const all = decodePurchases(logs);
  const blockOf = new Map(all.map((p) => [p.key, p.block]));
  const purchases = all.filter((p) => !already.has(p.key));
  const progress = purchases.length ? await readProgress(env).catch(() => null) : null;

  let sends = 0;
  for (const p of purchases) {
    // Arret (erreur ou limite) : on reprend au bloc de cet achat, sans republier ceux deja envoyes.
    const stopAt = async () => {
      const sent = [...already].filter((k) => blockOf.get(k) === p.block);
      await env.STATE.put(CURSOR_KEY, JSON.stringify({ block: (p.block - 1n).toString(), sent }));
    };
    if (sends >= MAX_SENDS_PER_RUN) { await stopAt(); return; }
    try {
      await sendTelegram(env, formatMessage(p, progress));
    } catch (err) {
      console.error(err);
      await stopAt();
      return;
    }
    already.add(p.key);
    sends++;
  }
  if (sends > 0 || to - BigInt(cursor.block) >= SAVE_EVERY) {
    await env.STATE.put(CURSOR_KEY, JSON.stringify({ block: to.toString(), sent: [] }));
  }
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(run(env));
  },
};

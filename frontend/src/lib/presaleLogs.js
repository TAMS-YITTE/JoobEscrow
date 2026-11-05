import { ethers } from 'ethers';
import { PRESALE_ADDRESSES } from '../config/presale';
import { SAFE_SIGNERS } from '../config/team';
import { SALES_BONUS } from '../config/promo';

// Lecture des achats de la presale (evenements TokensBought), partagee par les routes /api (serveur)
// et par le repli dans le navigateur quand le serveur ne peut pas joindre de RPC.
const TOPIC_BOUGHT = '0xbd37c6c26f83ab804758436c263701c75879733903991b821180916fd6726eb6';
const EVENT = new ethers.Interface([
  'event TokensBought(address indexed buyer, uint256 paid, uint256 tokens, bool useUSDT, address indexed referrer, uint256 referralBonus)',
]);
const PRESALE_READ = ['function totalRaised() view returns (uint256)'];
const WINDOW = 49_000; // publicnode et NodeReal : 50 000 blocs maximum par eth_getLogs
// Achats de l'equipe (Safe et signataires) exclus des listes publiques.
const TEAM = new Set([PRESALE_ADDRESSES.SAFE, ...SAFE_SIGNERS.map((x) => x.address)].map((a) => a.toLowerCase()));
const buyerOf = (l) => `0x${l.topics[1].slice(26)}`.toLowerCase();

/** Premier RPC qui repond parmi `urls`. headers : en-tetes facultatifs (serveur). */
export async function firstProvider(urls, headers = {}) {
  for (const url of urls.filter(Boolean)) {
    try {
      const req = new ethers.FetchRequest(url);
      for (const [k, v] of Object.entries(headers)) req.setHeader(k, v);
      const p = new ethers.JsonRpcProvider(req, 56, { staticNetwork: true, batchMaxCount: 1 });
      await p.getBlockNumber();
      return p;
    } catch { /* RPC suivant */ }
  }
  throw new Error('No RPC available');
}

/** Derniers achats hors equipe, du plus recent au plus ancien. */
export async function recentBuys(p, wanted = 6, maxWindows = 40) {
  const head = await p.getBlockNumber();
  const logs = [];
  for (let i = 0, to = head; i < maxWindows && logs.length < wanted; i += 1, to -= WINDOW) {
    const found = await p.getLogs({ address: PRESALE_ADDRESSES.PRESALE, topics: [TOPIC_BOUGHT], fromBlock: to - WINDOW + 1, toBlock: to });
    logs.unshift(...found.filter((l) => !TEAM.has(buyerOf(l))));
  }
  const times = new Map();
  const out = [];
  for (const l of logs.slice(-wanted).reverse()) {
    if (!times.has(l.blockNumber)) times.set(l.blockNumber, (await p.getBlock(l.blockNumber)).timestamp);
    const ev = EVENT.parseLog({ topics: l.topics, data: l.data });
    const b = ev.args.buyer;
    out.push({
      buyer: `${b.slice(0, 6)}…${b.slice(-4)}`,
      usd: Number(ethers.formatUnits(ev.args.paid, 18)),
      joob: Number(ethers.formatUnits(ev.args.tokens, 18)),
      tx: l.transactionHash,
      time: times.get(l.blockNumber),
    });
  }
  return out;
}

/** Beneficiaires du bonus Fair Share (config/promo.js), calcules depuis la blockchain. */
export async function fairShare(p, nowSec = Math.floor(Date.now() / 1000)) {
  const startSec = Date.parse(SALES_BONUS.start) / 1000;
  const base = { campaign: SALES_BONUS.name, joobPerUsd: SALES_BONUS.joobPerUsd, capRaisedUsd: SALES_BONUS.capRaisedUsd, start: SALES_BONUS.start };
  if (nowSec < startSec) return { ...base, entries: [], started: false };
  const head = await p.getBlockNumber();
  // Premier bloc a partir de `start` : dichotomie sur l'horodatage (le temps de bloc BSC varie).
  let lo = 0;
  let hi = head;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if ((await p.getBlock(mid)).timestamp < startSec) lo = mid + 1; else hi = mid;
  }
  const logs = [];
  for (let a = lo; a <= head; a += WINDOW) {
    logs.push(...await p.getLogs({ address: PRESALE_ADDRESSES.PRESALE, topics: [TOPIC_BOUGHT], fromBlock: a, toBlock: Math.min(head, a + WINDOW - 1) }));
  }
  const buys = logs.map((l) => ({ buyer: buyerOf(l), usd: Number(ethers.formatUnits(EVENT.parseLog({ topics: l.topics, data: l.data }).args.paid, 18)) }));
  // Montant leve avant le premier achat de la periode = total actuel - achats de la periode.
  const presale = new ethers.Contract(PRESALE_ADDRESSES.PRESALE, PRESALE_READ, p);
  let raised = Number(ethers.formatUnits(await presale.totalRaised(), 18)) - buys.reduce((s, b) => s + b.usd, 0);
  const byWallet = new Map();
  for (const b of buys) {
    const eligible = raised < SALES_BONUS.capRaisedUsd && !TEAM.has(b.buyer);
    raised += b.usd;
    if (!eligible) continue;
    const w = byWallet.get(b.buyer) || { address: b.buyer, usd: 0 };
    w.usd += b.usd;
    byWallet.set(b.buyer, w);
  }
  const entries = [...byWallet.values()]
    .map((w) => ({ address: w.address, joob: Math.floor(w.usd * SALES_BONUS.joobPerUsd), label: `$${w.usd.toLocaleString('en-US', { maximumFractionDigits: 2 })} bought` }))
    .sort((a, b) => b.joob - a.joob);
  return { ...base, entries, started: true, capReached: raised >= SALES_BONUS.capRaisedUsd, updatedAt: nowSec };
}

// RPC : cote serveur, la cle NodeReal privee (BSC_LOGS_RPC_URL, variable Vercel non publique) passe en premier.
export const SERVER_RPCS = () => [process.env.BSC_LOGS_RPC_URL, 'https://bsc-rpc.publicnode.com', 'https://bsc-dataseed.bnbchain.org'];
export const BROWSER_RPCS = ['https://bsc-rpc.publicnode.com'];

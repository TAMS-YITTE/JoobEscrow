import { ethers } from 'ethers';
import { PRESALE_ADDRESSES } from '../../../config/presale';
import { SAFE_SIGNERS } from '../../../config/team';
import { SALES_BONUS } from '../../../config/promo';

// Beneficiaires du bonus Fair Share (config/promo.js), calcules on-chain cote serveur, cache 10 minutes.
// Un achat compte s'il a lieu apres `start` et si le montant leve avant lui est sous `capRaisedUsd`.
export const revalidate = 600;
export const maxDuration = 60;

const RPC_URLS = ['https://bsc-rpc.publicnode.com', 'https://bsc-dataseed.bnbchain.org'];
const TOPIC_BOUGHT = '0xbd37c6c26f83ab804758436c263701c75879733903991b821180916fd6726eb6';
const EVENT = new ethers.Interface([
  'event TokensBought(address indexed buyer, uint256 paid, uint256 tokens, bool useUSDT, address indexed referrer, uint256 referralBonus)',
]);
const PRESALE_READ = ['function totalRaised() view returns (uint256)'];
const WINDOW = 49_000; // publicnode : 50 000 blocs maximum par eth_getLogs
const TEAM = new Set([PRESALE_ADDRESSES.SAFE, ...SAFE_SIGNERS.map((x) => x.address)].map((a) => a.toLowerCase()));

async function provider() {
  for (const url of RPC_URLS) {
    try {
      // En-tete explicite : certains RPC publics refusent (403) les requetes serveur sans User-Agent.
      const req = new ethers.FetchRequest(url);
      req.setHeader('User-Agent', 'JoobEscrow-site/1.0');
      const p = new ethers.JsonRpcProvider(req, 56, { staticNetwork: true, batchMaxCount: 1 });
      await p.getBlockNumber();
      return p;
    } catch { /* RPC suivant */ }
  }
  throw new Error('No RPC available');
}

export async function GET() {
  const startSec = Date.parse(SALES_BONUS.start) / 1000;
  const base = { campaign: SALES_BONUS.name, joobPerUsd: SALES_BONUS.joobPerUsd, capRaisedUsd: SALES_BONUS.capRaisedUsd, start: SALES_BONUS.start };
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec < startSec) return Response.json({ ...base, entries: [], started: false });
  try {
    const p = await provider();
    const head = await p.getBlockNumber();
    // Premier bloc a partir de `start` : recherche par dichotomie sur l'horodatage (le temps de bloc BSC varie).
    let lo = 0;
    let hi = head;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if ((await p.getBlock(mid)).timestamp < startSec) lo = mid + 1; else hi = mid;
    }
    const from = lo;
    const logs = [];
    for (let a = from; a <= head; a += WINDOW) {
      logs.push(...await p.getLogs({ address: PRESALE_ADDRESSES.PRESALE, topics: [TOPIC_BOUGHT], fromBlock: a, toBlock: Math.min(head, a + WINDOW - 1) }));
    }
    const times = new Map();
    const buys = [];
    for (const l of logs) {
      if (!times.has(l.blockNumber)) times.set(l.blockNumber, (await p.getBlock(l.blockNumber)).timestamp);
      const t = times.get(l.blockNumber);
      if (t < startSec) continue;
      const ev = EVENT.parseLog({ topics: l.topics, data: l.data });
      buys.push({ buyer: ev.args.buyer.toLowerCase(), usd: Number(ethers.formatUnits(ev.args.paid, 18)) });
    }
    // Montant leve avant le premier achat de la periode = total actuel - achats de la periode.
    const presale = new ethers.Contract(PRESALE_ADDRESSES.PRESALE, PRESALE_READ, p);
    const totalNow = Number(ethers.formatUnits(await presale.totalRaised(), 18));
    let raised = totalNow - buys.reduce((s, b) => s + b.usd, 0);
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
    return Response.json({ ...base, entries, started: true, capReached: raised >= SALES_BONUS.capRaisedUsd, updatedAt: nowSec });
  } catch (err) {
    console.error('[sales-bonus]', err?.shortMessage || err?.message || err);
    return Response.json({ ...base, entries: [], error: 'unavailable' });
  }
}

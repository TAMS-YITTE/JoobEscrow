import { ethers } from 'ethers';
import { PRESALE_ADDRESSES } from '../../../config/presale';
import { SAFE_SIGNERS } from '../../../config/team';

// Achats de l'equipe (Safe et signataires) exclus : ce fil sert de preuve sociale, pas de vitrine interne.
const TEAM = new Set([PRESALE_ADDRESSES.SAFE, ...SAFE_SIGNERS.map((x) => x.address)].map((a) => a.toLowerCase()));

// Derniers achats de la presale (evenements TokensBought), lus cote serveur et mis en cache 5 minutes :
// les visiteurs ne sollicitent pas les RPC publics, un seul calcul par periode.
export const revalidate = 300;
export const maxDuration = 60;

const RPC_URLS = ['https://bsc-rpc.publicnode.com', 'https://bsc-dataseed.bnbchain.org'];
const TOPIC_BOUGHT = '0xbd37c6c26f83ab804758436c263701c75879733903991b821180916fd6726eb6';
const EVENT = new ethers.Interface([
  'event TokensBought(address indexed buyer, uint256 paid, uint256 tokens, bool useUSDT, address indexed referrer, uint256 referralBonus)',
]);
const WINDOW = 49_000; // publicnode : 50 000 blocs maximum par eth_getLogs
const MAX_WINDOWS = 40; // ~ 20 jours de blocs BSC (0,75 s)
const WANTED = 6;

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
  try {
    const p = await provider();
    const head = await p.getBlockNumber();
    const logs = [];
    for (let i = 0, to = head; i < MAX_WINDOWS && logs.length < WANTED; i += 1, to -= WINDOW) {
      const found = await p.getLogs({ address: PRESALE_ADDRESSES.PRESALE, topics: [TOPIC_BOUGHT], fromBlock: to - WINDOW + 1, toBlock: to });
      logs.unshift(...found.filter((l) => !TEAM.has(`0x${l.topics[1].slice(26)}`.toLowerCase())));
    }
    const recent = logs.slice(-WANTED).reverse();
    const times = new Map();
    const buys = [];
    for (const l of recent) {
      if (!times.has(l.blockNumber)) times.set(l.blockNumber, (await p.getBlock(l.blockNumber)).timestamp);
      const ev = EVENT.parseLog({ topics: l.topics, data: l.data });
      const buyer = ev.args.buyer;
      buys.push({
        buyer: `${buyer.slice(0, 6)}…${buyer.slice(-4)}`,
        usd: Number(ethers.formatUnits(ev.args.paid, 18)),
        joob: Number(ethers.formatUnits(ev.args.tokens, 18)),
        token: ev.args.useUSDT ? 'USDT' : 'USDC',
        tx: l.transactionHash,
        time: times.get(l.blockNumber),
      });
    }
    return Response.json({ buys, updatedAt: Math.floor(Date.now() / 1000) });
  } catch (err) {
    console.error('[recent-buys]', err?.shortMessage || err?.message || err);
    return Response.json({ buys: [], error: 'unavailable' }, { status: 200 });
  }
}

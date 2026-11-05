'use client';

import { useEffect, useState } from 'react';
import styles from './presale.module.css';
import { firstProvider, recentBuys, BROWSER_RPCS } from '../../../lib/presaleLogs';
import { PRESALE_ADDRESSES } from '../../../config/presale';
import { SAFE_SIGNERS } from '../../../config/team';

// Fil des achats tenu par le worker des alertes Telegram (un enregistrement par alerte envoyee).
const FEED_URL = 'https://stats.joobescrow.com/recent-buys';
const WANTED = 10;
const TEAM = new Set([PRESALE_ADDRESSES.SAFE, ...SAFE_SIGNERS.map((x) => x.address)].map((a) => a.toLowerCase()));

const ago = (sec) => {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - sec);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
const usd = (n) => n.toLocaleString('en-US', { maximumFractionDigits: n < 100 ? 2 : 0 });
const joob = (n) => Math.round(n).toLocaleString('en-US');
const short = (a) => (a.includes('…') ? a : `${a.slice(0, 6)}…${a.slice(-4)}`);

/** Achats du worker, completes par la lecture du site (serveur puis navigateur) tant que le fil est court. */
async function loadBuys() {
  let list = [];
  try {
    const d = await (await fetch(FEED_URL)).json();
    list = (d.buys || []).filter((b) => !TEAM.has(b.buyer.toLowerCase()));
  } catch { /* worker injoignable : lecture du site seule */ }
  if (list.length < WANTED) {
    let more = [];
    try {
      const d = await (await fetch('/api/recent-buys')).json();
      more = d.error ? await recentBuys(await firstProvider(BROWSER_RPCS), 6, 12) : d.buys || [];
    } catch { /* rien de plus */ }
    const seen = new Set(list.map((b) => b.tx));
    list = [...list, ...more.filter((b) => !seen.has(b.tx))];
  }
  return list.sort((a, b) => b.time - a.time).slice(0, WANTED);
}

// Bandeau defilant des derniers achats on-chain, masque s'il n'y a rien a montrer.
export default function RecentBuys() {
  const [buys, setBuys] = useState(null);
  useEffect(() => {
    let alive = true;
    loadBuys().then((l) => { if (alive) setBuys(l); }).catch(() => { if (alive) setBuys([]); });
    return () => { alive = false; };
  }, []);

  if (!buys || !buys.length) return null;
  const items = buys.map((b) => (
    <a key={b.tx} href={`https://bscscan.com/tx/${b.tx}`} target="_blank" rel="noopener noreferrer" className={styles.tickerItem}>
      <span className={styles.tickerDot} />
      <span className={styles.recentAddr}>{short(b.buyer)}</span>
      <span>bought</span>
      <span className={styles.recentAmt}>${usd(b.usd)} · {joob(b.joob)} JOOB</span>
      <span className={styles.recentAgo}>{ago(b.time)}</span>
    </a>
  ));
  return (
    <div className={styles.ticker} aria-label="Recent purchases">
      <span className={styles.tickerLabel}>LIVE BUYS</span>
      <div className={styles.tickerViewport}>
        {/* Liste doublee pour une boucle continue. */}
        <div className={styles.tickerTrack} style={{ animationDuration: `${Math.max(20, buys.length * 6)}s` }}>
          {items}
          <span aria-hidden="true" style={{ display: 'contents' }}>{items}</span>
        </div>
      </div>
    </div>
  );
}

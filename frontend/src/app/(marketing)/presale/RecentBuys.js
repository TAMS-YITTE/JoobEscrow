'use client';

import { useEffect, useState } from 'react';
import styles from './presale.module.css';
import { firstProvider, recentBuys, BROWSER_RPCS } from '../../../lib/presaleLogs';

const ago = (sec) => {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - sec);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
const usd = (n) => n.toLocaleString('en-US', { maximumFractionDigits: n < 100 ? 2 : 0 });
const joob = (n) => Math.round(n).toLocaleString('en-US');

// Derniers achats on-chain (route /api/recent-buys, cache serveur de 5 minutes). Masque si rien a montrer.
export default function RecentBuys() {
  const [buys, setBuys] = useState(null);
  useEffect(() => {
    let alive = true;
    // Repli dans le navigateur si le serveur n'a pas pu lire la blockchain.
    const fromBrowser = async () => recentBuys(await firstProvider(BROWSER_RPCS), 6, 12);
    fetch('/api/recent-buys')
      .then((r) => r.json())
      .then((d) => (d.error ? fromBrowser() : d.buys || []))
      .catch(() => fromBrowser())
      .then((list) => { if (alive) setBuys(list || []); })
      .catch(() => { if (alive) setBuys([]); });
    return () => { alive = false; };
  }, []);

  if (!buys || !buys.length) return null;
  return (
    <div className={styles.recentCard}>
      <div className={styles.sideCardTitle}>Recent purchases</div>
      <ul className={styles.recentList}>
        {buys.map((b) => (
          <li key={b.tx}>
            <a href={`https://bscscan.com/tx/${b.tx}`} target="_blank" rel="noopener noreferrer" className={styles.recentRow}>
              <span className={styles.recentAddr}>{b.buyer}</span>
              <span className={styles.recentAmt}>${usd(b.usd)} · {joob(b.joob)} JOOB</span>
              <span className={styles.recentAgo}>{ago(b.time)} ↗</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

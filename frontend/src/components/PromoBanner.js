'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { activePromo } from '../config/promo';
import styles from './PromoBanner.module.css';

const pad = (n) => String(n).padStart(2, '0');

// Bandeau du bonus temporaire (config/promo.js), masque hors periode. Rendu apres le montage
// seulement : l'heure du serveur et celle du navigateur ne doivent pas diverger a l'hydratation.
export default function PromoBanner({ cta = false }) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);

  const promo = now === null ? null : activePromo(now);
  if (!promo) return null;
  const s = Math.max(0, Number(promo.endSec) - now);

  return (
    <div className={styles.banner}>
      <div className={styles.main}>
        <span className={styles.tag}>{promo.name}</span>
        <span className={styles.title}>
          +{promo.bonusBps / 100}% extra JOOB on every purchase of {promo.minUsd} USDT or more
        </span>
        <span className={styles.fine}>
          Early buyers get +{promo.earlyBonusBps / 100}% automatically. Bonus from the marketing allocation, no mint, delivered at TGE with the presale vesting.
        </span>
      </div>
      <div className={styles.side}>
        <span className={styles.timerLabel}>Ends in</span>
        <span className={styles.timer}>
          {pad(Math.floor(s / 86400))}d {pad(Math.floor((s % 86400) / 3600))}h {pad(Math.floor((s % 3600) / 60))}m {pad(s % 60)}s
        </span>
        {cta && <Link href="/presale" className={`btn btn-primary ${styles.cta}`}>Get the bonus</Link>}
      </div>
    </div>
  );
}

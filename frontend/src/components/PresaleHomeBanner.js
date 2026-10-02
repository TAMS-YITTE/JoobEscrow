'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import styles from '../app/(marketing)/marketing.module.css';

// Ouverture de la vente : startTime() du contrat presale (15/10/2026 14:00 UTC).
const PRESALE_START = 1792072800;

// Horloge a la seconde, sans Date.now() pendant le rendu serveur.
const subscribe = (cb) => { const id = setInterval(cb, 1000); return () => clearInterval(id); };
const nowSec = () => Math.floor(Date.now() / 1000);

function countdown(left) {
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export default function PresaleHomeBanner() {
  const now = useSyncExternalStore(subscribe, nowSec, () => null);
  const open = now !== null && now >= PRESALE_START;

  return (
    <Link href="/presale#tokenomics" className={styles.presaleBanner}>
      <div className={styles.presaleBannerHead}>
        <span className={styles.presaleBannerTag}>JOOB presale</span>
        <span className={styles.presaleBannerTime}>
          {open ? 'Presale is open' : now === null ? 'Opens Oct 15, 14:00 UTC' : `Opens in ${countdown(PRESALE_START - now)}`}
        </span>
      </div>
      <div className={styles.presaleBannerMeta}>
        Sealed vault · Audited by SpyWolf · Vesting on-chain
        <span className={styles.presaleBannerCta}>Presale &amp; tokenomics →</span>
      </div>
    </Link>
  );
}

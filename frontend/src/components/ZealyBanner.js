'use client';

import { useState, useSyncExternalStore } from 'react';
import styles from '../app/(marketing)/marketing.module.css';

import { ZEALY_URL } from '../config/links';
const STORAGE_KEY = 'joob_zealy_banner_closed';

const noopSubscribe = () => () => {};
const readClosed = () => {
  try { return window.localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
};

export default function ZealyBanner() {
  // Rendu serveur : bandeau visible ; le client le masque s'il a deja ete ferme.
  const storedClosed = useSyncExternalStore(noopSubscribe, readClosed, () => false);
  const [closed, setClosed] = useState(false);
  if (storedClosed || closed) return null;

  const close = () => {
    setClosed(true);
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* stockage indisponible */ }
  };

  return (
    <div className={styles.zealyBar} role="region" aria-label="Zealy campaign">
      <a href={ZEALY_URL} target="_blank" rel="noopener noreferrer" className={styles.zealyLink}>
        <span className={styles.zealyTag}>Zealy</span>
        <span className={styles.zealyLong}>Genesis Sprint is live: complete quests, earn XP and OG roles before Oct 15</span>
        <span className={styles.zealyShort}>Genesis Sprint live on Zealy · earn XP before Oct 15</span>
        <span className={styles.zealyCta}>Join →</span>
      </a>
      <button type="button" className={styles.zealyClose} onClick={close} aria-label="Close">×</button>
    </div>
  );
}

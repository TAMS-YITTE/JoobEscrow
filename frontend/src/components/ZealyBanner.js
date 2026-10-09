'use client';

import { useState, useSyncExternalStore } from 'react';
import styles from '../app/(marketing)/marketing.module.css';

import { ZEALY_CAMPAIGN } from '../config/links';
const STORAGE_KEY = 'joob_zealy_banner_closed';

const END_MS = ZEALY_CAMPAIGN.endsAt ? Date.parse(ZEALY_CAMPAIGN.endsAt) : Infinity;
const isOver = () => Date.now() >= END_MS;

const noopSubscribe = () => () => {};
const readClosed = () => {
  if (isOver()) return true;
  try { return window.localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
};

export default function ZealyBanner() {
  // Rendu serveur : bandeau visible ; le client le masque s'il a deja ete ferme ou si la campagne est terminee.
  const storedClosed = useSyncExternalStore(noopSubscribe, readClosed, () => false);
  const [closed, setClosed] = useState(false);
  if (storedClosed || closed) return null;

  const close = () => {
    setClosed(true);
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* stockage indisponible */ }
  };

  return (
    <div className={styles.zealyBar} role="region" aria-label="Zealy campaign">
      <a href={ZEALY_CAMPAIGN.url} target="_blank" rel="noopener noreferrer" className={styles.zealyLink}>
        <span className={styles.zealyTag}>Zealy</span>
        <span className={styles.zealyLong}>{ZEALY_CAMPAIGN.long}</span>
        <span className={styles.zealyShort}>{ZEALY_CAMPAIGN.short}</span>
        <span className={styles.zealyCta}>Join →</span>
      </a>
      <button type="button" className={styles.zealyClose} onClick={close} aria-label="Close">×</button>
    </div>
  );
}

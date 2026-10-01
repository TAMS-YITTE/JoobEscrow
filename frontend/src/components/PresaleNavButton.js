'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import styles from '../app/(marketing)/marketing.module.css';

// Ouverture de la vente : startTime() du contrat presale (15/10/2026 14:00 UTC).
const PRESALE_START_MS = 1792072800 * 1000;

const noopSubscribe = () => () => {};
const isOpen = () => Date.now() >= PRESALE_START_MS;

export default function PresaleNavButton() {
  // Rendu serveur : « Oct 15 » ; le client corrige apres l'hydratation si la vente a ouvert.
  const open = useSyncExternalStore(noopSubscribe, isOpen, () => false);
  return (
    <Link href="/presale" className={styles.presaleBtn}>
      <span className={styles.presaleDot} />
      JOOB Presale
      <span className={styles.presaleTag}>{open ? 'Open' : 'Oct 15'}</span>
    </Link>
  );
}

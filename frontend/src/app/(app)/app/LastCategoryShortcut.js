'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { allInstances } from '../../../config/instances';
import styles from './hub.module.css';

// Lecture client uniquement (useSyncExternalStore avec snapshot serveur null) pour eviter toute erreur d'hydratation.
function subscribe(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot() {
  try {
    const slug = localStorage.getItem('joob_last_category');
    if (!slug) return null;
    const inst = allInstances[slug];
    if (!inst || inst.isDemo) return null;
    return slug;
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

export default function LastCategoryShortcut() {
  const slug = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!slug) return null;
  const inst = allInstances[slug];
  if (!inst || inst.isDemo) return null;

  return (
    <div>
      <Link href={`/${inst.slug}`} className={styles.continueLink}>
        <span>
          Continue in <strong>{inst.name}</strong> ({inst.feeTier}%)
        </span>
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

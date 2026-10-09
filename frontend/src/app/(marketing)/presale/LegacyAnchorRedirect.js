'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Anciennes ancres de /presale (liens partages avant le deplacement des sections) -> nouvelles pages.
const MOVED = {
  '#tokenomics': '/tokenomics',
  '#use-of-funds': '/tokenomics#use-of-funds',
  '#ecosystem': '/ecosystem',
  '#roadmap': '/roadmap',
};

export default function LegacyAnchorRedirect() {
  const router = useRouter();
  useEffect(() => {
    const { hash } = window.location;
    const target = MOVED[hash];
    if (target) {
      router.replace(target);
      return undefined;
    }
    // Ancre restee sur la page (#referral, #faq) : le navigateur defile avant que la carte
    // presale ait fini de s'afficher ; on re-defile une fois la mise en page stabilisee.
    if (!hash) return undefined;
    const t = setTimeout(() => {
      try { document.querySelector(hash)?.scrollIntoView(); } catch { /* ancre invalide */ }
    }, 600);
    return () => clearTimeout(t);
  }, [router]);
  return null;
}

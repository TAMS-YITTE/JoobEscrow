'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { kolClickValue, KOL_STORAGE_KEY } from '../lib/kolFlag';
import kolProgram from '../config/kolProgram.json';

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      // Store the referral code in localStorage
      localStorage.setItem('joob_ref', ref);
      // Flag KOL : clic horodate sous une cle distincte, seulement pour un handle valide et actif
      // (un handle inconnu n'ecrase pas un clic valide precedent).
      try {
        const kolClick = kolClickValue(ref, kolProgram);
        if (kolClick) localStorage.setItem(KOL_STORAGE_KEY, kolClick);
      } catch {}
    }
  }, [searchParams]);

  // This component doesn't render anything visually
  return null;
}

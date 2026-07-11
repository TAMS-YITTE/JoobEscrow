'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      // Store the referral code in localStorage
      localStorage.setItem('joob_ref', ref);
    }
  }, [searchParams]);

  // This component doesn't render anything visually
  return null;
}

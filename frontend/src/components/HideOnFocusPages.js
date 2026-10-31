'use client';

import { usePathname } from 'next/navigation';
import { FOCUS_PATHS } from './MarketingHeader';

// Masque le pied de page du site sur les pages d'achat isolees (FOCUS_PATHS).
export default function HideOnFocusPages({ children }) {
  return FOCUS_PATHS.includes(usePathname()) ? null : children;
}

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const DynamicXMTPProvider = dynamic(
  () => import('@xmtp/react-sdk').then(mod => mod.XMTPProvider),
  { ssr: false }
);

export function XMTPProviderWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Polyfill Buffer for XMTP
    if (typeof window !== 'undefined' && !window.Buffer) {
      window.Buffer = require('buffer').Buffer;
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <DynamicXMTPProvider>
      {children}
    </DynamicXMTPProvider>
  );
}

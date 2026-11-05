'use client';

import { useState } from 'react';

// Bouton de copie d'une adresse (presse-papiers), avec confirmation breve.
export default function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* presse-papiers indisponible */ }
  };
  return (
    <button type="button" onClick={copy} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }} aria-label={`Copy ${value}`}>
      {copied ? 'Copied' : label}
    </button>
  );
}

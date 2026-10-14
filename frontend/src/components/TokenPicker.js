'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCatalog } from '../lib/crosschain/sources';
import styles from './TokenPicker.module.css';

/** Logo d'un token, avec la pastille de sa chaine en bas a droite. */
export function TokenLogo({ src, badge, size = 32 }) {
  return (
    <span className={styles.logo} style={{ width: size, height: size }}>
      {src ? <img src={src} alt="" className={styles.logoImg} /> : <span className={styles.logoEmpty} />}
      {badge && <img src={badge} alt="" className={styles.logoBadge} />}
    </span>
  );
}

// Choix du moyen de paiement : reseaux a gauche, tokens a droite (une seule
// colonne sur mobile, reseaux en pastilles). Rendu dans <body> : la carte en
// verre (backdrop-filter) pigerait le position:fixed.
export default function TokenPicker({ onClose, onPick }) {
  const catalog = useCatalog();
  const [query, setQuery] = useState('');
  const [chainId, setChainId] = useState('all');
  const search = useRef(null);
  useEffect(() => { search.current?.focus(); }, [catalog]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const rows = (catalog?.rows ?? []).filter((r) =>
    (chainId === 'all' || r.chainId === chainId) &&
    (!q || [r.symbol, r.chainName].some((v) => v.toLowerCase().includes(q))));

  const chainBtn = (active) => `${styles.chainBtn} ${active ? styles.chainBtnActive : ''}`;

  return createPortal(
    <div className={styles.overlay}>
      {/* Fond cliquable : ferme la fenetre (Echap aussi). */}
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className={styles.backdrop} />
      <div role="dialog" aria-modal="true" aria-label="Select payment method" className={styles.dialog}>
        <div className={styles.head}>
          <h3 className={styles.title}>Select payment method</h3>
          <button type="button" onClick={onClose} aria-label="Close" className={styles.close}>✕</button>
        </div>
        {!catalog && <p className={styles.muted}>Loading…</p>}
        {catalog && (
          <div className={styles.body}>
            <div role="tablist" aria-label="Networks" className={styles.chains}>
              <div className={styles.chainsLabel}>Networks</div>
              <button type="button" role="tab" aria-selected={chainId === 'all'} className={chainBtn(chainId === 'all')} onClick={() => setChainId('all')}>
                <span className={styles.allIcon}>{catalog.chains.slice(0, 4).map((c) => <img key={c.id} src={c.logoURI} alt="" />)}</span>
                All networks
              </button>
              {catalog.chains.map((c) => (
                <button key={c.id} type="button" role="tab" aria-selected={chainId === c.id} className={chainBtn(chainId === c.id)} onClick={() => setChainId(c.id)}>
                  <TokenLogo src={c.logoURI} size={20} /> {c.name}
                </button>
              ))}
            </div>
            <div className={styles.tokens}>
              <input ref={search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a token" className={styles.search} />
              <div className={styles.list}>
                {rows.map((r) => (
                  <button key={`${r.chainId}-${r.address}`} type="button" onClick={() => onPick(r)} className={styles.row}>
                    <TokenLogo src={r.logoURI} badge={r.chainLogoURI} />
                    <span className={styles.rowText}>
                      <strong>{r.symbol}</strong>
                      <span>{r.chainName}</span>
                    </span>
                    {r.direct && <span className={styles.direct}>Direct</span>}
                  </button>
                ))}
                {rows.length === 0 && <p className={styles.muted}>No token found.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

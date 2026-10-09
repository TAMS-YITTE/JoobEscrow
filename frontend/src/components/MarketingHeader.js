'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../app/(marketing)/marketing.module.css';
import PresaleNavButton from './PresaleNavButton';
import { TELEGRAM_URL, X_URL } from '../config/links';

const TG_PATH = 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a50.363 50.363 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z';
const X_PATH = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';

const NAV = [
  { href: '/try', label: 'Try $1' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/security', label: 'Security' },
  { href: '/faq', label: 'FAQ' },
];

export const LEARN = [
  { href: '/tokenomics', label: 'Tokenomics' },
  { href: '/ecosystem', label: 'Ecosystem' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/whitepaper', label: 'Whitepaper' },
];

// Un menu ouvert est lie a la page ou il a ete ouvert : changer de page le ferme sans effet.
function usePageMenu() {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState(null);
  const setOpen = useCallback((v) => setOpenOn(v ? pathname : null), [pathname]);
  return [openOn === pathname, setOpen];
}

// Fermeture au clic exterieur et avec Echap.
function useDismiss(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen, ref]);
}

function LearnMenu() {
  const [open, setOpen] = usePageMenu();
  const ref = useRef(null);
  useDismiss(open, setOpen, ref);
  return (
    <div className={styles.learn} ref={ref}>
      <button
        type="button"
        className={`${styles.navLink} ${styles.learnBtn}`}
        aria-expanded={open}
        aria-controls="learn-menu"
        onClick={() => setOpen(!open)}
      >
        Learn <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div id="learn-menu" className={styles.learnMenu}>
          {LEARN.map((l) => (
            <Link key={l.href} href={l.href} className={styles.learnItem} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketingHeader() {
  const [open, setOpen] = usePageMenu();
  const ref = useRef(null);
  useDismiss(open, setOpen, ref);
  const close = () => setOpen(false);

  return (
    <header className={styles.header} ref={ref}>
      <Link href="/" className={styles.logoContainer}>
        <img src="/logo.svg" alt="JoobEscrow Logo" className={styles.logoImg} />
        <span className={styles.logoText}>JoobEscrow</span>
      </Link>

      <nav className={styles.navCenter} aria-label="Main">
        {NAV.slice(0, 2).map((n) => (
          <Link key={n.href} href={n.href} className={styles.navLink}>{n.label}</Link>
        ))}
        <LearnMenu />
        {NAV.slice(2).map((n) => (
          <Link key={n.href} href={n.href} className={styles.navLink}>{n.label}</Link>
        ))}
      </nav>

      <div className={styles.navRight}>
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={styles.headerSocial} aria-label="Telegram">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d={TG_PATH} /></svg>
        </a>
        <a href={X_URL} target="_blank" rel="noopener noreferrer" className={styles.headerSocial} aria-label="X (Twitter)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d={X_PATH} /></svg>
        </a>
        <PresaleNavButton />
        <Link href="/app" className={`btn btn-primary ${styles.launchBtn}`}>
          Launch App
        </Link>
        <button
          type="button"
          className={styles.burger}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" className={styles.mobileMenu} aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={styles.mobileLink} onClick={close}>{n.label}</Link>
          ))}
          <span className={styles.mobileGroup}>Learn</span>
          {LEARN.map((l) => (
            <Link key={l.href} href={l.href} className={styles.mobileLink} onClick={close}>{l.label}</Link>
          ))}
          <div className={styles.mobileSocials}>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={styles.mobileLink}>Telegram</a>
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className={styles.mobileLink}>X</a>
          </div>
        </nav>
      )}
    </header>
  );
}

import Link from 'next/link';
import styles from './marketing.module.css';
import dict from '../../i18n/en.json';

import { Web3Provider } from '../../context/Web3Context';

export default function MarketingLayout({ children }) {
  return (
    <Web3Provider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header className={styles.header}>
          <Link href="/" className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className={styles.logoText}>JoobEscrow</span>
          </Link>
          
          <nav className={styles.navCenter}>
            <Link href="/#how-it-works" className={styles.navLink}>
              How it works
            </Link>
            <Link href="/security" className={styles.navLink}>
              Security
            </Link>
          </nav>

          <div className={styles.navRight}>
            <Link href="/app" className={styles.btnLaunch}>
              Launch App
            </Link>
          </div>
        </header>

        <main style={{ flex: 1 }}>
          {children}
        </main>

        <footer className={styles.footer} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className={styles.footerNav} style={{ flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem' }}>
              <Link href="/faq" className={styles.navLink}>FAQ</Link>
              <Link href="/how-disputes-work" className={styles.navLink}>How Disputes Work</Link>
              <Link href="/security" className={styles.navLink}>Security & Trust</Link>
              <Link href="/risks" className={styles.navLink}>Risks & Disclaimers</Link>
              <Link href="/bug-bounty" className={styles.navLink}>Bug Bounty</Link>
              <Link href="/blog" className={styles.navLink}>Blog</Link>
              <Link href="/Universal_Service_Escrow_V4_Audit.pdf" target="_blank" className={styles.navLink}>Audit Report</Link>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>© {new Date().getFullYear()} JoobEscrow. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Web3Provider>
  );
}

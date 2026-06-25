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
            <img src="/logo.jpg" alt="JoobEscrow Logo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)' }} />
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
            <Link href="/app" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Launch App
            </Link>
          </div>
        </header>

        <main style={{ flex: 1 }}>
          {children}
        </main>

        <footer className={styles.footer} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div className={styles.footerNav} style={{ flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', marginTop: 0 }}>
              <Link href="/faq" className={styles.navLink}>FAQ</Link>
              <Link href="/how-disputes-work" className={styles.navLink}>How Disputes Work</Link>
              <Link href="/security" className={styles.navLink}>Security & Trust</Link>
              <Link href="/risks" className={styles.navLink}>Risks & Disclaimers</Link>
              <Link href="/bug-bounty" className={styles.navLink}>Bug Bounty</Link>
              <Link href="https://spywolf.co/audits/Universal_Service_Escrow_V4_Audit.pdf" target="_blank" className={styles.navLink}>Audit Report</Link>
            </div>
            
            <div className={styles.socialIcons} style={{ marginBottom: 0 }}>
              <a href="https://t.me/JoobEscrow_Official" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Telegram">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a50.363 50.363 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              <a href="https://x.com/JoobEscrow" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="X (Twitter)">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="mailto:contact@joobescrow.com" className={styles.socialLink} aria-label="Email Contact">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>© {new Date().getFullYear()} JoobEscrow. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Web3Provider>
  );
}

import Link from 'next/link';
import styles from './marketing.module.css';
import './marketing-utilities.css';
import dict from '../../i18n/en.json';

import { Web3Provider } from '../../context/Web3Context';
import PresaleNavButton from '../../components/PresaleNavButton';
import ZealyBanner from '../../components/ZealyBanner';
import { AUDITS } from '../../config/presale';
import { TELEGRAM_URL, X_URL, ZEALY_URL } from '../../config/links';

const TG_PATH = 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a50.363 50.363 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z';
const X_PATH = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';

const NAV = [
  { href: '/try', label: 'Try $1' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/security', label: 'Security' },
  { href: '/faq', label: 'FAQ' },
];

export default function MarketingLayout({ children }) {
  return (
    <Web3Provider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ZealyBanner />
        <header className={styles.header}>
          <Link href="/" className={styles.logoContainer}>
            <img src="/logo.svg" alt="JoobEscrow Logo" className={styles.logoImg} />
            <span className={styles.logoText}>JoobEscrow</span>
          </Link>

          <nav className={styles.navCenter} aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={styles.navLink}>{n.label}</Link>
            ))}
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${styles.navLink} ${styles.navSocialMobile}`}>Telegram</a>
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className={`${styles.navLink} ${styles.navSocialMobile}`}>X</a>
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
          </div>
        </header>

        <main className="mkt-main" style={{ flex: 1 }}>
          {children}
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <Link href="/" className={styles.footerLogo}>
                <img src="/logo.svg" alt="" width={32} height={32} />
                <span>JoobEscrow</span>
              </Link>
              <p className={styles.footerTagline}>
                Secure every payment. Funds stay locked on-chain until the work is approved, the deadline passes or a dispute is settled.
              </p>
              <div className={styles.footerSocials}>
                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={styles.headerSocial} aria-label="Telegram">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a50.363 50.363 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
                <a href={X_URL} target="_blank" rel="noopener noreferrer" className={styles.headerSocial} aria-label="X (Twitter)">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="mailto:contact@joobescrow.com" className={styles.headerSocial} aria-label="Email">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className={styles.footerCol}>
              <h3>Product</h3>
              <Link href="/app">Launch App</Link>
              <Link href="/try">Try it with $1</Link>
              <Link href="/how-disputes-work">How disputes work</Link>
              <Link href="/faq">FAQ</Link>
            </div>

            <div className={styles.footerCol}>
              <h3>JOOB token</h3>
              <Link href="/presale">Presale</Link>
              <Link href="/whitepaper">Whitepaper</Link>
              <Link href="/presale-terms">Presale terms</Link>
              <a href={ZEALY_URL} target="_blank" rel="noopener noreferrer">Zealy quests</a>
            </div>

            <div className={styles.footerCol}>
              <h3>Audits</h3>
              <a href={AUDITS.ESCROW_V4} target="_blank" rel="noopener noreferrer">Escrow contract V4</a>
              <a href={AUDITS.TOKEN} target="_blank" rel="noopener noreferrer">JOOB token</a>
              <a href={AUDITS.PRESALE} target="_blank" rel="noopener noreferrer">Presale &amp; airdrop</a>
              <a href={AUDITS.STAKING} target="_blank" rel="noopener noreferrer">Staking</a>
            </div>

            <div className={styles.footerCol}>
              <h3>Trust &amp; legal</h3>
              <Link href="/security">Security &amp; trust</Link>
              <Link href="/risks">Risks &amp; disclaimers</Link>
              <Link href="/compliance">Regulatory &amp; compliance</Link>
              <Link href="/terms">Terms of service</Link>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} JoobEscrow · Built on BNB Chain</span>
            <span>Only official site: joobescrow.com · We never DM first</span>
          </div>
        </footer>
      </div>
    </Web3Provider>
  );
}

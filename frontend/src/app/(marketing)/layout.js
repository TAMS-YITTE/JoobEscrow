import Link from 'next/link';
import styles from './marketing.module.css';
import dict from '../../i18n/en.json';

export default function MarketingLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          JoobEscrow
        </Link>
        <nav className={styles.nav}>
          <Link href="/security" className={styles.navLink}>
            {dict.landing.footer.security}
          </Link>
          <Link href="/app" className="btn btn-primary" style={{ padding: '6px 16px' }}>
            {dict.landing.hero.ctaPrimary}
          </Link>
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} JoobEscrow. All rights reserved.</p>
        <div className={styles.footerNav}>
          <Link href="/security" className={styles.navLink}>{dict.landing.footer.security}</Link>
          <Link href="/Universal_Service_Escrow_V4_Audit.pdf" target="_blank" className={styles.navLink}>Audit Report</Link>
        </div>
      </footer>
    </div>
  );
}

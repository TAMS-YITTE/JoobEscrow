import Link from 'next/link';
import styles from './marketing.module.css';
import dict from '../../i18n/en.json';

export default function LandingPage() {
  const d = dict.landing;

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>{d.hero.title}</h1>
        <p className={styles.heroSubtitle}>{d.hero.subtitle}</p>
        <div className={styles.heroCtas}>
          <Link href="/app" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
            {d.hero.ctaPrimary}
          </Link>
          <Link href="#how-it-works" className="btn btn-outline" style={{ padding: '12px 28px', fontSize: '1rem' }}>
            {d.hero.ctaSecondary}
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.section}>
        <h2 className={styles.sectionTitle}>{d.howItWorks.title}</h2>
        <div className={styles.stepsGrid}>
          {/* Step 1 */}
          <div className={`glass-panel ${styles.stepCard}`}>
            <div className={styles.stepIcon}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className={styles.stepTitle}>{d.howItWorks.step1.title}</h3>
            <p className={styles.stepDesc}>{d.howItWorks.step1.desc}</p>
          </div>
          {/* Step 2 */}
          <div className={`glass-panel ${styles.stepCard}`}>
            <div className={styles.stepIcon}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <h3 className={styles.stepTitle}>{d.howItWorks.step2.title}</h3>
            <p className={styles.stepDesc}>{d.howItWorks.step2.desc}</p>
          </div>
          {/* Step 3 */}
          <div className={`glass-panel ${styles.stepCard}`}>
            <div className={styles.stepIcon}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 className={styles.stepTitle}>{d.howItWorks.step3.title}</h3>
            <p className={styles.stepDesc}>{d.howItWorks.step3.desc}</p>
          </div>
        </div>

        {/* Trust Banner */}
        <div className={styles.trustBanner}>
          <svg width="32" height="32" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <h3 style={{ margin: 0 }}>{d.trust.auditBadge}</h3>
          <Link href="/Universal_Service_Escrow_V4_Audit.pdf" target="_blank" className="text-gradient">
            {d.trust.viewAudit} →
          </Link>
        </div>
      </section>
    </div>
  );
}

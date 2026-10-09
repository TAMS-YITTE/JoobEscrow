import Link from 'next/link';
import styles from '../presale/presale.module.css';
import { ROADMAP_STEPS, ROADMAP_STATUS_LABEL } from '../../../config/roadmap';

export const metadata = {
  title: 'Roadmap | JoobEscrow',
  description: 'JoobEscrow roadmap: what is live, the JOOB presale, TGE and liquidity, Escrow V5 and the next milestones. Phases after the presale have no fixed date.',
  alternates: { canonical: '/roadmap' },
};

const STATUS_CLASS = { done: styles.tagDone, now: styles.tagNow, next: styles.tagNext };
const TIMELINE_CLASS = { done: styles.timelineDone, now: styles.timelineNow, next: styles.timelineNext };

export default function RoadmapPage() {
  return (
    <div className={styles.page}>
      <div className={styles.quickNavWrap}>
        <nav className={styles.quickNav} aria-label="Learn">
          <Link href="/presale" className={styles.quickPill}>Presale</Link>
          <Link href="/tokenomics" className={styles.quickPill}>Tokenomics</Link>
          <Link href="/ecosystem" className={styles.quickPill}>Ecosystem</Link>
          <Link href="/roadmap" className={styles.quickPill} aria-current="page">Roadmap</Link>
          <Link href="/whitepaper" className={styles.quickPill}>Whitepaper</Link>
        </nav>
      </div>

      {/* ── Roadmap Section ────────────────────────────────────── */}
      <section className={styles.contentSection} id="roadmap">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>DEVELOPMENT PHASES</span>
          <h1 className={styles.sectionTitle}>Roadmap &amp; Milestones</h1>
        </div>

        <div style={{ background: 'rgba(17, 24, 31, 0.55)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '36px 32px', marginBottom: '24px' }}>
          <ol className={styles.timeline}>
            {ROADMAP_STEPS.map((phase) => (
              <li key={phase.title} className={`${styles.timelineStep} ${phase.status ? TIMELINE_CLASS[phase.status] : ''}`}>
                <div className={styles.timelineHead}>
                  <span className={styles.timelineTitle}>{phase.title}</span>
                  {phase.status && (
                    <span className={`${styles.timelineTag} ${STATUS_CLASS[phase.status]}`}>
                      {ROADMAP_STATUS_LABEL[phase.status]}
                    </span>
                  )}
                </div>
                <p className={styles.timelineDesc}>{phase.items}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className={styles.fineText}>
          Every new contract version is audited before launch. Phases after the presale have no fixed date: they depend on
          development, audits and adoption, and may change.
        </p>
      </section>

      <p className={styles.fineText} style={{ textAlign: 'center' }}>
        <Link href="/presale">Presale</Link> · <Link href="/whitepaper">Whitepaper</Link>
      </p>
    </div>
  );
}

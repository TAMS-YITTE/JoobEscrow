import Link from 'next/link';
import CoFundedEscrowDiagram from '../../../components/CoFundedEscrowDiagram';
import styles from '../presale/presale.module.css';

export const metadata = {
  title: 'Joob Ecosystem | JoobEscrow',
  description: 'How JoobEscrow, the JOOB token and the co-funded escrow fit together on BNB Smart Chain.',
  alternates: { canonical: '/ecosystem' },
};

export default function EcosystemPage() {
  return (
    <div className={styles.page}>
      <div className={styles.quickNavWrap}>
        <nav className={styles.quickNav} aria-label="Learn">
          <Link href="/presale" className={styles.quickPill}>Presale</Link>
          <Link href="/tokenomics" className={styles.quickPill}>Tokenomics</Link>
          <Link href="/ecosystem" className={styles.quickPill} aria-current="page">Ecosystem</Link>
          <Link href="/roadmap" className={styles.quickPill}>Roadmap</Link>
          <Link href="/whitepaper" className={styles.quickPill}>Whitepaper</Link>
        </nav>
      </div>

      {/* ── Ecosystem Section ──────────────────────────────────── */}
      <section className={styles.contentSection} id="ecosystem">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>SYNERGY & UTILITY</span>
          <h1 className={styles.sectionTitle}>The Joob Ecosystem</h1>
        </div>

        <div className={styles.ecoCardsGrid}>
          <div className={styles.ecoCard}>
            <span className={styles.ecoTag}>1 → 1</span>
            <h3>JoobEscrow</h3>
            <p>Secures a deal between two parties: funds stay locked on-chain until the work is approved. Live and audited.</p>
          </div>

          <div className={styles.ecoCard}>
            <span className={styles.ecoTag}>Many → 1 goal</span>
            <h3>PerShare</h3>
            <p>
              A collective pool: up to 50 members fund one goal, the group validates together, or everyone is refunded automatically.
              Live on BNB Chain and <a href="https://spywolf.co/audits/PerShare_Audit.pdf" target="_blank" rel="noopener noreferrer">audited by SpyWolf</a>.{' '}
              <a href="https://www.pershare.org" target="_blank" rel="noopener noreferrer">pershare.org ↗</a>
            </p>
          </div>

          <div className={styles.ecoCard}>
            <span className={styles.ecoTag}>One token</span>
            <h3>JOOB</h3>
            <p>
              Powers both: governance, fee tiers and staking on JoobEscrow, and 0% fees on PerShare for holders above a threshold
              (from the TGE). Next step: PerShare pools that directly fund a JoobEscrow escrow.
            </p>
          </div>
        </div>

        <div className={styles.diagramFrame}>
          <CoFundedEscrowDiagram />
        </div>
      </section>

      <p className={styles.fineText} style={{ textAlign: 'center' }}>
        <Link href="/roadmap">Roadmap</Link> · <Link href="/whitepaper">Whitepaper</Link>
      </p>
    </div>
  );
}

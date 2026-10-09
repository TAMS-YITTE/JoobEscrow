import Link from 'next/link';
import PresaleClient from './PresaleClient';
import PresaleFaq from './PresaleFaq';
import LegacyAnchorRedirect from './LegacyAnchorRedirect';
import styles from './presale.module.css';

export const metadata = {
  title: 'JOOB Token Presale | JoobEscrow',
  description: 'JOOB token presale on BNB Smart Chain: public price schedule, sealed token vault and on-chain vesting, enforced by a verified smart contract.',
  alternates: { canonical: '/presale' },
  openGraph: {
    title: 'JOOB Presale | JoobEscrow',
    description: 'Opens October 15, 2026 at 14:00 UTC. Starts at $0.001, sealed token vault, on-chain vesting, contracts audited by SpyWolf.',
    url: 'https://www.joobescrow.com/presale',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JOOB Presale | JoobEscrow',
    description: 'Opens October 15, 2026 at 14:00 UTC. Starts at $0.001, sealed token vault, on-chain vesting, contracts audited by SpyWolf.',
  },
};

export default function PresalePage() {
  return (
    <div className={styles.page}>
      <LegacyAnchorRedirect />
      <PresaleClient />

      {/* ── FAQ Section ────────────────────────────────────────── */}
      <section className={styles.contentSection} id="faq">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>QUESTIONS &amp; ANSWERS</span>
          <h2 className={styles.sectionTitle}>JOOB Token FAQ</h2>
        </div>

        <PresaleFaq />

        <p className={styles.fineText} style={{ textAlign: 'center', marginTop: '28px' }}>
          Read the full <Link href="/presale-terms">Presale Terms</Link> and
          the <Link href="/risks">Risks &amp; Disclaimers</Link> before participating.
        </p>
        <p className={styles.fineText} style={{ textAlign: 'center' }}>
          Learn more: <Link href="/tokenomics">Tokenomics &amp; use of funds</Link> · <Link href="/ecosystem">Ecosystem</Link> ·{' '}
          <Link href="/roadmap">Roadmap</Link> · <Link href="/whitepaper">Whitepaper</Link>
        </p>
      </section>
    </div>
  );
}

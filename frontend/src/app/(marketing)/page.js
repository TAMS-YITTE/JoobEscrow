import Link from 'next/link';
import styles from './marketing.module.css';
import dict from '../../i18n/en.json';
import LiveStats from '../../components/LiveStats';
import FeeCalculator from '../../components/FeeCalculator';
import PresaleHomeBanner from '../../components/PresaleHomeBanner';
import { AUDITS } from '../../config/presale';
import LiteYouTube from '../../components/LiteYouTube';

const WHY = [
  {
    big: '0% · 2–10%',
    title: 'Keep what you earn',
    text: 'Marketplaces can keep 20–30% of a deal across client and freelancer fees. With JoobEscrow the client pays 0% and the provider 2–10%, only when the payment is released.',
  },
  {
    big: 'Locked',
    title: 'Paid only when approved',
    text: 'Funds are locked in an audited smart contract, not held by us. The provider sees the money is there before starting the work.',
  },
  {
    big: 'Fair',
    title: 'Protected if it goes wrong',
    text: 'Full refund if the client cancels before the provider accepts. Otherwise a dispute is arbitrated and the contract splits the funds, from 0 to 100%.',
  },
];

export default function LandingPage() {
  const d = dict.landing;

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>{d.hero.title}</h1>
        <p className={styles.heroSubtitle}>{d.hero.subtitle}</p>
        <div className={styles.heroCtas} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
          <Link href="/app" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem', height: '100%', display: 'flex', alignItems: 'center' }}>
            {d.hero.ctaPrimary}
          </Link>
          <a href={AUDITS.ESCROW_V4} target="_blank" rel="noopener noreferrer" className={styles.auditBadge}>
            <img src="https://spywolf.co/images/SpyWolf-v2-logo.svg" alt="SpyWolf" className={styles.auditBadgeLogo} />
            <span className={styles.auditBadgeText}>
              <strong>Audited by SpyWolf</strong>
              <span>0 critical · all findings fixed ↗</span>
            </span>
          </a>
        </div>
        <div className={styles.demoCtaWrap}>
          <Link href="/try" className={styles.demoCta}>
            <span className={styles.demoCtaTag}>DEMO</span>
            New here? Try it with $1
            <span aria-hidden="true">→</span>
          </Link>
          <p className={styles.demoCtaSub}>Full escrow cycle between two of your wallets · 0% fee · USDT or USDC</p>
        </div>
        <PresaleHomeBanner />
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

        <div className={styles.videoWrap}>
          <LiteYouTube id="NbLMUrY4bac" title="JoobEscrow: secure payments in 45 seconds" />
        </div>
      </section>

      {/* Why JoobEscrow */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <h2 className={styles.sectionTitle}>Why JoobEscrow</h2>
        <div className={styles.whyGrid}>
          {WHY.map((w) => (
            <div key={w.title} className={`glass-panel ${styles.whyCard}`}>
              <div className={styles.whyBig}>{w.big}</div>
              <h3 className={styles.stepTitle}>{w.title}</h3>
              <p className={styles.stepDesc}>{w.text}</p>
            </div>
          ))}
        </div>
        <p className={styles.whyNote}>
          Marketplace figures: typical published seller and buyer service fees on large freelance marketplaces, small orders included.
          JoobEscrow fees are read on-chain from each contract tier.
        </p>
      </section>

      {/* Stats & Calculator Section */}
      <section style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '60px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'stretch' }}>
          <LiveStats />
          <FeeCalculator />
        </div>
      </section>



      {/* Mini FAQ */}
      <section className={`${styles.section} max-w-4xl mx-auto px-4`}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div className="space-y-4 text-left">
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg text-white mb-2">Is my money safe? Can JoobEscrow access it?</h3>
            <p className="text-gray-400">Your funds are locked in a non-custodial smart contract. We never have direct access to your tokens. The contract ensures that funds can only be released to the provider upon your approval, or refunded if canceled.</p>
          </div>
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg text-white mb-2">Who resolves disputes?</h3>
            <p className="text-gray-400">If a disagreement occurs, either party can open a dispute and share evidence. The JoobEscrow arbitration team reviews it and splits the funds between both parties (any split from 0 to 100%). If a dispute is abandoned for 30 days, either party can trigger a 50/50 split in the contract, so funds are never locked forever.</p>
          </div>
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg text-white mb-2">What fees do I pay?</h3>
            <p className="text-gray-400">Fees depend on the niche (ranging from 2% to 10%). The fee is only deducted from the provider&apos;s payout upon successful completion. There are no hidden setup fees.</p>
          </div>
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg text-white mb-2">Are my communications with the provider secure?</h3>
            <p className="text-gray-400">The in-app chat uses the <strong>XMTP protocol</strong>: end-to-end encrypted messages from wallet to wallet, linked to your escrow. Messages travel encrypted over the XMTP network (not in the smart contract, not on JoobEscrow servers) and only the two wallets can read them.</p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link href="/faq" className="text-gradient font-bold hover:underline">
            Read all FAQs →
          </Link>
        </div>
      </section>
    </div>
  );
}

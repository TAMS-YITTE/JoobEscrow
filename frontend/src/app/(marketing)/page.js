import Link from 'next/link';
import styles from './marketing.module.css';
import dict from '../../i18n/en.json';
import LiveStats from '../../components/LiveStats';
import FeeCalculator from '../../components/FeeCalculator';

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
          <Link href="https://spywolf.co/audits/Universal_Service_Escrow_V4_Audit.pdf" target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', background: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: '12px', height: '100%', transition: 'all 0.2s', minWidth: '160px' }} className="hover:opacity-90">
            <img src="https://spywolf.co/images/SpyWolf-v2-logo.svg" alt="Audited by SpyWolf" style={{ height: '24px', objectFit: 'contain' }} />
          </Link>
        </div>
      </section>

      {/* Video Section */}
      <section style={{ maxWidth: '800px', margin: '20px auto 60px auto', padding: '0 20px' }}>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0, 255, 128, 0.15)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <iframe 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            src="https://www.youtube.com/embed/NbLMUrY4bac?rel=0" 
            title="JoobEscrow - Secure Payments" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen>
          </iframe>
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
            <p className="text-gray-400">If a disagreement occurs, either party can open a dispute and submit evidence. JoobEscrow acts as an impartial arbitrator to review the evidence and distribute the funds fairly between both parties.</p>
          </div>
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg text-white mb-2">What fees do I pay?</h3>
            <p className="text-gray-400">Fees depend on the niche (ranging from 2% to 10%). The fee is only deducted from the provider&apos;s payout upon successful completion. There are no hidden setup fees.</p>
          </div>
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg text-white mb-2">Are my communications with the provider secure?</h3>
            <p className="text-gray-400">Yes! We integrated the <strong>XMTP protocol</strong> to provide wallet-to-wallet, end-to-end encrypted messaging directly inside the contract. Your files and negotiations remain 100% private and decentralized.</p>
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

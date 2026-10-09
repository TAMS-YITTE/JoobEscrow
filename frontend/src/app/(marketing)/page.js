import Link from 'next/link';
import styles from './marketing.module.css';
import AmbientConstellation from '../../components/AmbientConstellation';
import PresaleGlassCard from '../../components/PresaleGlassCard';
import PartnerMarquee from '../../components/PartnerMarquee';
import HomeFaq from '../../components/HomeFaq';
import LiveStats from '../../components/LiveStats';
import FeeCalculator from '../../components/FeeCalculator';
import LiteYouTube from '../../components/LiteYouTube';
import { AUDITS } from '../../config/presale';
import { TOKENOMICS, TOKENOMICS_SEGMENTS, fmtM } from '../../config/tokenomics';
import { ROADMAP_PHASES_WITH_STATUS } from '../../config/roadmap';

const PHASE_STATUS = {
  done: ['COMPLETED', styles.phaseStatusDone],
  now: ['IN PROGRESS', styles.phaseStatusActive],
  next: ['NEXT', styles.phaseStatusUpcoming],
  upcoming: ['UPCOMING', styles.phaseStatusUpcoming],
};

export const metadata = {
  title: 'Non-Custodial Smart Escrow & JOOB Presale | JoobEscrow',
  description: 'Secure every freelance and commercial payment with non-custodial smart contracts on BNB Smart Chain. Audited by SpyWolf, governed by 3-of-5 multisig.',
  alternates: { canonical: '/' },
};

export default function LandingPage() {
  return (
    <div className={styles.pageWrap}>
      <AmbientConstellation />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroLeft}>
              <div className={styles.pillBadge}>
                <span className={styles.pulseDot}></span>
                <span>JOOB PRESALE · OPENS OCT 15 · 14:00 UTC</span>
              </div>

              <h1 className={styles.heroTitle}>
                Secure every deal with <span className={styles.textGradient}>smart escrow.</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Marketplaces take 20–30%. With JoobEscrow, clients pay 0%, providers keep 90–98%, and funds stay locked in an audited smart contract until the work is approved, the deadline passes or a dispute is settled.
              </p>

              <div className={styles.heroTechLine}>
                AUDITED · NON-CUSTODIAL · BNB SMART CHAIN
              </div>

              <div className={styles.quickTiles}>
                <Link href="/try" className={styles.quickTile}>
                  <span className={styles.tileBadge}>DEMO</span>
                  <span>Try it with $1</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <a
                  href="https://bscscan.com/address/0xd3F3598Ff8efB2cF6643488e66e8df683804F63d"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.quickTile}
                >
                  <span className={styles.tileBadgeLive}>LIVE</span>
                  <span>Verify on BscScan</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>

              <div className={styles.heroCtas}>
                <Link href="/presale" className="btn btn-primary" style={{ padding: '14px 34px', fontSize: '1rem' }}>
                  Join the Presale
                </Link>
                <Link href="/app" className="btn btn-outline" style={{ padding: '14px 30px', fontSize: '1rem' }}>
                  Launch App
                </Link>
              </div>
            </div>

            <div className={styles.heroRight}>
              <PresaleGlassCard />
            </div>
          </div>

        </div>
      </section>

      {/* Marquee Partner Section */}
      <PartnerMarquee />

      {/* Referral Banner : juste sous le hero, bien visible */}
      <section className={styles.referralSection} id="referral">
        <div className={styles.container}>
          <div className={styles.referralBanner}>
            <div>
              <span className={styles.refTag}>REFERRAL PROGRAM · 2%</span>
              <h3 className={styles.refTitle}>
                Share JoobEscrow, earn <span className={styles.textGradient}>2% on-chain.</span>
              </h3>
              <p className={styles.refSub}>
                Referrers receive 2% of the JOOB bought through their link, with the same vesting as the presale.
              </p>
            </div>
            <Link href="/presale#referral" className={`btn btn-primary ${styles.refBtn}`}>
              Get Your Referral Link →
            </Link>
          </div>
        </div>
      </section>

      {/* Narrative 3 Eras */}
      <section className={styles.section} id="how-it-works">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>THE PROBLEM & THE SHIFT</span>
            <h2 className={styles.sectionTitle}>The Evolution of Online Deals</h2>
          </div>

          <div className={styles.erasGrid}>
            <div className={`glass-panel ${styles.eraCard}`}>
              <div className={`${styles.eraNum} ${styles.textGradient}`}>01</div>
              <h3 className={styles.eraTitle}>Marketplaces keep 20–30%</h3>
              <p className={styles.eraDesc}>
                Traditional platforms take heavy fees from both clients and service providers. Payments can be frozen without warning, and disputes take weeks.
              </p>
            </div>

            <div className={`glass-panel ${styles.eraCard}`}>
              <div className={`${styles.eraNum} ${styles.textGradient}`}>02</div>
              <h3 className={styles.eraTitle}>Direct deals mean blind trust</h3>
              <p className={styles.eraDesc}>
                Skipping marketplaces eliminates platform fees, but creates an eternal dilemma: who pays first? Who delivers first? Unpaid work remains common.
              </p>
            </div>

            <div className={`glass-panel ${styles.eraCard} ${styles.eraCardHighlight}`}>
              <div className={`${styles.eraNum} ${styles.textGradient}`}>03</div>
              <h3 className={styles.eraTitle}>JoobEscrow: Code is law</h3>
              <p className={styles.eraDesc}>
                Funds are locked on-chain before the work begins. Released on approval, claimable after the deadline, or split in a dispute. 0% for clients, 2–10% for providers.
              </p>
            </div>
          </div>

          <div className={styles.videoWrap}>
            <LiteYouTube id="NbLMUrY4bac" title="JoobEscrow: secure payments in 45 seconds" />
          </div>
        </div>
      </section>

      {/* Layered Protocol Architecture */}
      <section className={styles.sectionAlt}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>PROTOCOL ARCHITECTURE</span>
            <h2 className={styles.sectionTitle}>The JoobEscrow Infrastructure</h2>
          </div>

          <div className={styles.layersContainer}>
            <div className={`glass-panel ${styles.layerCard} ${styles.layerCardActive}`}>
              <div className={styles.layerBadge}>03</div>
              <div className={styles.layerInfo}>
                <h4>Application & Integration Layer</h4>
                <p>Shareable escrow contract links, $1 interactive sandbox (/try), real-time dashboards and status alerts.</p>
              </div>
              <span className={styles.layerTagLive}>LIVE MAINNET</span>
            </div>

            <div className={`glass-panel ${styles.layerCard}`}>
              <div className={styles.layerBadge}>02</div>
              <div className={styles.layerInfo}>
                <h4>Arbitration & Messaging Layer</h4>
                <p>Wallet-to-wallet E2E encrypted chat powered by XMTP. Granular multi-split dispute settlement (0% to 100%).</p>
              </div>
              <span className={styles.layerTagLive}>LIVE MAINNET</span>
            </div>

            <div className={`glass-panel ${styles.layerCard}`}>
              <div className={styles.layerBadge}>01</div>
              <div className={styles.layerInfo}>
                <h4>On-Chain Settlement Layer</h4>
                <p>Non-custodial Universal Escrow V4 smart contract deployed on BNB Smart Chain. Withdrawals keep working even when paused.</p>
              </div>
              <span className={styles.layerTagLive}>AUDITED (SPYWOLF)</span>
            </div>

            <div className={`glass-panel ${styles.layerCard}`} style={{ opacity: 0.75 }}>
              <div className={styles.layerBadge}>00</div>
              <div className={styles.layerInfo}>
                <h4>Escrow V5 & Co-Funded Deals</h4>
                <p>Multi-sponsor collective funding and fee waivers for JOOB token stakers.</p>
              </div>
              <span className={styles.layerTagPlanned}>PLANNED</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tokenomics Donut Section */}
      <section className={styles.sectionAlt} id="tokenomics">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>TOKENOMICS & ALLOCATION</span>
            <h2 className={styles.sectionTitle}>Sustainable On-Chain Economics</h2>
          </div>

          <div className={styles.tokenomicsWrap}>
            <div className={styles.donutHolder}>
              <svg width="280" height="280" viewBox="0 0 42 42" role="img" aria-label="JOOB token allocation">
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4.5" />
                {TOKENOMICS_SEGMENTS.map((t) => {
                  const len = Math.max(t.pct - 0.3, 0.2);
                  return (
                    <circle key={t.name} cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke={t.color} strokeWidth="4.5"
                      strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={25 - t.start}>
                      <title>{`${t.name}: ${t.pct}% (${fmtM(t.pct)} JOOB)`}</title>
                    </circle>
                  );
                })}
              </svg>
              <div className={styles.donutCenter}>
                <div className={`${styles.donutBigVal} ${styles.textGradient}`}>1B</div>
                <div className={styles.donutSubLabel}>FIXED SUPPLY JOOB</div>
              </div>
            </div>

            <div className={styles.tokenLegend}>
              {TOKENOMICS.map((t) => (
                <div key={t.name} className={styles.legendRow}>
                  <div className={styles.legendTop}>
                    <span>{t.name}{t.contract ? ' · locked on-chain' : t.onChain ? ' · enforced on-chain' : ''}</span>
                    <span className={styles.monoLime}>{t.pct}% ({fmtM(t.pct)})</span>
                  </div>
                  <div className={styles.legendTrack}><div className={styles.legendFill} style={{ width: `${(t.pct / 25) * 100}%`, background: t.color }}></div></div>
                </div>
              ))}
              <Link href="/presale#tokenomics" className="text-gradient font-bold hover:underline">Full tokenomics and vesting →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats & Fee Calculator */}
      <section className={styles.section} id="demo">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>ON-CHAIN ACTIVITY & FEES</span>
            <h2 className={styles.sectionTitle}>Transparent Fee Structure</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'stretch' }}>
            <LiveStats />
            <FeeCalculator />
          </div>
        </div>
      </section>

      {/* Horizontal Roadmap */}
      <section className={styles.sectionAlt} id="roadmap">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>DEVELOPMENT TIMELINE</span>
            <h2 className={styles.sectionTitle}>Strategic Roadmap</h2>
          </div>

          <div className={styles.roadmapGrid}>
            {ROADMAP_PHASES_WITH_STATUS.map((p) => (
              <div key={p.phase} className={`glass-panel ${styles.roadCard} ${p.status === 'now' ? styles.roadCardActive : ''}`}>
                <div className={styles.roadPhaseHeader}>
                  <span className={styles.phaseTag}>PHASE {p.phase}</span>
                  <span className={PHASE_STATUS[p.status ?? 'upcoming'][1]}>{PHASE_STATUS[p.status ?? 'upcoming'][0]}</span>
                </div>
                <h3 className={styles.roadTitle}>{p.title}</h3>
                <p className={styles.roadDesc}>{p.summary}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link href="/presale#roadmap" className="text-gradient font-bold hover:underline">Detailed roadmap →</Link>
          </div>
        </div>
      </section>

      {/* Security Pillars */}
      <section className={styles.section} id="security">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>SECURITY FIRST</span>
            <h2 className={styles.sectionTitle}>Built Without Compromise</h2>
          </div>

          <div className={styles.securityGrid}>
            <div className={`glass-panel ${styles.secCard}`}>
              <div className={styles.secIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className={styles.secTitle}>Non-Custodial</h3>
              <p className={styles.secDesc}>
                Your private keys remain yours. We never hold your assets nor ask for seed phrases.
              </p>
            </div>

            <div className={`glass-panel ${styles.secCard}`}>
              <div className={styles.secIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 className={styles.secTitle}>Anti-Rug Withdrawals</h3>
              <p className={styles.secDesc}>
                Participant withdrawal paths remain operational even if contracts are ever placed in pause.
              </p>
            </div>

            <div className={`glass-panel ${styles.secCard}`}>
              <div className={styles.secIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className={styles.secTitle}>3-of-5 Governance</h3>
              <p className={styles.secDesc}>
                Treasury and admin actions need 3 of the 5 signers of the Safe multisig to approve: no single signer can act alone.
              </p>
            </div>

            <div className={`glass-panel ${styles.secCard}`}>
              <div className={styles.secIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className={styles.secTitle}>Audited by SpyWolf</h3>
              <p className={styles.secDesc}>
                0 critical findings. Public reports verifiable directly on SpyWolf Network and BscScan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ & Referral Banner */}
      <section className={styles.sectionAlt} id="faq">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>QUESTIONS & ANSWERS</span>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          </div>

          <HomeFaq />
        </div>
      </section>
    </div>
  );
}

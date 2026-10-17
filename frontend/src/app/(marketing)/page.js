import { Fragment } from 'react';
import Link from 'next/link';
import styles from './marketing.module.css';
import AmbientConstellation from '../../components/AmbientConstellation';
import PresaleGlassCard from '../../components/PresaleGlassCard';
import PartnerMarquee from '../../components/PartnerMarquee';
import { BSCN_ARTICLE_URL } from '../../config/links';
import HomeFaq from '../../components/HomeFaq';
import LiveStats from '../../components/LiveStats';
import FeeCalculator from '../../components/FeeCalculator';
import { AUDITS, BSCSCAN, KYC_URL, PRESALE_ADDRESSES } from '../../config/presale';
import { instances } from '../../config/instances';
import { TOKENOMICS, TOKENOMICS_SEGMENTS, fmtM } from '../../config/tokenomics';
import { ROADMAP_PHASES_WITH_STATUS } from '../../config/roadmap';

// Fourchette de frais et exemple derives de config/instances.js (aucun taux ni nom en dur).
const FEE_TIERS = Object.values(instances).map((n) => n.feeTier);
const FEE_MIN = Math.min(...FEE_TIERS);
const FEE_MAX = Math.max(...FEE_TIERS);
const EXAMPLE_NICHE = instances.pro;
const EXAMPLE_AMOUNT = 1000;
const EXAMPLE_FEE = (EXAMPLE_AMOUNT * EXAMPLE_NICHE.feeTier) / 100;
const EXAMPLE_NET = EXAMPLE_AMOUNT - EXAMPLE_FEE;

const HOW_STEPS = [
  {
    num: 'STEP 1',
    title: 'Create & lock funds',
    desc: "The client locks USDT or USDC in the category's audited contract on BNB Smart Chain and shares the deal link. Client fee: 0%.",
  },
  {
    num: 'STEP 2',
    title: 'Accept & deliver',
    desc: 'The provider reviews the on-chain terms and accepts. Before acceptance, the client can cancel at any time for a full refund. An encrypted wallet-to-wallet chat (XMTP) is built in.',
  },
  {
    num: 'STEP 3',
    title: 'Release, claim or mediate',
    desc: 'The client releases the funds in one click when satisfied. If the deadline passes after acceptance, the provider can claim the payment. If a dispute is opened, funds stay locked until it is settled by the 3-of-5 Safe multisig, with an automatic 50/50 option after 30 days.',
  },
  {
    num: 'STEP 4',
    title: 'Withdraw to wallet',
    desc: `The provider withdraws the net payout from the contract (after the ${FEE_MIN}–${FEE_MAX}% category fee; 0% on the $1 demo). Withdrawals keep working even if a contract is paused.`,
  },
];

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
          <div className={styles.heroTechLine}>
            <Link href="/security" className={styles.trustPill}>
              <img src="/logos/spywolf.svg" alt="SpyWolf" width={18} height={18} />
              <span>
                {['AUDITED', 'KYC VERIFIED'].map((t, i) => (
                  <Fragment key={t}>{i > 0 && ' · '}<span style={{ whiteSpace: 'nowrap' }}>{t}</span></Fragment>
                ))}
              </span>
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 28px' }}>
            <a href={BSCN_ARTICLE_URL} target="_blank" rel="noopener noreferrer" className="press-pill">
              <img src="/logos/bscnews.webp" alt="BSC News" width={30} height={30} style={{ borderRadius: 8, flexShrink: 0 }} />
              <span>Read our launch article on <strong>BSC News</strong></span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className={styles.heroGrid}>
            <div className={styles.heroLeft}>
              <div className={styles.pillBadge}>
                <span className={styles.pulseDot}></span>
                <span>JOOB PRESALE · LIVE ON BNB CHAIN</span>
              </div>

              <h1 className={styles.heroTitle}>
                Secure every deal with <span className={styles.textGradient}>smart escrow.</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Marketplaces take 20–30%. With JoobEscrow, clients pay 0%, providers keep 90–98%, and funds stay locked in an audited smart contract until the work is approved, the deadline passes or a dispute is settled.
              </p>

              <div className={styles.heroProofLine}>
                {['NON-CUSTODIAL', 'VERIFIABLE ON BNB SMART CHAIN'].map((t, i) => (
                  <Fragment key={t}>{i > 0 && ' · '}<span style={{ whiteSpace: 'nowrap' }}>{t}</span></Fragment>
                ))}
              </div>

              <div className={styles.quickTiles}>
                <Link href="/try" className={styles.quickTile}>
                  <span className={styles.tileBadge}>DEMO</span>
                  <span>Try it with $1</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <a
                  href={`${BSCSCAN}/address/${PRESALE_ADDRESSES.PRESALE}`}
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
                Funds are locked on-chain before the work begins. Released on approval, claimable after the deadline, or split in a dispute. 0% for clients, {FEE_MIN}–{FEE_MAX}% for providers.
              </p>
            </div>
          </div>

          <div className={styles.howFlowWrap}>
            <div className={styles.howStepsCol}>
              <div className={styles.howSubHead}>
                <span className={styles.sectionTag}>STEP BY STEP</span>
                <h3 className={styles.howSubTitle}>How an escrow deal works</h3>
              </div>
              <div className={styles.howStepsList}>
                {HOW_STEPS.map((s) => (
                  <div key={s.num} className={`glass-panel ${styles.howStepItem}`}>
                    <span className={styles.stepNumPill}>{s.num}</span>
                    <div>
                      <h4 className={styles.stepTitle}>{s.title}</h4>
                      <p className={styles.stepDesc}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`glass-panel ${styles.dealPreviewCard}`}>
              <div className={styles.dealPreviewTop}>
                <span className={styles.dealExampleTag}>Example</span>
                <span className={styles.dealStatusBadge}>In progress</span>
              </div>

              <div className={styles.dealPreviewHeader}>
                <div>
                  <div className={styles.dealPreviewCat}>
                    {EXAMPLE_NICHE.name} · {EXAMPLE_NICHE.feeTier}% fee
                  </div>
                  <div className={styles.dealPreviewRoles}>
                    {EXAMPLE_NICHE.lexicon.client} ↔ {EXAMPLE_NICHE.lexicon.provider}
                  </div>
                </div>
                <div className={styles.dealPreviewAmount}>
                  {EXAMPLE_AMOUNT.toLocaleString('en-US')} <span>USDT</span>
                </div>
              </div>

              {/* Frise 3 etapes identique a EscrowCard.js */}
              <div className={styles.dealTimeline} aria-label="Escrow progress">
                <div className={`${styles.dealTimelineStep} ${styles.dealStepDone}`}>
                  <span className={styles.dealTimelineNode} aria-hidden="true">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className={styles.dealTimelineLabel}>Accepted</span>
                </div>

                <div className={`${styles.dealTimelineLine} ${styles.dealLineDone}`} />

                <div className={`${styles.dealTimelineStep} ${styles.dealStepActive}`}>
                  <span className={styles.dealTimelineNode} aria-hidden="true">
                    <span className={styles.dealNodeDot} />
                  </span>
                  <span className={styles.dealTimelineLabel}>In progress</span>
                </div>

                <div className={styles.dealTimelineLine} />

                <div className={styles.dealTimelineStep}>
                  <span className={styles.dealTimelineNode} aria-hidden="true">
                    <span className={styles.dealNodeDot} />
                  </span>
                  <span className={styles.dealTimelineLabel}>Completed</span>
                </div>
              </div>

              <div className={styles.dealBreakdown}>
                <div className={styles.dealBreakdownRow}>
                  <span>Deposited amount</span>
                  <strong>{EXAMPLE_AMOUNT.toLocaleString('en-US')} USDT</strong>
                </div>
                <div className={styles.dealBreakdownRow}>
                  <span>Client fee</span>
                  <strong>0%</strong>
                </div>
                <div className={styles.dealBreakdownRow}>
                  <span>Provider fee</span>
                  <strong>{EXAMPLE_NICHE.feeTier}% ({EXAMPLE_FEE.toLocaleString('en-US')} USDT)</strong>
                </div>
                <div className={`${styles.dealBreakdownRow} ${styles.dealBreakdownNet}`}>
                  <span>Net to provider</span>
                  <strong>{EXAMPLE_NET.toLocaleString('en-US')} USDT</strong>
                </div>
              </div>

              <div className={styles.dealPreviewLinks}>
                <Link href="/try" className={styles.dealPreviewLinkPrimary}>
                  Try it live with $1 →
                </Link>
                <Link href="/app" className={styles.dealPreviewLinkSecondary}>
                  Explore categories →
                </Link>
              </div>
            </div>
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
              <Link href="/tokenomics" className="text-gradient font-bold hover:underline">Full tokenomics and vesting →</Link>
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
            <Link href="/roadmap" className="text-gradient font-bold hover:underline">Detailed roadmap →</Link>
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
              <h3 className={styles.secTitle}>Audited &amp; KYC by SpyWolf</h3>
              <p className={styles.secDesc}>
                Contracts audited with 0 critical findings, founder identity verified by the same firm. Public reports verifiable on SpyWolf Network and BscScan.
              </p>
              <p className={styles.secDesc} style={{ marginTop: '10px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link href="/security" className="text-gradient font-bold hover:underline">Audit reports →</Link>
                <a href={KYC_URL} target="_blank" rel="noopener noreferrer" className="text-gradient font-bold hover:underline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><img src="/logos/spywolf.svg" alt="" width={16} height={16} />KYC certificate ↗</a>
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

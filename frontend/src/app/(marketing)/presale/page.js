import Link from 'next/link';
import CoFundedEscrowDiagram from '../../../components/CoFundedEscrowDiagram';
import PresaleClient from './PresaleClient';
import PresaleFaq from './PresaleFaq';
import styles from './presale.module.css';
import { TOKENOMICS, TOKENOMICS_SEGMENTS, fmtM } from '../../../config/tokenomics';
import { PLANNED_LISTING_PRICE } from '../../../config/presale';

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

const ROADMAP = [
  { title: 'Foundations', status: 'done', items: 'Audited escrow contract, verified on BscScan, owned by a Safe multisig. 15 categories and encrypted in-app chat.' },
  { title: 'Trust layer', status: 'now', items: 'Check a deal before you pay. Live: $1 demo with a step-by-step guide, shareable escrow links. Next: public deal pages anyone can verify without a wallet, Telegram alerts, dispute evidence recorded on-chain.' },
  { title: 'JOOB presale', status: 'next', items: 'October 15, 2026 → January 13, 2027. Sealed vault, vesting for every participant, unsold tokens returned to the Safe and burned in a public transaction.' },
  { title: 'TGE & liquidity', items: `JOOB/USDT pool on PancakeSwap at an initial price of $${PLANNED_LISTING_PRICE}, JOOB staking opens (contract already audited), JOOB activated on PerShare, first JOOB utilities (boosts & badges), Early Escrow points.` },
  { title: 'Escrow V5', items: 'JOOB holder fee tiers: stake JOOB to pay lower fees, up to a full fee waiver at the highest tier. On-chain affiliate rewards, gasless payouts, verified reputation profiles.' },
  { title: 'Escrow V5.1', items: 'Milestone payments, partial releases, amicable settlement, bulk deals for agencies.' },
  { title: 'As easy as a Web2 app', items: 'Hide the Web3 complexity: sign in with email or social accounts, no seed phrase to start, network fees covered for users, pay by card. Same on-chain security, your keys stay yours.' },
  { title: 'Expansion', items: 'Multichain, API & "Pay me with JoobEscrow" widget, receipts & invoices.' },
  { title: 'Joob ecosystem: co-funded escrow', items: 'With PerShare V2: several sponsors pool funds and open one JoobEscrow escrow, paid only on delivery; refunds return pro-rata in the same currency. Built on Escrow V5, audited before launch.' },
  { title: 'JOOB governance', items: 'JOOB holders vote on protocol decisions: new categories, fee tiers, ecosystem grants. Off-chain votes first, then on-chain governance, and staked arbitrators.' },
];

const USE_OF_FUNDS = [
  { name: 'PancakeSwap liquidity', pct: 40, text: `JOOB/stablecoin pool at the $${PLANNED_LISTING_PRICE} listing price, LP tokens locked 12 months or more.` },
  { name: 'Product development', pct: 30, text: 'Escrow V5 (holder fee tiers, governance), PerShare V2 and the co-funded escrow, the "as easy as a Web2 app" layer.' },
  { name: 'Audits & security', pct: 10, text: 'Audits of Escrow V5 and PerShare V2, bug bounty, monitoring.' },
  { name: 'Growth', pct: 10, text: 'KOL campaigns, listings, partnerships.' },
  { name: 'Operations & reserve', pct: 10, text: 'Infrastructure, legal, contingencies.' },
];

function TokenomicsDonut() {
  const R = 15.9155;
  return (
    <svg viewBox="0 0 42 42" width="240" height="240" role="img" aria-label="JOOB token allocation">
      <circle cx="21" cy="21" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      {TOKENOMICS_SEGMENTS.map((t) => {
        const len = Math.max(t.pct - 0.3, 0.2);
        return (
          <circle
            key={t.name}
            cx="21"
            cy="21"
            r={R}
            fill="none"
            stroke={t.color}
            strokeWidth="5"
            strokeDasharray={`${len} ${100 - len}`}
            strokeDashoffset={25 - t.start}
          >
            <title>{`${t.name}: ${t.pct}% (${fmtM(t.pct)} JOOB)`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

const STATUS_LABEL = { done: 'Done', now: 'In progress', next: 'Next' };
const STATUS_CLASS = { done: styles.tagDone, now: styles.tagNow, next: styles.tagNext };
const TIMELINE_CLASS = { done: styles.timelineDone, now: styles.timelineNow, next: styles.timelineNext };

export default function PresalePage() {
  return (
    <div className={styles.page}>
      <PresaleClient />

      {/* ── Tokenomics Section ─────────────────────────────────── */}
      <section className={styles.contentSection} id="tokenomics">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>TOKENOMICS & ALLOCATION</span>
          <h2 className={styles.sectionTitle}>Sustainable On-Chain Economics</h2>
        </div>

        <div className={styles.tokenomicsWrap}>
          <div className={styles.donutHolder}>
            <TokenomicsDonut />
            <div className={styles.donutCenter}>
              <div className={`${styles.donutBigVal} ${styles.titleGradient}`}>1B</div>
              <div className={styles.donutSubLabel}>MAX SUPPLY JOOB</div>
            </div>
          </div>

          <ul className={styles.tokenomicsList}>
            {TOKENOMICS.map((t) => (
              <li key={t.name} className={styles.tokenomicsItem}>
                <span className={styles.tokenomicsDot} style={{ background: t.color }} />
                <div className={styles.tokenomicsDetails}>
                  <div className={styles.tokenomicsRow1}>
                    <span>
                      {t.name}
                      {t.highlight && <span style={{ color: '#a3e635', fontSize: '0.8rem', marginLeft: '6px' }}>({t.highlight})</span>}
                    </span>
                    <span>{t.pct}%</span>
                  </div>
                  <div className={styles.tokenomicsRow2}>
                    <span>{fmtM(t.pct)} JOOB · {t.vesting}</span>
                    {t.contract ? (
                      <a href={`https://bscscan.com/address/${t.contract}`} target="_blank" rel="noopener noreferrer" className={`${styles.tokenomicsTag} ${styles.tokenomicsTagOn}`}>
                        Locked on-chain ↗
                      </a>
                    ) : (
                      <span className={`${styles.tokenomicsTag} ${t.onChain ? styles.tokenomicsTagOn : ''}`}>
                        {t.onChain ? 'Enforced on-chain' : 'Planned'}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.fineText}>
          Fixed supply, no mint function, no transfer tax. Presale tokens that are not sold are returned to the Safe and burned in a public, verifiable transaction after the sale.
          &quot;Enforced on-chain&quot; means the vesting is held by the deployed, audited presale contract; &quot;Planned&quot;
          allocations stay in the JoobEscrow Safe multisig until their vesting contracts are deployed.
        </p>
        <p className={styles.fineText}>
          <strong>Transparency commitment:</strong> allocations not yet in a vesting contract stay in our 3-of-5 Safe
          multisig. Every outgoing JOOB transfer from the Safe is publicly disclosed with its purpose and transaction
          link. Tokens allocated to partners are locked in their own on-chain vesting contract.
        </p>
      </section>

      {/* ── Use of Funds Section ───────────────────────────────── */}
      <section className={styles.contentSection} id="use-of-funds">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>CAPITAL ALLOCATION</span>
          <h2 className={styles.sectionTitle}>Use of Funds</h2>
        </div>

        <div className={styles.fundsWrap}>
          {USE_OF_FUNDS.map((f) => (
            <div key={f.name} className={styles.fundsRow}>
              <div className={styles.fundsHead}>
                <span>{f.name}</span>
                <span style={{ color: '#a3e635' }}>{f.pct}%</span>
              </div>
              <div className={styles.fundsBar}>
                <div className={styles.fundsFill} style={{ width: `${f.pct}%` }} />
              </div>
              <p className={styles.fundsText}>{f.text}</p>
            </div>
          ))}
        </div>

        <p className={styles.fineText}>
          Funds raised are held by our 3-of-5 Safe multisig and every outgoing transfer is disclosed. Liquidity is added at the planned
          listing price; the DEX allocation of the tokenomics is a cap, not a promise of liquidity depth.
        </p>
      </section>

      {/* ── Ecosystem Section ──────────────────────────────────── */}
      <section className={styles.contentSection} id="ecosystem">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>SYNERGY & UTILITY</span>
          <h2 className={styles.sectionTitle}>The Joob Ecosystem</h2>
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

      {/* ── Roadmap Section ────────────────────────────────────── */}
      <section className={styles.contentSection} id="roadmap">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>DEVELOPMENT PHASES</span>
          <h2 className={styles.sectionTitle}>Roadmap &amp; Milestones</h2>
        </div>

        <div style={{ background: 'rgba(17, 24, 31, 0.55)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '36px 32px', marginBottom: '24px' }}>
          <ol className={styles.timeline}>
            {ROADMAP.map((phase) => (
              <li key={phase.title} className={`${styles.timelineStep} ${phase.status ? TIMELINE_CLASS[phase.status] : ''}`}>
                <div className={styles.timelineHead}>
                  <span className={styles.timelineTitle}>{phase.title}</span>
                  {phase.status && (
                    <span className={`${styles.timelineTag} ${STATUS_CLASS[phase.status]}`}>
                      {STATUS_LABEL[phase.status]}
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
      </section>
    </div>
  );
}

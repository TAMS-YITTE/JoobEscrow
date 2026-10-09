import Link from 'next/link';
import styles from '../presale/presale.module.css';
import { TOKENOMICS, TOKENOMICS_SEGMENTS, fmtM } from '../../../config/tokenomics';
import { PLANNED_LISTING_PRICE } from '../../../config/presale';

export const metadata = {
  title: 'JOOB Tokenomics | JoobEscrow',
  description: 'JOOB token allocation: 1B fixed supply, vesting of each allocation, which parts are enforced on-chain, and how presale funds are used.',
  alternates: { canonical: '/tokenomics' },
};

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

export default function TokenomicsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.quickNavWrap}>
        <nav className={styles.quickNav} aria-label="Learn">
          <Link href="/presale" className={styles.quickPill}>Presale</Link>
          <Link href="/tokenomics" className={styles.quickPill} aria-current="page">Tokenomics</Link>
          <Link href="/ecosystem" className={styles.quickPill}>Ecosystem</Link>
          <Link href="/roadmap" className={styles.quickPill}>Roadmap</Link>
          <Link href="/whitepaper" className={styles.quickPill}>Whitepaper</Link>
        </nav>
      </div>

      {/* ── Tokenomics Section ─────────────────────────────────── */}
      <section className={styles.contentSection} id="tokenomics">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>TOKENOMICS & ALLOCATION</span>
          <h1 className={styles.sectionTitle}>JOOB Tokenomics</h1>
        </div>

        <div className={styles.tokenomicsWrap}>
          <div className={styles.donutHolder}>
            <TokenomicsDonut />
            <div className={styles.donutCenter}>
              <div className={`${styles.donutBigVal} ${styles.titleGradient}`}>1B</div>
              <div className={styles.donutSubLabel}>FIXED SUPPLY JOOB</div>
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

      <p className={styles.fineText} style={{ textAlign: 'center' }}>
        <Link href="/presale">Join the presale</Link> · <Link href="/presale-terms">Presale Terms</Link> · <Link href="/risks">Risks &amp; Disclaimers</Link>
      </p>
    </div>
  );
}

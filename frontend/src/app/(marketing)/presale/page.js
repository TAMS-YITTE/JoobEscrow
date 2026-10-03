import Link from 'next/link';
import PresaleClient from './PresaleClient';
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

const FAQ = [
  {
    q: 'What is JOOB?',
    a: 'JOOB is the BEP-20 token of the JoobEscrow ecosystem on BNB Smart Chain (fixed supply of 1,000,000,000). It is designed to be the key to the protocol: governance (JOOB holders vote on protocol decisions such as new categories, fee tiers and ecosystem grants), fee reductions for holders who stake JOOB, by tier, up to a full fee waiver at the highest tier (with Escrow V5), JOOB staking (contract already deployed and audited by SpyWolf, opening after the TGE: stake JOOB, earn JOOB rewards, 7-day withdrawal delay, no guaranteed yield), 0% fees on PerShare (our audited collective-pool app) for holders above a threshold from the TGE, plus boosts and badges, affiliate rewards in JOOB and Early Escrow points. These features ship progressively and are not guaranteed by a given date. JOOB gives no ownership, profit or revenue right in JoobEscrow, and using JoobEscrow escrows never requires JOOB.',
  },
  {
    q: 'How is the price set during the presale?',
    a: 'The price is computed by the smart contract from a public schedule: it starts at $0.001 and increases by $0.0002 every 2 days. The price applied is the one at the moment your transaction is executed. If a price step happens between your confirmation and the execution, the transaction is cancelled and nothing is charged.',
  },
  {
    q: 'When can I claim my tokens?',
    a: 'Nothing is claimable before the sale ends. When it ends, 20% of your allocation (purchases and bonuses) becomes claimable, and the remaining 80% unlocks linearly, second by second, over 180 days. You claim from this page at any time; claims cannot be paused.',
  },
  {
    q: 'What is the "sealed vault"?',
    a: 'The contract cannot open the sale until the full 163.5M JOOB cap has been deposited in it. You can check the deposited amount at any time on BscScan (depositedTokens). Buyer allocations are always covered by tokens already held by the contract.',
  },
  {
    q: 'Are the contracts audited?',
    a: 'Yes. The JOOB token and the presale contract were audited by SpyWolf: no critical, high or medium issue, and every reported finding was fixed or acknowledged. Reports: spywolf.co/audits/StandardToken_Audit_JoobEscrow.pdf and spywolf.co/audits/VestingPresale_Airdrop_Audit_JoobEscrow.pdf. An audit reduces technical risk but does not remove it.',
  },
  {
    q: 'How do the volume bonus and referral work?',
    a: 'The volume bonus depends on your cumulative USDT + USDC contribution: 2% from $100, 3.5% from $250, 5% from $500 and 7% from $1,000, applied to all the tokens you bought (earlier purchases are topped up automatically). A referrer receives 2% of the tokens bought through their link. Bonuses follow the same vesting and count toward the cap.',
  },
  {
    q: 'What happens to unsold tokens and to the funds raised?',
    a: 'After the sale, unsold tokens are returned to the JoobEscrow Safe multisig and burned on-chain. The stablecoins raised are withdrawn by the same multisig. There is no soft cap and no refund.',
  },
  {
    q: 'Will JOOB be tradable after the sale?',
    a: 'A JOOB/USDT pool on PancakeSwap is planned right after the sale ends, opened by the JoobEscrow Safe at an initial price of $0.02 (50 JOOB per USDT), above every presale price. Once trading starts, the price is set by the market alone: it is not guaranteed and may be lower than the price you paid. Only contribute what you can afford to lose.',
  },
  {
    q: 'Who can participate?',
    a: 'Only adults who are not residents of a restricted jurisdiction listed in the Presale Terms. You are responsible for checking that participation is legal where you live.',
  },
];

// Feuille de route publique : aucune date au-dela de la presale (rien de signe ni planifie).
const ROADMAP = [
  { title: 'Foundations', status: 'done', items: 'Audited escrow contract, verified on BscScan, owned by a Safe multisig. 15 categories and encrypted in-app chat.' },
  { title: 'Trust layer', status: 'now', items: 'Check a deal before you pay. Live: $1 demo with a step-by-step guide, shareable escrow links. Next: public deal pages anyone can verify without a wallet, Telegram alerts, dispute evidence recorded on-chain.' },
  { title: 'JOOB presale', status: 'next', items: 'October 15, 2026 → January 13, 2027. Sealed vault, vesting for every participant, unsold tokens returned to the Safe and burned in a public transaction.' },
  { title: 'TGE & liquidity', items: 'JOOB/USDT pool on PancakeSwap at an initial price of $0.02, JOOB staking opens (contract already audited), JOOB activated on PerShare, first JOOB utilities (boosts & badges), Early Escrow points.' },
  { title: 'Escrow V5', items: 'JOOB holder fee tiers: stake JOOB to pay lower fees, up to a full fee waiver at the highest tier. On-chain affiliate rewards, gasless payouts, verified reputation profiles.' },
  { title: 'Escrow V5.1', items: 'Milestone payments, partial releases, amicable settlement, bulk deals for agencies.' },
  { title: 'As easy as a Web2 app', items: 'Hide the Web3 complexity: sign in with email or social accounts, no seed phrase to start, network fees covered for users, pay by card. Same on-chain security, your keys stay yours.' },
  { title: 'Expansion', items: 'Multichain, API & "Pay me with JoobEscrow" widget, receipts & invoices, PerShare pools that directly fund JoobEscrow deals.' },
  { title: 'JOOB governance', items: 'JOOB holders vote on protocol decisions: new categories, fee tiers, ecosystem grants. Off-chain votes first, then on-chain governance, and staked arbitrators.' },
];
// Repartition de l'offre fixe de 1 Md JOOB (MASTER_PROMPT §5). Les 13,5 M de bonus/parrainage
// du plafond presale (163,5 M) sont pris sur le marketing (decision du 30/09). onChain = vesting impose par un contrat deploye ; contract = VestingWallet OZ (deploye le 03/10/2026, beneficiaire Safe).
const TOKENOMICS = [
  { name: 'Presale', pct: 15, color: '#10b981', vesting: '20% at sale end, then linear over 180 days', onChain: true },
  { name: 'Presale bonus & referral', pct: 1.35, color: '#6ee7b7', vesting: 'Same vesting as the presale', onChain: true },
  { name: 'Ecosystem & usage', highlight: 'staking rewards', pct: 25, color: '#3b82f6', vesting: 'Distributed progressively over about 48 months, every transfer disclosed' },
  { name: 'Treasury (Safe)', pct: 13, color: '#8b5cf6', vesting: 'Locked until Jul 13, 2027, then linear over 36 months', onChain: true, contract: '0x8cbac3786F61572D4571C951e9215FC289FB2ff3' },
  { name: 'Team', pct: 12, color: '#f59e0b', vesting: 'Locked until Jan 13, 2028, then linear over 24 months', onChain: true, contract: '0xc430f8C4E26FFc25326C4AA84947B3e2A1328012' },
  { name: 'DEX liquidity', pct: 10, color: '#06b6d4', vesting: 'Paired at listing, LP locked 12 months or more' },
  { name: 'Marketing', pct: 6.65, color: '#ec4899', vesting: '10% at TGE, then 18 months' },
  { name: 'Partners & KOL', pct: 7, color: '#f97316', vesting: '3-month cliff, then 12 months, always disclosed' },
  { name: 'Airdrop (points)', pct: 5, color: '#eab308', vesting: '20% at TGE, then 6 months (audited contract)' },
  { name: 'CEX reserve', pct: 5, color: '#64748b', vesting: 'Used only for a centralized exchange listing' },
];
const TOTAL_SUPPLY = 1_000_000_000;
// Debut cumule de chaque segment, calcule une fois hors rendu.
const SEGMENTS = TOKENOMICS.map((t, i) => ({ ...t, start: TOKENOMICS.slice(0, i).reduce((a, x) => a + x.pct, 0) }));
const fmtM = (pct) => `${((TOTAL_SUPPLY * pct) / 100 / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;

function TokenomicsDonut() {
  const R = 15.9155; // circonference = 100
  return (
    <svg viewBox="0 0 42 42" className={styles.donut} role="img" aria-label="JOOB token allocation">
      <circle cx="21" cy="21" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      {SEGMENTS.map((t) => (
        <circle
            key={t.name}
            cx="21" cy="21" r={R} fill="none" stroke={t.color} strokeWidth="6"
            strokeDasharray={`${Math.max(t.pct - 0.3, 0.2)} ${100 - Math.max(t.pct - 0.3, 0.2)}`}
            strokeDashoffset={25 - t.start}
            className={styles.donutSeg}
          >
            <title>{`${t.name}: ${t.pct}% (${fmtM(t.pct)} JOOB)`}</title>
          </circle>
      ))}
    </svg>
  );
}

const STATUS_LABEL = { done: 'Done', now: 'In progress', next: 'Next' };

export default function PresalePage() {
  return (
    <>
      <PresaleClient />
      <div className={styles.page} style={{ paddingTop: 0 }}>
        <section className={styles.faq} id="tokenomics">
          <h2 className={styles.faqTitle}>Tokenomics</h2>
          <div className={styles.tokenomics}>
            <div className={styles.donutWrap}>
              <TokenomicsDonut />
              <div className={styles.donutCenter}>
                <strong>1,000,000,000</strong>
                <span>JOOB · fixed supply</span>
              </div>
            </div>
            <ul className={styles.allocList}>
              {TOKENOMICS.map((t) => (
                <li key={t.name} className={styles.allocItem}>
                  <span className={styles.allocDot} style={{ background: t.color }} />
                  <div className={styles.allocBody}>
                    <div className={styles.allocHead}>
                      <span className={styles.allocName}>{t.name}{t.highlight && <span className={styles.allocIncl}> (incl. <strong>{t.highlight}</strong>)</span>}</span>
                      <span className={styles.allocPct}>{t.pct}%</span>
                    </div>
                    <div className={styles.allocMeta}>
                      {fmtM(t.pct)} JOOB · {t.vesting}
                      {t.contract ? (
                        <a href={`https://bscscan.com/address/${t.contract}`} target="_blank" rel="noopener noreferrer" className={`${styles.allocTag} ${styles.allocTagOn}`}>
                          Locked on-chain ↗
                        </a>
                      ) : (
                        <span className={`${styles.allocTag} ${t.onChain ? styles.allocTagOn : ''}`}>
                          {t.onChain ? 'Enforced on-chain' : 'Planned'}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className={styles.fine}>
            Fixed supply, no mint function, no transfer tax. Presale tokens that are not sold are returned to the Safe and burned in a public, verifiable transaction after the sale.
            &quot;Enforced on-chain&quot; means the vesting is held by the deployed, audited presale contract; &quot;Planned&quot;
            allocations stay in the JoobEscrow Safe multisig until their vesting contracts are deployed.
          </p>
          <p className={styles.commitment}>
            <strong>Transparency commitment:</strong> allocations not yet in a vesting contract stay in our 3-of-5 Safe
            multisig. Every outgoing JOOB transfer from the Safe is publicly disclosed with its purpose and transaction
            link. Tokens allocated to partners are locked in their own on-chain vesting contract.
          </p>
        </section>

        <section className={styles.faq} id="ecosystem">
          <h2 className={styles.faqTitle}>The Joob ecosystem</h2>
          <p className={styles.ecoLead}>Two building blocks, one token.</p>
          <div className={styles.ecoGrid}>
            <div className={styles.ecoCard}>
              <span className={styles.ecoTag}>1 → 1</span>
              <h3>JoobEscrow</h3>
              <p>Secures a deal between two parties: funds stay locked on-chain until the work is approved. Live and audited.</p>
            </div>
            <div className={styles.ecoCard}>
              <span className={styles.ecoTag}>Many → 1 goal</span>
              <h3>PerShare</h3>
              <p>A collective pool: up to 50 members fund one goal, the group validates together, or everyone is refunded automatically.
                An advanced proof of concept, live on BNB Chain and{' '}
                <a href="https://spywolf.co/audits/PerShare_Audit.pdf" target="_blank" rel="noopener noreferrer" className={styles.link}>audited by SpyWolf</a>.{' '}
                <a href="https://www.pershare.org" target="_blank" rel="noopener noreferrer" className={styles.link}>pershare.org ↗</a></p>
            </div>
            <div className={styles.ecoCard}>
              <span className={styles.ecoTag}>One token</span>
              <h3>JOOB</h3>
              <p>Powers both: governance, fee tiers and staking on JoobEscrow, and 0% fees on PerShare for holders above a threshold
                (from the TGE). Next step: PerShare pools that directly fund a JoobEscrow escrow.</p>
            </div>
          </div>
        </section>

        <section className={styles.faq} id="roadmap">
          <h2 className={styles.faqTitle}>Roadmap</h2>
          <ol className={styles.roadmap}>
            {ROADMAP.map((phase, i) => (
              <li key={phase.title} className={`${styles.phase} ${phase.status ? styles[`phase_${phase.status}`] : ''}`}>
                <div className={styles.phaseHead}>
                  <span className={styles.phaseNum}>{i + 1}</span>
                  <span className={styles.phaseTitle}>{phase.title}</span>
                  {phase.status && <span className={styles.phaseTag}>{STATUS_LABEL[phase.status]}</span>}
                </div>
                <p>{phase.items}</p>
              </li>
            ))}
          </ol>
          <p className={styles.fine}>
            Every new contract version is audited before launch. Phases after the presale have no fixed date: they depend on
            development, audits and adoption, and may change.
          </p>
        </section>

        <section className={styles.faq} id="faq">
          <h2 className={styles.faqTitle}>JOOB token FAQ</h2>
          {FAQ.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
          <p className={styles.fine}>
            Read the full <Link href="/presale-terms" className={styles.link}>Presale Terms</Link> and
            the <Link href="/risks" className={styles.link}>Risks &amp; Disclaimers</Link> before participating.
          </p>
        </section>
      </div>
    </>
  );
}

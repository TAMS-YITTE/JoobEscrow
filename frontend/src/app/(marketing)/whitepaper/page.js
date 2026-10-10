import Link from 'next/link';
import styles from './whitepaper.module.css';
import PrintButton from './PrintButton';
import CoFundedEscrowDiagram from '../../../components/CoFundedEscrowDiagram';
import { AUDITS, KYC_URL, PRESALE_ADDRESSES, PLANNED_LISTING_PRICE } from '../../../config/presale';
import { ROADMAP_STEPS, ROADMAP_STATUS_LABEL } from '../../../config/roadmap';
import { TOKENOMICS, TOKENOMICS_SEGMENTS, fmtM } from '../../../config/tokenomics';

export const metadata = {
  title: 'Whitepaper | JoobEscrow',
  description: 'How JoobEscrow secures payments between clients and freelancers, its security model, the JOOB token, tokenomics and presale.',
  alternates: { canonical: '/whitepaper' },
};

// Faits repris du code, des contrats et des pages publiques (verifies le 03/10/2026, revus le 08/10/2026).
const VESTING_TREASURY = '0x8cbac3786F61572D4571C951e9215FC289FB2ff3';
const VESTING_TEAM = '0xc430f8C4E26FFc25326C4AA84947B3e2A1328012';
const STAKING = '0x7949528182876027b1F4B2e43E3a46eb2dADD32b';

const SECTIONS = [
  ['problem', 'The problem'],
  ['solution', 'The solution: on-chain escrow'],
  ['fees', 'Fees'],
  ['security', 'Security model'],
  ['token', 'The JOOB token'],
  ['ecosystem', 'The Joob ecosystem'],
  ['tokenomics', 'Tokenomics'],
  ['presale', 'Presale'],
  ['funds', 'Use of funds'],
  ['roadmap', 'Roadmap'],
  ['contracts', 'Contracts'],
  ['risks', 'Risks & legal notice'],
];

const FLOW = [
  ['Create & fund', 'The client locks the payment in the contract.'],
  ['Accept', 'The provider accepts the deal. Before acceptance, the client can cancel for a full refund.'],
  ['Release', 'When the work is approved, the client releases the funds.'],
  ['Timeout', 'If the client stays silent after the deadline, the provider can claim the payment.'],
  ['Withdraw', 'Each party withdraws what it is owed (pull payments), at any time, even if the contract is paused.'],
];

const USE_OF_FUNDS = [
  ['PancakeSwap liquidity', 40, `JOOB/stablecoin pool at the $${PLANNED_LISTING_PRICE} listing price, LP locked 12 months or more`],
  ['Product development', 30, 'Escrow V5, PerShare V2 and the co-funded escrow, the Web2-simple layer'],
  ['Audits & security', 10, 'Audits of Escrow V5 and PerShare V2, bug bounty, monitoring'],
  ['Growth', 10, 'KOL campaigns, listings, partnerships'],
  ['Operations & reserve', 10, 'Infrastructure, legal, contingencies'],
];

const STEP_CLASS = { done: styles.stepDone, now: styles.stepNow, next: styles.stepNext };
const STATUS_CLASS = { done: styles.statusDone, now: styles.statusNow, next: styles.statusNext };

const CONTRACTS = [
  ['JOOB token', PRESALE_ADDRESSES.TOKEN, 'token'],
  ['Presale', PRESALE_ADDRESSES.PRESALE, 'address'],
  ['Safe multisig (3-of-5)', PRESALE_ADDRESSES.SAFE, 'address'],
  ['Staking (opens after the TGE)', STAKING, 'address'],
  ['Treasury vesting', VESTING_TREASURY, 'address'],
  ['Team vesting', VESTING_TEAM, 'address'],
];

function Section({ id, n, title, className = '', children }) {
  return (
    <section id={id} className={`${styles.section} ${className}`}>
      <div className={styles.sectionHead}>
        <span className={styles.num}>{String(n).padStart(2, '0')}</span>
        <h2 className={styles.h2}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Ext({ href, children }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>{children}</a>;
}

function TokenomicsDonut() {
  const R = 15.9155; // circonference = 100
  return (
    <svg viewBox="0 0 42 42" width="240" height="240" role="img" aria-label="JOOB token allocation">
      <circle cx="21" cy="21" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      {TOKENOMICS_SEGMENTS.map((t) => {
        const len = Math.max(t.pct - 0.3, 0.2);
        return (
          <circle key={t.name} cx="21" cy="21" r={R} fill="none" stroke={t.color} strokeWidth="5"
            strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={25 - t.start}>
            <title>{`${t.name}: ${t.pct}% (${fmtM(t.pct)} JOOB)`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

export default function WhitepaperPage() {
  const sec = (id) => SECTIONS.findIndex(([s]) => s === id) + 1;
  const title = (id) => SECTIONS.find(([s]) => s === id)[1];
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.badge}><span className={styles.badgeDot} />Whitepaper · v1.1 · October 2026</span>
        <h1 className={styles.title}>JoobEscrow <span className={styles.gradient}>Whitepaper</span></h1>
        <p className={styles.lead}>
          An audited escrow contract on BNB Chain that holds payments until the work is approved, and the JOOB token that powers its ecosystem.
        </p>
        <p className={styles.note}>In case of discrepancy, the on-chain parameters of the contracts prevail.</p>
        <div className={styles.heroActions}>
          <PrintButton />
          <Link href="/presale" className="btn btn-primary">Join the presale</Link>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}><div className={`${styles.statVal} ${styles.gradient}`}>1B</div><div className={styles.statLabel}>Fixed supply</div></div>
          <div className={styles.stat}><div className={`${styles.statVal} ${styles.gradient}`}>0%</div><div className={styles.statLabel}>Client fee</div></div>
          <div className={styles.stat}><div className={`${styles.statVal} ${styles.gradient}`}>4</div><div className={styles.statLabel}>SpyWolf audits</div></div>
          <div className={styles.stat}><div className={`${styles.statVal} ${styles.gradient}`}>3/5</div><div className={styles.statLabel}>Safe multisig</div></div>
        </div>
      </header>

      <div className={styles.layout}>
        <nav className={styles.toc} aria-label="Contents">
          <div className={styles.tocTitle}>Contents</div>
          <ol>
            {SECTIONS.map(([id, label], i) => (
              <li key={id}><a href={`#${id}`}><span className={styles.tocNum}>{String(i + 1).padStart(2, '0')}</span>{label}</a></li>
            ))}
          </ol>
        </nav>

        <div className={styles.content}>
          <Section id="problem" n={sec('problem')} title={title('problem')}>
            <p className={styles.p}>
              Paying someone you have never met is a trust problem. The client fears paying for work that never arrives; the freelancer
              fears delivering work that is never paid. Marketplaces solve this by holding the money, but many keep 20–30% of the deal,
              control the funds and can freeze accounts. In Web3 deals (KOL campaigns, development, design, OTC), there is often no
              trusted middleman at all, and someone has to send first.
            </p>
          </Section>

          <Section id="solution" n={sec('solution')} title={title('solution')}>
            <p className={styles.p}>
              JoobEscrow replaces the middleman with an audited smart contract on BNB Smart Chain. The client&apos;s USDT or USDC is locked
              in the contract and released to the provider when the work is approved. Nobody, including JoobEscrow, can move escrowed
              funds outside the rules of the contract.
            </p>
            <div className={styles.grid}>
              {FLOW.map(([t, d], i) => (
                <div key={t} className={styles.card}>
                  <span className={styles.cardTag}>Step {i + 1}</span>
                  <div className={styles.cardTitle}>{t}</div>
                  <div className={styles.cardText}>{d}</div>
                </div>
              ))}
            </div>
            <p className={styles.p}>
              <strong>Disputes:</strong> either party can open a dispute and submit evidence. The JoobEscrow arbitration multisig can
              split the funds in any proportion from 0 to 100%. If a dispute is abandoned for 30 days, either party can trigger a 50/50
              split directly in the contract (resolveStaleDispute). Parties can talk through end-to-end encrypted
              wallet-to-wallet messaging (XMTP). Details: <Link href="/how-disputes-work" className={styles.link}>how disputes work</Link>.
            </p>
          </Section>

          <Section id="fees" n={sec('fees')} title={title('fees')}>
            <p className={styles.p}>
              The client pays 0%. The provider pays a fee of 10%, 8%, 5%, 3% or 2% depending on the category (one audited contract
              per tier), taken only on the amount the provider actually receives. Using JoobEscrow does not require the JOOB token. A $1 demo
              lets anyone run a real escrow between two of their own wallets: <Link href="/try" className={styles.link}>try it with $1</Link>.
            </p>
          </Section>

          <Section id="security" n={sec('security')} title={title('security')}>
            <div className={styles.grid}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Audited by SpyWolf</div>
                <div className={styles.cardText}>
                  <Ext href={AUDITS.ESCROW_V4}>Escrow V4</Ext>, <Ext href={AUDITS.TOKEN}>JOOB token</Ext>, <Ext href={AUDITS.PRESALE}>presale</Ext>,{' '}
                  <Ext href={AUDITS.STAKING}>staking</Ext>. An audit reduces risk but does not remove it.
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>3-of-5 Safe multisig</div>
                <div className={styles.cardText}>All contracts are verified on BscScan and owned by a 3-of-5 Safe multisig: no single person can act alone.</div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>2-day timelock</div>
                <div className={styles.cardText}>Fee, fee recipient and limit changes go through a public 2-day timelock.</div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Accounting invariant</div>
                <div className={styles.cardText}>The token recovery function can only move a surplus above locked funds plus amounts owed to users.</div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Pause without lock-in</div>
                <div className={styles.cardText}>The emergency pause stops new escrows and releases; withdrawals and dispute resolution keep working even when paused.</div>
              </div>
              {KYC_URL && (
                <div className={styles.card}>
                  <div className={styles.cardTitle}>KYC-verified founder</div>
                  <div className={styles.cardText}>
                    Founded by a builder with over 20 years in IT and finance and a focus on DeFi. Identity verified by SpyWolf (<Ext href={KYC_URL}>KYC certificate</Ext>); team tokens locked until January 2028.
                  </div>
                </div>
              )}
            </div>
            <p className={styles.p}>Full list of contracts and audit details: <Link href="/security#contracts" className={styles.link}>security page</Link>.</p>
          </Section>

          <Section id="token" n={sec('token')} title={title('token')}>
            <p className={styles.p}>
              JOOB is the BEP-20 utility token of the JoobEscrow ecosystem, with a fixed supply of 1,000,000,000: no mint function,
              no transfer tax. It is designed to be the key to the protocol:
            </p>
            <div className={styles.grid}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Governance</div>
                <div className={styles.cardText}>JOOB holders vote on protocol decisions such as new categories, fee tiers and ecosystem grants. Votes start off-chain and move to on-chain governance.</div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Fee reductions</div>
                <div className={styles.cardText}>Providers who stake JOOB pay lower fees, by tier, up to a full fee waiver at the highest tier (with Escrow V5). Staked tokens are locked while the benefit applies.</div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Staking</div>
                <div className={styles.cardText}>
                  Stake JOOB to earn JOOB rewards, distributed in 30-day periods from the ecosystem allocation, with a 7-day withdrawal delay.
                  Already deployed and <Ext href={AUDITS.STAKING}>audited by SpyWolf</Ext>; it opens after the TGE. Rewards depend on the
                  amounts funded and the total staked: no yield is guaranteed.
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>PerShare</div>
                <div className={styles.cardText}>JOOB holders above a threshold pay 0% fees on PerShare, our collective-pool app (from the TGE).</div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Visibility &amp; rewards</div>
                <div className={styles.cardText}>Boosts and badges paid in JOOB, affiliate rewards in JOOB, Early Escrow points.</div>
              </div>
            </div>
            <p className={styles.p}>
              These features ship progressively and are not guaranteed by a given date. JOOB gives no ownership, profit, dividend or
              revenue right in JoobEscrow, and the escrow service works without it.
            </p>
          </Section>

          <Section id="ecosystem" n={sec('ecosystem')} title={title('ecosystem')}>
            <p className={styles.p}>Two building blocks, one token.</p>
            <div className={styles.grid}>
              <div className={styles.card}>
                <span className={styles.cardTag}>1 → 1</span>
                <div className={styles.cardTitle}>JoobEscrow</div>
                <div className={styles.cardText}>Secures a deal between two parties; funds stay locked on-chain until the work is approved.</div>
              </div>
              <div className={styles.card}>
                <span className={styles.cardTag}>Many → 1 goal</span>
                <div className={styles.cardTitle}>PerShare</div>
                <div className={styles.cardText}>
                  A collective pool where up to 50 members fund one goal, the group validates together, or everyone is refunded automatically.
                  An advanced proof of concept, live on BNB Chain with three fee tiers (0.5%, 1%, 2%) and{' '}
                  <Ext href="https://spywolf.co/audits/PerShare_Audit.pdf">audited by SpyWolf</Ext> (<Ext href="https://www.pershare.org">pershare.org</Ext>).
                </div>
              </div>
              <div className={styles.card}>
                <span className={styles.cardTag}>One token</span>
                <div className={styles.cardTitle}>JOOB</div>
                <div className={styles.cardText}>
                  No second token and no second sale. JOOB powers governance, fee tiers and staking on JoobEscrow, and 0% fees on PerShare
                  above a holding threshold.
                </div>
              </div>
            </div>
            <p className={styles.p}>
              <strong>Co-funded escrow (planned).</strong> Several sponsors or community members pool funds on PerShare, and the pool opens a
              JoobEscrow escrow as one client. Funds stay locked until the work is delivered and approved by the group. If the deal is
              cancelled or a dispute goes the group&apos;s way, the refund returns to the pool and each member gets their pro-rata share, in the
              same currency. Planned with JoobEscrow V5 and PerShare V2; audited before launch.
            </p>
            <div className={styles.diagram}><CoFundedEscrowDiagram /></div>
          </Section>

          <Section id="tokenomics" n={sec('tokenomics')} title={title('tokenomics')}>
            <div className={styles.tokenomics}>
              <div className={styles.donutWrap}>
                <TokenomicsDonut />
                <div className={styles.donutCenter}>
                  <div className={`${styles.donutBig} ${styles.gradient}`}>1B</div>
                  <div className={styles.donutSmall}>JOOB · fixed supply</div>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Allocation</th><th>%</th><th>JOOB</th><th>Release</th></tr></thead>
                  <tbody>
                    {TOKENOMICS.map((t) => (
                      <tr key={t.name}>
                        <td><span className={styles.dot} style={{ background: t.color }} />{t.name}{t.highlight && <> (incl. <strong>{t.highlight}</strong>)</>}</td>
                        <td>{t.pct}%</td>
                        <td>{fmtM(t.pct)}</td>
                        <td>
                          {t.vesting}{' '}
                          {t.contract
                            ? <a href={`https://bscscan.com/address/${t.contract}`} target="_blank" rel="noopener noreferrer" className={styles.onChain}>locked on-chain ↗</a>
                            : t.onChain ? <span className={styles.onChain}>enforced on-chain</span> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className={styles.p}>
              <strong>Transparency commitment:</strong> allocations not yet in a vesting contract stay in our 3-of-5 Safe multisig.
              Every outgoing JOOB transfer from the Safe is publicly disclosed with its purpose and transaction link. Tokens allocated
              to partners are locked in their own on-chain vesting contract. 100% of unsold presale tokens are returned to the Safe and
              burned in a public, verifiable transaction after the sale.
            </p>
          </Section>

          <Section id="presale" n={sec('presale')} title={title('presale')}>
            <ul className={styles.list}>
              <li className={styles.li}>Opens October 15, 2026, 14:00 UTC; ends January 13, 2027, 13:59:59 UTC (up to 3 extensions of 20 days).</li>
              <li className={styles.li}>Price: $0.001 at start, +$0.0002 every 2 days, computed by the contract. Payment in USDT or USDC (BEP-20).</li>
              <li className={styles.li}>Sealed vault: the full cap of 163,500,000 JOOB was deposited before the sale could open, verifiable on BscScan.</li>
              <li className={styles.li}>Vesting for every buyer: 20% at sale end, then linear over 180 days. No soft cap, no refund.</li>
              <li className={styles.li}>Volume bonus 2% to 7% from $100 to $1,000 cumulative; referrers receive 2% of the tokens bought through their link.</li>
              <li className={styles.li}>Planned listing: JOOB/USDT pool on PancakeSwap at ${PLANNED_LISTING_PRICE}. After listing, the price is set by the market only.</li>
            </ul>
            <p className={styles.p}>Full rules: <Link href="/presale-terms" className={styles.link}>presale terms</Link> · <Link href="/presale" className={styles.link}>presale page</Link>.</p>
          </Section>

          <Section id="funds" n={sec('funds')} title={title('funds')}>
            <div className={styles.bars}>
              {USE_OF_FUNDS.map(([name, pct, text]) => (
                <div key={name}>
                  <div className={styles.barHead}><span>{name}</span><span className={styles.barPct}>{pct}%</span></div>
                  <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${pct}%` }} /></div>
                  <div className={styles.barText}>{text}</div>
                </div>
              ))}
            </div>
            <p className={styles.p}>
              Funds raised are held by our 3-of-5 Safe multisig and every outgoing transfer is disclosed. The DEX allocation of the
              tokenomics is a cap: liquidity is added at the listing price with the share of funds above, without any promise of depth.
            </p>
          </Section>

          <Section id="roadmap" n={sec('roadmap')} title={title('roadmap')}>
            <ol className={styles.timeline}>
              {ROADMAP_STEPS.map(({ title: t, status: st, items }) => (
                <li key={t} className={`${styles.step} ${st ? STEP_CLASS[st] : ''}`}>
                  <div className={styles.stepTitle}>
                    {t}
                    {st && <span className={`${styles.status} ${STATUS_CLASS[st]}`}>{ROADMAP_STATUS_LABEL[st]}</span>}
                  </div>
                  <div className={styles.stepText}>{items}</div>
                </li>
              ))}
            </ol>
            <p className={styles.p}>No dates are given beyond the presale: each step ships when it is ready and audited where needed.</p>
          </Section>

          <Section id="contracts" n={sec('contracts')} title={`${title('contracts')} (BNB Smart Chain)`}>
            <div className={styles.addrGrid}>
              {CONTRACTS.map(([label, address, path]) => (
                <a key={address} href={`https://bscscan.com/${path}/${address}`} target="_blank" rel="noopener noreferrer" className={styles.addr}>
                  <div className={styles.addrLabel}>{label}</div>
                  <div className={styles.addrValue}>{address}</div>
                </a>
              ))}
            </div>
            <p className={styles.p}>Escrow contracts per fee tier: <Link href="/security#contracts" className={styles.link}>security page</Link>.</p>
          </Section>

          <Section id="risks" n={sec('risks')} title={title('risks')} className={styles.warn}>
            <p className={styles.p}>
              Smart contracts can contain undiscovered bugs; blockchain transactions are irreversible; stablecoin issuers can freeze
              addresses; disputes are resolved by the JoobEscrow arbitration multisig; the value of JOOB can go down to zero and is not
              guaranteed by anyone. This document is not an offer of securities or investment advice. The presale is not open to
              residents of restricted jurisdictions listed in the presale terms. Read the full <Link href="/risks" className={styles.link}>risks &amp; disclaimers</Link> and{' '}
              <Link href="/presale-terms" className={styles.link}>presale terms</Link> before participating.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

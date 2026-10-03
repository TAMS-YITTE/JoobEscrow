import Link from 'next/link';
import styles from '../presale/presale.module.css';
import PrintButton from './PrintButton';
import { AUDITS, PRESALE_ADDRESSES, PLANNED_LISTING_PRICE } from '../../../config/presale';

export const metadata = {
  title: 'JoobEscrow Litepaper | On-chain escrow on BNB Chain',
  description: 'How JoobEscrow secures payments between clients and freelancers, its security model, the JOOB token, tokenomics and presale.',
  alternates: { canonical: '/whitepaper' },
};

// Faits repris du code, des contrats et des pages publiques (verifies le 03/10/2026).
const VESTING_TREASURY = '0x8cbac3786F61572D4571C951e9215FC289FB2ff3';
const VESTING_TEAM = '0xc430f8C4E26FFc25326C4AA84947B3e2A1328012';

const TOKENOMICS = [
  ['Presale', '15%', '150M', '20% at sale end, then linear over 180 days (presale contract)'],
  ['Presale bonus & referral', '1.35%', '13.5M', 'Same vesting as the presale (presale contract)'],
  ['Ecosystem & usage', '25%', '250M', 'Distributed progressively over about 48 months; every transfer disclosed'],
  ['Treasury', '13%', '130M', 'Locked until Jul 13, 2027, then linear over 36 months (vesting contract)'],
  ['Team', '12%', '120M', 'Locked until Jan 13, 2028, then linear over 24 months (vesting contract)'],
  ['DEX liquidity', '10%', '100M', 'Paired at listing, LP tokens locked 12 months or more'],
  ['Partners & KOL', '7%', '70M', '3-month cliff, then 12 months, always disclosed'],
  ['Marketing', '6.65%', '66.5M', '10% at TGE, then 18 months'],
  ['Airdrop (points)', '5%', '50M', '20% at TGE, then 6 months (audited airdrop contract)'],
  ['CEX reserve', '5%', '50M', 'Used only for a centralized exchange listing'],
];

const wrap = { maxWidth: 820, margin: '0 auto', padding: '48px 16px 64px' };
const h2 = { fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: '0 0 12px' };
const p = { color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 12 };
const li = { color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 6 };
const box = { background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '16px 20px' };
const th = { textAlign: 'left', padding: '8px 10px', color: '#fff', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' };
const td = { padding: '8px 10px', color: 'var(--text-secondary)', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' };

function Addr({ label, address, path = 'address' }) {
  return (
    <li style={li}>
      {label}:{' '}
      <a href={`https://bscscan.com/${path}/${address}`} target="_blank" rel="noopener noreferrer" className={styles.link} style={{ wordBreak: 'break-all' }}>
        {address}
      </a>
    </li>
  );
}

export default function WhitepaperPage() {
  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 800, color: '#fff', marginBottom: 8 }}>JoobEscrow Litepaper</h1>
      <p style={{ ...p, marginBottom: 20 }}><strong>Version 1.0 – October 2026.</strong> In case of discrepancy, the on-chain parameters of the contracts prevail.</p>
      <PrintButton />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, marginTop: 28 }}>
        <section>
          <h2 style={h2}>1. The problem</h2>
          <p style={p}>
            Paying someone you have never met is a trust problem. The client fears paying for work that never arrives; the freelancer
            fears delivering work that is never paid. Marketplaces solve this by holding the money, but many keep 20–30% of the deal,
            control the funds and can freeze accounts. In Web3 deals (KOL campaigns, development, design, OTC), there is often no
            trusted middleman at all, and someone has to send first.
          </p>
        </section>

        <section>
          <h2 style={h2}>2. The solution: on-chain escrow</h2>
          <p style={p}>
            JoobEscrow replaces the middleman with an audited smart contract on BNB Smart Chain. The client&apos;s USDT or USDC is locked
            in the contract and released to the provider when the work is approved. Nobody, including JoobEscrow, can move escrowed
            funds outside the rules of the contract.
          </p>
          <ol style={{ paddingLeft: 22 }}>
            <li style={li}><strong>Create &amp; fund:</strong> the client locks the payment in the contract.</li>
            <li style={li}><strong>Accept:</strong> the provider accepts the deal. Before acceptance, the client can cancel for a full refund.</li>
            <li style={li}><strong>Release:</strong> when the work is approved, the client releases the funds.</li>
            <li style={li}><strong>Timeout:</strong> if the client stays silent after the deadline, the provider can claim the payment.</li>
            <li style={li}><strong>Withdraw:</strong> each party withdraws what it is owed (pull payments), at any time, even if the contract is paused.</li>
          </ol>
          <p style={p}>
            <strong>Disputes:</strong> either party can open a dispute and submit evidence. The JoobEscrow arbitration multisig can
            split the funds in any proportion from 0 to 100%. If a dispute is abandoned for 30 days, either party can trigger a 50/50
            split directly in the contract, so funds are never locked forever. Parties can talk through end-to-end encrypted
            wallet-to-wallet messaging (XMTP). Details: <Link href="/how-disputes-work" className={styles.link}>how disputes work</Link>.
          </p>
        </section>

        <section>
          <h2 style={h2}>3. Fees</h2>
          <p style={p}>
            The client pays 0%. The provider pays a fee of 10%, 8%, 5%, 3% or 2% depending on the category (one audited contract
            per tier), taken only on the amount the provider actually receives. Using JoobEscrow never requires the JOOB token. A $1 demo lets anyone run a real escrow between two of their own
            wallets: <Link href="/try" className={styles.link}>try it with $1</Link>.
          </p>
        </section>

        <section>
          <h2 style={h2}>4. Security model</h2>
          <ul style={{ paddingLeft: 22 }}>
            <li style={li}>Audits by SpyWolf:{' '}
              <a href={AUDITS.ESCROW_V4} target="_blank" rel="noopener noreferrer" className={styles.link}>escrow V4</a>,{' '}
              <a href={AUDITS.TOKEN} target="_blank" rel="noopener noreferrer" className={styles.link}>JOOB token</a>,{' '}
              <a href={AUDITS.PRESALE} target="_blank" rel="noopener noreferrer" className={styles.link}>presale</a>. An audit reduces risk but does not remove it.
            </li>
            <li style={li}>All contracts are verified on BscScan and owned by a 3-of-5 Safe multisig: no single person can act alone.</li>
            <li style={li}>Fee, fee recipient and limit changes go through a public 2-day timelock.</li>
            <li style={li}>Accounting invariant: the contract balance always covers locked funds plus amounts owed to users.</li>
            <li style={li}>Emergency pause stops new escrows and releases, never withdrawals or dispute resolution.</li>
            <li style={li}>Full list of contracts and audit details: <Link href="/security#contracts" className={styles.link}>security page</Link>.</li>
          </ul>
        </section>

        <section>
          <h2 style={h2}>5. The JOOB token</h2>
          <p style={p}>
            JOOB is the BEP-20 utility token of the JoobEscrow ecosystem, with a fixed supply of 1,000,000,000: no mint function,
            no transfer tax. Planned uses include boosts and badges on JoobEscrow, affiliate rewards in JOOB, Early Escrow points
            and advisory community votes; a limited fee discount paid in JOOB may follow in a later version of the escrow contracts.
            JOOB gives no ownership, profit, dividend or revenue right in JoobEscrow, and the escrow service works without it.
          </p>
        </section>

        <section>
          <h2 style={h2}>6. Tokenomics</h2>
          <div style={{ ...box, padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead><tr><th style={th}>Allocation</th><th style={th}>%</th><th style={th}>JOOB</th><th style={th}>Release</th></tr></thead>
              <tbody>
                {TOKENOMICS.map(([name, pct, amount, rule]) => (
                  <tr key={name}><td style={td}>{name}</td><td style={td}>{pct}</td><td style={td}>{amount}</td><td style={td}>{rule}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...p, marginTop: 12 }}>
            <strong>Transparency commitment:</strong> allocations not yet in a vesting contract stay in our 3-of-5 Safe multisig.
            Every outgoing JOOB transfer from the Safe is publicly disclosed with its purpose and transaction link. Tokens allocated
            to partners are locked in their own on-chain vesting contract. 100% of unsold presale tokens are returned to the Safe and
            burned in a public, verifiable transaction after the sale.
          </p>
        </section>

        <section>
          <h2 style={h2}>7. Presale</h2>
          <ul style={{ paddingLeft: 22 }}>
            <li style={li}>Opens October 15, 2026, 14:00 UTC; ends January 13, 2027, 13:59:59 UTC (up to 3 extensions of 20 days).</li>
            <li style={li}>Price: $0.001 at start, +$0.0002 every 2 days, computed by the contract. Payment in USDT or USDC (BEP-20).</li>
            <li style={li}>Sealed vault: the full cap of 163,500,000 JOOB was deposited before the sale could open, verifiable on BscScan.</li>
            <li style={li}>Vesting for every buyer: 20% at sale end, then linear over 180 days. No soft cap, no refund.</li>
            <li style={li}>Volume bonus 2% to 7% from $100 to $1,000 cumulative; referrers receive 2% of the tokens bought through their link.</li>
            <li style={li}>Planned listing: JOOB/USDT pool on PancakeSwap at ${PLANNED_LISTING_PRICE}. After listing, the price is set by the market only.</li>
          </ul>
          <p style={p}>Full rules: <Link href="/presale-terms" className={styles.link}>presale terms</Link> · <Link href="/presale" className={styles.link}>presale page</Link>.</p>
        </section>

        <section>
          <h2 style={h2}>8. Roadmap</h2>
          <ol style={{ paddingLeft: 22 }}>
            <li style={li}><strong>Foundations (done):</strong> audited escrow contract, verified on BscScan, owned by a Safe multisig; 15 categories and encrypted chat.</li>
            <li style={li}><strong>Trust layer (now):</strong> $1 demo, shareable escrow links; next, public deal pages verifiable without a wallet, Telegram alerts, on-chain dispute evidence.</li>
            <li style={li}><strong>JOOB presale:</strong> October 15, 2026 → January 13, 2027.</li>
            <li style={li}><strong>TGE &amp; liquidity:</strong> PancakeSwap pool at ${PLANNED_LISTING_PRICE}, first JOOB utilities, Early Escrow points.</li>
            <li style={li}><strong>Escrow V5:</strong> on-chain affiliate rewards, gasless payouts, JOOB fee discount, verified reputation profiles (audit before deployment).</li>
            <li style={li}><strong>As easy as a Web2 app:</strong> email or social sign-in, no seed phrase to start, network fees covered, card payments.</li>
            <li style={li}><strong>Expansion &amp; community:</strong> multichain, API and widget, governance votes, staked arbitrators.</li>
          </ol>
          <p style={p}>No dates are given beyond the presale: each step ships when it is ready and audited where needed.</p>
        </section>

        <section>
          <h2 style={h2}>9. Contracts (BNB Smart Chain)</h2>
          <ul style={{ paddingLeft: 22 }}>
            <Addr label="JOOB token" address={PRESALE_ADDRESSES.TOKEN} path="token" />
            <Addr label="Presale" address={PRESALE_ADDRESSES.PRESALE} />
            <Addr label="Treasury vesting" address={VESTING_TREASURY} />
            <Addr label="Team vesting" address={VESTING_TEAM} />
            <Addr label="Safe multisig (3-of-5)" address={PRESALE_ADDRESSES.SAFE} />
            <li style={li}>Escrow contracts per fee tier: <Link href="/security#contracts" className={styles.link}>security page</Link>.</li>
          </ul>
        </section>

        <section>
          <h2 style={h2}>10. Risks &amp; legal notice</h2>
          <p style={p}>
            Smart contracts can contain undiscovered bugs; blockchain transactions are irreversible; stablecoin issuers can freeze
            addresses; disputes are resolved by the JoobEscrow arbitration multisig; the value of JOOB can go down to zero and is not
            guaranteed by anyone. This document is not an offer of securities or investment advice. The presale is not open to
            residents of restricted jurisdictions listed in the presale terms. Read the full <Link href="/risks" className={styles.link}>risks &amp; disclaimers</Link> and{' '}
            <Link href="/presale-terms" className={styles.link}>presale terms</Link> before participating.
          </p>
        </section>
      </div>
    </div>
  );
}

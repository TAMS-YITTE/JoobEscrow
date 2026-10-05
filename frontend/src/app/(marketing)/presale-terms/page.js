import Link from 'next/link';
import styles from '../presale/presale.module.css';

export const metadata = {
  title: 'JOOB Presale Terms | JoobEscrow',
  description: 'Terms and conditions of the JOOB token presale on BNB Smart Chain.',
  alternates: { canonical: '/presale-terms' },
};

const PRESALE = '0xd3F3598Ff8efB2cF6643488e66e8df683804F63d';
const TOKEN = '0x4bf3D2a4d88109bBb6340f3f1B88bD0Aa17c10E2';

const box = { background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '16px 20px 16px 36px' };
const h2 = { fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 12 };
const p = { color: 'var(--text-secondary)', lineHeight: 1.7 };
const li = { color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 8 };

export default function PresaleTermsPage() {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 16px 64px' }}>
      <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 800, color: '#fff', marginBottom: 12 }}>JOOB Presale Terms &amp; Conditions</h1>
      <p style={{ ...p, marginBottom: 24 }}><strong>Version 1.2 – October 2026</strong></p>

      <div style={{ ...box, paddingLeft: 20, marginBottom: 40, borderColor: 'rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.08)' }}>
        <p style={{ ...p, color: '#bfdbfe', fontSize: '0.92rem' }}>
          <strong>Scope:</strong> these Terms apply to purchases made through the presale smart contract{' '}
          <a href={`https://bscscan.com/address/${PRESALE}#code`} target="_blank" rel="noopener noreferrer" className={styles.link} style={{ wordBreak: 'break-all' }}>{PRESALE}</a>{' '}
          selling the JOOB token{' '}
          <a href={`https://bscscan.com/token/${TOKEN}`} target="_blank" rel="noopener noreferrer" className={styles.link} style={{ wordBreak: 'break-all' }}>{TOKEN}</a>{' '}
          on BNB Smart Chain. Both contracts are verified on BscScan, owned by the JoobEscrow Safe multisig and audited by SpyWolf
          (<a href="https://spywolf.co/audits/VestingPresale_Airdrop_Audit_JoobEscrow.pdf" target="_blank" rel="noopener noreferrer" className={styles.link}>presale report</a>,{' '}
          <a href="https://spywolf.co/audits/StandardToken_Audit_JoobEscrow.pdf" target="_blank" rel="noopener noreferrer" className={styles.link}>token report</a>). In case of discrepancy, the
          on-chain parameters of the contract prevail.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <section>
          <h2 style={h2}>Preamble – Nature of the token</h2>
          <p style={p}>
            JOOB is a utility token of the JoobEscrow ecosystem. It confers no ownership, equity, dividend, profit-sharing, revenue or
            shareholder voting right in JoobEscrow or any legal entity, and no claim on the funds held in JoobEscrow escrows. Planned
            uses (protocol governance votes on product parameters, fee reductions for JOOB stakers up to a full fee waiver in a later
            contract version, boosts and badges, affiliate rewards) may change and are not guaranteed to be available at any given date.
          </p>
        </section>

        <section>
          <h2 style={h2}>Article 1 – Eligibility</h2>
          <ul style={box}>
            <li style={li}><strong>Access:</strong> open to adults (18+) with full legal capacity.</li>
            <li style={li}><strong>Restricted jurisdictions:</strong> residents of the United States, Canada, China, the United Kingdom, the member states of the European Union, and any country subject to international sanctions are excluded. By participating, you confirm you are not a resident of a restricted jurisdiction and are not acting on behalf of such a person. JoobEscrow cannot be held liable if a participant circumvents these restrictions (for example with a VPN).</li>
            <li style={li}><strong>Your responsibility:</strong> you are solely responsible for checking that your participation is legal where you live, and for any tax it triggers.</li>
          </ul>
        </section>

        <section>
          <h2 style={h2}>Article 2 – Price schedule and payment</h2>
          <ul style={box}>
            <li style={li}><strong>Start:</strong> October 15, 2026, 14:00 UTC, at <strong>0.001 USD</strong> per JOOB. The sale only opens once the multisig has started it on-chain after the full deposit (Article 3).</li>
            <li style={li}><strong>Increase:</strong> +0.0002 USD every 2 days from the start time. The applicable price is the one computed by the smart contract when your transaction is executed.</li>
            <li style={li}><strong>End:</strong> January 13, 2027, 13:59:59 UTC, unless the sale is extended (Article 3). If the cap is reached earlier, no further purchases are accepted; the sale still ends, and claims open, at the end time.</li>
            <li style={li}><strong>Payment:</strong> USDT or USDC (BEP-20) on BNB Smart Chain, only through the presale page. No minimum or maximum contribution. Network fees (BNB) are paid by the participant.</li>
            <li style={li}><strong>Slippage protection:</strong> if the price changes between your confirmation and the execution, the transaction is cancelled and nothing is charged.</li>
          </ul>
        </section>

        <section>
          <h2 style={h2}>Article 3 – Sale size, sealed vault and closing</h2>
          <ul style={box}>
            <li style={li}><strong>Cap:</strong> 163,500,000 JOOB, including purchased tokens, volume bonuses and referral rewards.</li>
            <li style={li}><strong>Sealed vault:</strong> the contract cannot open the sale before the full cap has been deposited in it; the deposit is verifiable at any time on BscScan.</li>
            <li style={li}><strong>Extensions:</strong> the sale may be extended at most 3 times, by 20 days each, at least 24 hours before the current end. Extensions are announced on official channels.</li>
            <li style={li}><strong>Closing:</strong> the sale ends at the end time (including any extension). Anyone can then execute the finalization on-chain, which opens the claims.</li>
            <li style={li}><strong>No soft cap, no refund:</strong> there is no minimum amount to raise. Funds raised are withdrawn by the JoobEscrow Safe multisig after the sale. Unsold tokens are returned to the same multisig and burned on-chain.</li>
          </ul>
        </section>

        <section>
          <h2 style={h2}>Article 4 – Vesting and claims</h2>
          <p style={p}>
            Your purchased tokens and bonuses are recorded on-chain immediately but cannot be claimed before the sale ends. At the end of the
            sale, <strong>20%</strong> become claimable, and the remaining 80% unlock linearly, second by second, over <strong>180 days</strong>.
            Claims are made from the presale page and cannot be paused.
          </p>
        </section>

        <section>
          <h2 style={h2}>Article 5 – Bonuses</h2>
          <ul style={box}>
            <li style={li}><strong>Volume bonus</strong>, based on your cumulative USDT + USDC contribution: from 100 USD: 2% · from 250 USD: 3.5% · from 500 USD: 5% · from 1,000 USD: 7% of the tokens you purchased. When you reach a higher tier, the bonus on your earlier purchases is topped up automatically.</li>
            <li style={li}><strong>Referral:</strong> the referrer receives 2% of the tokens purchased through their link, in JOOB. A wallet cannot refer itself.</li>
            <li style={li}>All bonuses follow the same vesting as purchased tokens and count toward the 163,500,000 JOOB cap.</li>
          </ul>
        </section>

        <section>
          <h2 style={h2}>Article 6 – After the sale</h2>
          <p style={p}>
            A JOOB/USDT liquidity pool on PancakeSwap is planned after the sale ends; its details will be announced on official channels beforehand.
            No listing on any exchange is guaranteed. Once trading starts, the price is set by the market alone: <strong>it is not guaranteed and may
            fall below your purchase price, down to zero.</strong>
          </p>
        </section>

        <section>
          <h2 style={h2}>Article 7 – No promise of return</h2>
          <p style={p}>
            JoobEscrow makes no promise of any price, return, yield or profit. Nothing on this website is investment, financial, legal or tax advice.
            Any decision to participate is yours alone.
          </p>
        </section>

        <section>
          <h2 style={h2}>Article 8 – Risks</h2>
          <p style={p}>
            Participation involves significant risks, including total loss of the funds contributed: market volatility, lack of liquidity, smart
            contract bugs or exploits, loss of wallet access, network failures, and regulatory changes. See also{' '}
            <Link href="/risks" className={styles.link}>Risks &amp; Disclaimers</Link>.
          </p>
        </section>

        <section>
          <h2 style={h2}>Article 9 – No withdrawal right</h2>
          <p style={p}>
            Because blockchain transactions are irreversible, no withdrawal or cancellation right applies once a purchase is executed.
          </p>
        </section>

        <section>
          <h2 style={h2}>Article 10 – Liability</h2>
          <p style={p}>
            To the extent permitted by law, JoobEscrow shall not be liable for losses resulting from user error, wallet security flaws, phishing,
            network failures, smart contract exploits, or regulatory changes in the participant&apos;s jurisdiction.
          </p>
        </section>

        <section>
          <h2 style={h2}>Article 11 – Governing law and disputes</h2>
          <p style={p}>
            Any dispute shall first be subject to an attempt at amicable resolution by writing to contact@joobescrow.com. If no agreement is reached
            within 30 days, the dispute shall be settled by arbitration under the ICC Rules.
          </p>
        </section>
      </div>

      <div style={{ marginTop: 48, textAlign: 'center' }}>
        <Link href="/presale" className="btn btn-primary">Back to the presale</Link>
      </div>
    </div>
  );
}

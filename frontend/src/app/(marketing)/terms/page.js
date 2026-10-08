import Link from 'next/link';
import styles from '../whitepaper/whitepaper.module.css';

export const metadata = {
  title: 'Terms of Service | JoobEscrow',
  description: 'Terms of Service and legal information for the JoobEscrow protocol.',
  alternates: { canonical: '/terms' },
};

function Section({ n, title, className = '', children }) {
  return (
    <section className={`${styles.section} ${className}`}>
      <div className={styles.sectionHead}>
        <span className={styles.num}>{String(n).padStart(2, '0')}</span>
        <h2 className={styles.h2}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className={styles.page} style={{ maxWidth: 860 }}>
      <header className={styles.hero}>
        <span className={styles.badge}><span className={styles.badgeDot} />Legal · Last updated October 2026</span>
        <h1 className={styles.title}>Terms of <span className={styles.gradient}>Service</span></h1>
        <p className={styles.lead}>
          The rules for using the JoobEscrow interface and its escrow contracts. The JOOB presale is governed by separate{' '}
          <Link href="/presale-terms" className={styles.link}>Presale Terms</Link>.
        </p>
      </header>

      <div className={styles.content}>
        <Section n={1} title="Nature of the Service (Non-Custodial)">
          <p className={styles.p}><strong>Important:</strong> JoobEscrow is not a bank, a payment institution, or a custodian of funds.</p>
          <p className={styles.p}>
            JoobEscrow provides a software interface to interact with smart contracts deployed on BNB Smart Chain. JoobEscrow, its
            executives and its employees cannot seize or move escrowed funds outside the rules defined in the verified, open-source
            contract code. In an emergency, the JoobEscrow Safe multisig can pause the creation and release of escrows; withdrawals of
            credited funds and dispute resolution keep working during a pause.
          </p>
        </Section>

        <Section n={2} title="Role of JoobEscrow: Third-Party Arbitrator">
          <p className={styles.p}>
            The platform acts exclusively as a technology provider and, where applicable, as a Third-Party Arbitrator (Dispute Resolver).
            When a dispute is declared by either party, the JoobEscrow arbitration multisig has the exclusive power to allocate the
            escrowed funds between the Client and the Provider, in any proportion from 0% to 100% (full refund, full payment or a split).
          </p>
          <p className={styles.p}>
            JoobEscrow is committed to analyzing delivery evidence impartially. The arbitration decision of JoobEscrow is final and binding.
            Details: <Link href="/how-disputes-work" className={styles.link}>how disputes work</Link>.
          </p>
        </Section>

        <Section n={3} title="Platform Fee">
          <p className={styles.p}>
            The use of the smart contract is subject to a service fee (Commission), automatically deducted by the smart contract from the
            amount the Provider receives. The Client pays no fee. Fees vary depending on the category used (2% to 10%), and the exact
            percentage is displayed before the funds are locked.
          </p>
        </Section>

        <Section n={4} title="Inherent Risks of Cryptocurrencies">
          <p className={styles.p}>
            The use of the blockchain involves technical and financial risks, including but not limited to the loss of private keys,
            extreme volatility of crypto-assets, and network congestion. JoobEscrow declines all liability for the loss of funds due to a
            user manipulation error. Funds must be deposited exclusively in the supported stablecoins (USDT or USDC on BNB Smart Chain).
            Full list: <Link href="/risks" className={styles.link}>risks &amp; disclaimers</Link>.
          </p>
        </Section>

        <Section n={5} title="Stale Disputes" className={styles.warn}>
          <p className={styles.p}>
            <strong>Warning:</strong> to avoid paralyzing funds, if a dispute is opened and no solution is found within 30 days, either
            party can trigger a 50/50 split directly in the smart contract to unlock the funds.
          </p>
        </Section>

        <Section n={6} title="Legality and Compliance">
          <p className={styles.p}>
            The JoobEscrow interface is a neutral tool. It is the strict responsibility of Users to ensure that the subject of their
            transaction is legal in their jurisdiction. JoobEscrow reserves the right to block access to its web interface to any IP
            address or wallet linked to illicit activities.
          </p>
        </Section>

        <Section n={7} title="Geographic Eligibility">
          <p className={styles.p}>
            You are entirely responsible for verifying whether the use of cryptocurrency and decentralized protocols is legal in your
            country of residence. Access to the interface is restricted or prohibited for users located in sanctioned jurisdictions. By
            using JoobEscrow, you represent and warrant that you are permitted to do so under your local laws.
          </p>
        </Section>

        <Section n={8} title="No Financial or Legal Advice">
          <p className={styles.p}>
            Information provided on the JoobEscrow platform, marketing materials, or communications does not constitute financial,
            investment, or legal advice. JoobEscrow is a non-custodial software service, and you use it entirely at your own risk.
          </p>
        </Section>
      </div>
    </div>
  );
}

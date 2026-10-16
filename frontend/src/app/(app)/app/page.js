import Link from 'next/link';
import { instances } from '../../../config/instances';
import styles from './hub.module.css';

export const metadata = {
  title: 'Launch App | JoobEscrow',
  description: 'Open a JoobEscrow escrow in your category: funds stay locked in an audited non-custodial contract on BNB Smart Chain until the work is approved, the deadline passes or a dispute is settled.',
  alternates: { canonical: '/app' },
};

// Les categories partagent un contrat par niveau de frais : on les presente regroupees par niveau,
// du plus bas au plus haut. Tout vient de config/instances.js (aucun pourcentage en dur).
function tiers() {
  const byFee = new Map();
  Object.values(instances).forEach((n) => {
    if (!byFee.has(n.feeTier)) byFee.set(n.feeTier, []);
    byFee.get(n.feeTier).push(n);
  });
  return [...byFee.entries()].sort((a, b) => a[0] - b[0]);
}

const TRUST = ['Audited by SpyWolf', 'Non-custodial', '3-of-5 Safe multisig', 'BNB Smart Chain'];

export default function HubPage() {
  return (
    <div className={styles.hub}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>JoobEscrow app</p>
        <h1 className={styles.title}>Choose your escrow</h1>
        <p className={styles.lead}>
          Pick the category that fits your deal. Funds stay locked in an audited contract until the work is approved,
          the deadline passes or a dispute is settled. The client pays no fee.
        </p>
        <ul className={styles.trust}>
          {TRUST.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </header>

      <Link href="/demo" className={styles.demo}>
        <div>
          <span className={styles.demoTag}>Demo</span>
          <h2>New here? Run a full escrow with $1</h2>
          <p>Between two of your own wallets, 1 to 20 USDT or USDC, 0% fee. You get back exactly what you deposit.</p>
        </div>
        <span className={styles.demoCta}>Start the demo <span aria-hidden="true">→</span></span>
      </Link>

      <section className={styles.tiers} aria-label="Categories by fee">
        {tiers().map(([fee, list]) => (
          <div key={fee} className={styles.tier}>
            <div className={styles.tierHead}>
              <span className={styles.tierFee}>{fee}%</span>
              <span className={styles.tierNote}>fee paid by the provider</span>
            </div>
            <div className={styles.grid}>
              {list.map((n) => (
                <Link key={n.slug} href={`/${n.slug}`} className={styles.card}>
                  <span className={styles.cardName}>{n.name}</span>
                  <span className={styles.cardRoles}>{n.lexicon.client} <span aria-hidden="true">↔</span> {n.lexicon.provider}</span>
                  <span className={styles.cardArrow} aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <p className={styles.foot}>
        Categories with the same fee share one audited contract. The fee of each escrow is recorded on-chain when it is created.
      </p>
    </div>
  );
}

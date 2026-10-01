import Link from 'next/link';
import PresaleClient from './PresaleClient';
import styles from './presale.module.css';

export const metadata = {
  title: 'JOOB Token Presale | JoobEscrow',
  description: 'JOOB token presale on BNB Smart Chain: public price schedule, sealed token vault and on-chain vesting, enforced by a verified smart contract.',
  alternates: { canonical: '/presale' },
};

const FAQ = [
  {
    q: 'What is JOOB?',
    a: 'JOOB is the BEP-20 token of the JoobEscrow ecosystem on BNB Smart Chain (fixed supply of 1,000,000,000). Planned uses include paying for boosts and badges on JoobEscrow, affiliate rewards in JOOB and advisory community votes; a limited fee discount paid in JOOB may follow in a later version of the escrow contracts. JOOB gives no ownership, profit or revenue right in JoobEscrow. Using JoobEscrow escrows never requires JOOB.',
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
    q: 'How do the volume bonus and referral work?',
    a: 'The volume bonus depends on your cumulative USDT + USDC contribution: 2% from $100, 3.5% from $250, 5% from $500 and 7% from $1,000, applied to all the tokens you bought (earlier purchases are topped up automatically). A referrer receives 2% of the tokens bought through their link. Bonuses follow the same vesting and count toward the cap.',
  },
  {
    q: 'What happens to unsold tokens and to the funds raised?',
    a: 'After the sale, unsold tokens are returned to the JoobEscrow Safe multisig and burned on-chain. The stablecoins raised are withdrawn by the same multisig. There is no soft cap and no refund.',
  },
  {
    q: 'Will JOOB be tradable after the sale?',
    a: 'A JOOB/USDT pool on PancakeSwap is planned after the sale ends; its details will be announced on official channels beforehand. Once trading starts, the price is set by the market alone: it is not guaranteed and may be lower than the price you paid. Only contribute what you can afford to lose.',
  },
  {
    q: 'Who can participate?',
    a: 'Only adults who are not residents of a restricted jurisdiction listed in the Presale Terms. You are responsible for checking that participation is legal where you live.',
  },
];

// Feuille de route publique : aucune date au-dela de la presale (rien de signe ni planifie).
const ROADMAP = [
  { title: 'Foundations', status: 'done', items: 'Audited escrow contract, verified on BscScan, owned by a Safe multisig. 15 categories and encrypted in-app chat.' },
  { title: 'Trust layer', status: 'now', items: 'Public deal pages, "verify in 30 seconds" guide, $5 demo, proof page, Telegram notification bot, on-chain dispute evidence.' },
  { title: 'JOOB presale', status: 'next', items: 'October 15, 2026 → January 13, 2027. Sealed vault, vesting for every participant, unsold tokens burned.' },
  { title: 'TGE & liquidity', items: 'JOOB/USDT pool on PancakeSwap, first JOOB utilities (boosts & badges), Early Escrow points.' },
  { title: 'Escrow V5', items: 'On-chain affiliate rewards, gasless payouts, JOOB fee discount, verified reputation profiles.' },
  { title: 'Escrow V5.1', items: 'Milestone payments, partial releases, amicable settlement, bulk deals for agencies.' },
  { title: 'Expansion', items: 'Multichain, card payments, API & "Pay me with JoobEscrow" widget, receipts & invoices.' },
  { title: 'Community', items: 'Governance votes, staked arbitrators.' },
];
const STATUS_LABEL = { done: 'Done', now: 'In progress', next: 'Next' };

export default function PresalePage() {
  return (
    <>
      <PresaleClient />
      <div className={styles.page} style={{ paddingTop: 0 }}>
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

import Link from 'next/link';
import styles from './try.module.css';
import { CONTRACT_DEMO } from '../../../config/instances';

export const metadata = {
  title: 'Try JoobEscrow with $1 | JoobEscrow',
  description: 'Run a full on-chain escrow between two of your own wallets with 1 to 20 USDT or USDC. 0% fee, audited contract, owned by a Safe multisig.',
  alternates: { canonical: '/try' },
};

const STEPS = [
  {
    who: 'Wallet A (client)',
    title: 'Create & fund the escrow',
    text: 'Open the demo, connect wallet A, click "Create Secure Transaction", paste the address of wallet B as provider and enter 1 USDT or USDC. Your wallet asks you to approve exactly that amount, then to create the escrow.',
  },
  {
    who: 'Anyone',
    title: 'Verify it on BscScan',
    text: 'Open the demo contract on BscScan → "Read Contract" → getEscrowDetails with your escrow number. You see the amount locked, the client and the provider address. No wallet needed: this is read-only.',
  },
  {
    who: 'Wallet B (provider)',
    title: 'Accept the escrow',
    text: 'Switch to wallet B and accept the escrow (one transaction). The provider never signs a spending approval: nothing can be drained from this wallet.',
  },
  {
    who: 'Wallet A (client)',
    title: 'Release the funds',
    text: 'Switch back to wallet A and release the funds, as you would once the work is delivered.',
  },
  {
    who: 'Wallet B (provider)',
    title: 'Withdraw',
    text: 'Switch to wallet B and click "Claim". The exact amount you deposited arrives in wallet B: 0% fee on the demo.',
  },
  {
    who: 'Optional',
    title: 'Try a dispute',
    text: 'Create a second demo escrow and open a dispute instead of releasing, to see how arbitration works.',
  },
];

export default function TryPage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.badge}><span className={styles.badgeDot} />Demo</span>
        <h1 className={styles.title}>Try JoobEscrow <span className={styles.gradient}>with $1</span></h1>
        <p className={styles.lead}>
          Live the full escrow cycle in about 10 minutes, with your own money moving between two of your own wallets.
          Same audited contract as real deals, 0% fee, amounts capped at 20.
        </p>
        <div className={styles.chips}>
          <a href={`https://bscscan.com/address/${CONTRACT_DEMO}`} target="_blank" rel="noopener noreferrer" className={`${styles.chip} ${styles.chipOk}`}>
            Demo contract on BscScan ↗
          </a>
          <Link href="/security" className={styles.chip}>Audit & Safe multisig</Link>
        </div>
      </header>

      <div className={styles.card}>
        <h2 className={styles.h2}>What you need</h2>
        <ul className={styles.needs}>
          <li>Two wallets on BNB Smart Chain (e.g. two accounts in the same wallet app)</li>
          <li>1 to 20 USDT or USDC (BEP-20) on wallet A</li>
          <li>About 0.001 BNB (less than $1) on each wallet for gas — the whole demo usually costs a few cents</li>
        </ul>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((s, i) => (
          <li key={s.title} className={styles.step}>
            <span className={styles.stepNum}>{i + 1}</span>
            <div className={styles.stepHead}>
              <span className={styles.stepTitle}>{s.title}</span>
              <span className={styles.who}>{s.who}</span>
            </div>
            <p className={styles.stepText}>{s.text}</p>
          </li>
        ))}
      </ol>

      <div className={styles.ctaWrap}>
        <Link href="/demo" className={`btn btn-primary btn-lg ${styles.cta}`}>
          Open the demo
        </Link>
      </div>

      <p className={styles.fine}>
        Demo escrows are never counted in JoobEscrow statistics or volume. The demo contract only accepts 1 to 20 USDT or USDC per escrow.
        Only use joobescrow.com, and never share your seed phrase.
      </p>
    </div>
  );
}

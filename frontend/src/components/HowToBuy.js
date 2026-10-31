import styles from './HowToBuy.module.css';

// Etapes d'achat du JOOB (accueil). La page /presale reste reservee a l'achat.
const STEPS = [
  ['Connect wallet', 'MetaMask, Trust Wallet, Rabby and 700+ wallets via Reown.'],
  ['Pick token & amount', 'Click the token in "You pay" and enter an amount: your JOOB are shown before you confirm.'],
  ['Confirm', 'Approve and buy in your wallet. Your allocation is recorded on-chain.'],
];

export default function HowToBuy() {
  return (
    <section className={styles.buySteps} id="how-to-buy" aria-label="How to buy JOOB">
      <div className={styles.buyStepsHead}>
        <span className={styles.buyStepsTag}>PRESALE PARTICIPATION</span>
        <h2 className={styles.buyStepsTitle}>How to buy $JOOB</h2>
        <p className={styles.buyStepsSub}>Pay with stablecoins or native coins from 7 EVM networks.</p>
      </div>
      <div className={styles.buyStepsGrid}>
        {STEPS.map(([t, d], i) => (
          <div key={t} className={styles.buyStepCard}>
            <span className={styles.buyStepNum}>STEP {String(i + 1).padStart(2, '0')}</span>
            <h3 className={styles.buyStepName}>{t}</h3>
            <p className={styles.buyStepText}>{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

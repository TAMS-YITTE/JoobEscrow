import Link from 'next/link';
import styles from '../marketing.module.css';
import AirdropClient from './AirdropClient';
import ZEALY from '../../../config/airdrop/zealy.json';

export const metadata = {
  title: 'JOOB Airdrop | JoobEscrow',
  description: 'JOOB airdrop rewards: check if your wallet is on the list. Zealy Genesis & Launch Sprints, 10 JOOB per XP, delivered at TGE with vesting.',
  alternates: { canonical: '/airdrop' },
};

export default function AirdropPage() {
  return (
    <div className={styles.section} style={{ paddingTop: '56px', paddingBottom: '90px' }}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>JOOB AIRDROP</span>
          <h1 className={styles.sectionTitle}>Airdrop rewards</h1>
        </div>

        <AirdropClient campaign={ZEALY} />

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: 28, lineHeight: 1.6 }}>
          Rewards come from the Airdrop allocation (5% of supply, see <Link href="/tokenomics" className="text-gradient font-bold">Tokenomics</Link>):
          20% at TGE, then linear over 6 months. Nothing to claim before the TGE.
          <br />
          We never DM first and will never ask you to send tokens or your seed phrase to receive a reward.
        </p>
      </div>
    </div>
  );
}

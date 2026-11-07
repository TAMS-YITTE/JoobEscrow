import Link from 'next/link';
import styles from '../marketing.module.css';
import AirdropClient from './AirdropClient';
import FLASH_WEEKEND from '../../../config/airdrop/flash-weekend.json';
import ZEALY from '../../../config/airdrop/zealy.json';
import MEME_CONTEST from '../../../config/airdrop/meme-contest.json';

// Campagnes publiees, la plus recente en premier (une liste figee par fichier).
const CAMPAIGNS = [MEME_CONTEST, FLASH_WEEKEND, ZEALY];

export const metadata = {
  title: 'JOOB Rewards | JoobEscrow',
  description: 'JOOB rewards: search your address to check your allocation from the Meme Contest, the Flash Weekend Bonus and the Zealy sprints, delivered at TGE with vesting.',
  alternates: { canonical: '/airdrop' },
};

export default function AirdropPage() {
  return (
    <div className={styles.section} style={{ paddingTop: '56px', paddingBottom: '90px' }}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>JOOB REWARDS</span>
          <h1 className={styles.sectionTitle}>Rewards &amp; airdrops</h1>
        </div>

        <AirdropClient campaigns={CAMPAIGNS} />

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: 28, lineHeight: 1.6 }}>
          Every reward is delivered at TGE with vesting, nothing to claim before. See <Link href="/tokenomics" className="text-gradient font-bold">Tokenomics</Link>.
          <br />
          We never DM first and will never ask you to send tokens or your seed phrase to receive a reward.
        </p>
      </div>
    </div>
  );
}

import PresaleClient from './PresaleClient';
import LegacyAnchorRedirect from './LegacyAnchorRedirect';
import styles from './presale.module.css';

export const metadata = {
  title: 'JOOB Token Presale | JoobEscrow',
  description: 'JOOB token presale on BNB Smart Chain: public price schedule, sealed token vault and on-chain vesting, enforced by a verified smart contract. Pay with USDT, USDC, BNB, ETH and more from 7 EVM networks.',
  alternates: { canonical: '/presale' },
  openGraph: {
    title: 'JOOB Presale | JoobEscrow',
    description: 'Opens October 15, 2026 at 14:00 UTC. Starts at $0.001, sealed token vault, on-chain vesting, contracts audited by SpyWolf.',
    url: 'https://www.joobescrow.com/presale',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JOOB Presale | JoobEscrow',
    description: 'Opens October 15, 2026 at 14:00 UTC. Starts at $0.001, sealed token vault, on-chain vesting, contracts audited by SpyWolf.',
  },
};

export default function PresalePage() {
  return (
    <div className={styles.page}>
      <LegacyAnchorRedirect />
      <PresaleClient />
    </div>
  );
}

import Link from 'next/link';
import PresaleClient from './PresaleClient';
import LegacyAnchorRedirect from './LegacyAnchorRedirect';
import styles from './presale.module.css';

export const metadata = {
  title: 'JOOB Token Presale | JoobEscrow',
  description: 'JOOB token presale on BNB Smart Chain: public price schedule, sealed token vault and on-chain vesting, enforced by a verified smart contract. Pay with USDT, USDC, BNB, ETH and more from 7 EVM networks.',
  alternates: { canonical: '/presale' },
  openGraph: {
    title: 'JOOB Presale Live | JoobEscrow',
    description: 'Live now. The price rises every 2 days. Sealed token vault, on-chain vesting, contracts audited by SpyWolf. Pay from 7 EVM networks.',
    url: 'https://www.joobescrow.com/presale',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JOOB Presale Live | JoobEscrow',
    description: 'Live now. The price rises every 2 days. Sealed token vault, on-chain vesting, contracts audited by SpyWolf. Pay from 7 EVM networks.',
  },
};

export default function PresalePage() {
  return (
    <div className={styles.page}>
      <LegacyAnchorRedirect />
      <PresaleClient />
      <p className={styles.fineText} style={{ textAlign: 'center', padding: '0 16px 32px' }}>
        <Link href="/presale-terms">Presale Terms</Link> · <Link href="/risks">Risks</Link> · <Link href="/compliance">Compliance</Link> · Only official site: joobescrow.com
      </p>
    </div>
  );
}

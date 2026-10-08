import styles from './PartnerMarquee.module.css';

const PARTNERS = [
  { name: 'BNB Chain', role: 'Network', icon: '/logos/bnb-chain.svg', url: 'https://www.bnbchain.org' },
  { name: 'SpyWolf', role: 'Audit', icon: '/logos/spywolf.svg', url: 'https://spywolf.co/audits/Universal_Service_Escrow_V4_Audit.pdf' },
  { name: 'Safe', role: '3/5 Multisig', icon: '/logos/safe.svg', url: 'https://bscscan.com/address/0x872F979aa868145bE3c3A6EA787614BE2A18C7f7' },
  { name: 'Reown', role: 'WalletConnect', icon: '/logos/reown.svg', url: 'https://reown.com' },
  { name: 'XMTP', role: 'Encrypted Chat', icon: '/logos/xmtp.svg', url: 'https://xmtp.org' },
  { name: 'OpenZeppelin', role: 'Contracts', icon: '/logos/openzeppelin.svg', url: 'https://openzeppelin.com' },
  { name: 'BscScan', role: 'Verified', icon: '/logos/bscscan.svg', url: 'https://bscscan.com/address/0xd3F3598Ff8efB2cF6643488e66e8df683804F63d' },
  { name: 'PancakeSwap', role: 'Swap USDT/USDC', icon: '/logos/pancakeswap.svg', url: 'https://pancakeswap.finance/swap?outputCurrency=0x55d398326f99059fF775485246999027B3197955' },
  { name: 'BNB Bridge', role: 'Bridge', icon: '/logos/bnb-bridge.svg', url: 'https://www.bnbchain.org/en/bnb-chain-bridge' },
  { name: 'Zealy', role: 'Quests', icon: '/logos/zealy.svg', url: 'https://zealy.io/cw/joobescrow-0522' },
];

export default function PartnerMarquee() {
  return (
    <section className={styles.section} aria-label="Partners and Technologies">
      <div className={styles.legend}>
        BUILT ON · SECURED BY · POWERED BY
      </div>
      <div className={styles.marqueeWrap}>
        <div className={styles.track}>
          {PARTNERS.map((p, idx) => (
            <a key={`${p.name}-${idx}`} href={p.url} target="_blank" rel="noopener noreferrer" className={styles.item}>
              <img src={p.icon} alt="" width={20} height={20} className={styles.icon} />
              <span className={styles.name}>{p.name}</span>
              <span className={styles.role}>({p.role})</span>
            </a>
          ))}
          {/* Double track pour un défilement infini sans coupure */}
          {PARTNERS.map((p, idx) => (
            <a key={`${p.name}-dupe-${idx}`} href={p.url} target="_blank" rel="noopener noreferrer" className={styles.item} aria-hidden="true">
              <img src={p.icon} alt="" width={20} height={20} className={styles.icon} />
              <span className={styles.name}>{p.name}</span>
              <span className={styles.role}>({p.role})</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

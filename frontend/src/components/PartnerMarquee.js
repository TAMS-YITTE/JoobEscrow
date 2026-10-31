import styles from './PartnerMarquee.module.css';

// Rangee fixe de 4 logos (pas de defilement ni de doublon dans le DOM).
const PARTNERS = [
  { name: 'BNB Chain', role: 'Network', icon: '/logos/bnb-chain.svg', url: 'https://www.bnbchain.org' },
  { name: 'SpyWolf', role: 'Audit', icon: '/logos/spywolf.svg', url: 'https://spywolf.co/audits/Universal_Service_Escrow_V4_Audit.pdf' },
  { name: 'Safe', role: 'Multisig', icon: '/logos/safe.svg', url: 'https://bscscan.com/address/0x872F979aa868145bE3c3A6EA787614BE2A18C7f7' },
  { name: 'Reown', role: 'WalletConnect', icon: '/logos/reown.svg', url: 'https://reown.com' },
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
        </div>
      </div>
    </section>
  );
}

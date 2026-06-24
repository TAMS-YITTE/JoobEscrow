import Link from 'next/link';
import styles from '../marketing.module.css';
import dict from '../../../i18n/en.json';
import { ESCROW_ADDRESS } from '../../../config/contract';
import GovernanceTransparency from '../../../components/GovernanceTransparency';

export const metadata = {
  title: 'Security & Trust - Joob Escrow',
  description: 'Our decentralized escrow architecture and security model.',
};

export default function SecurityPage() {
  const d = dict.security;

  return (
    <div className={styles.section} style={{ maxWidth: '800px' }}>
      <h1 className={styles.heroTitle} style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{d.title}</h1>
      <p className={styles.heroSubtitle} style={{ fontSize: '1.1rem', textAlign: 'left', marginLeft: 0 }}>
        {d.subtitle}
      </p>

      <div className="glass-panel" style={{ marginTop: '40px', padding: '40px' }}>
        <h2 style={{ color: '#fff', marginBottom: '15px' }}>{d.auditSection.title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
          {d.auditSection.desc}
        </p>
        <Link href="/Universal_Service_Escrow_V4_Audit.pdf" target="_blank" className="btn btn-primary">
          View Audit Report (PDF)
        </Link>
      </div>

      <div className="glass-panel" style={{ marginTop: '30px', padding: '40px' }}>
        <h2 style={{ color: '#fff', marginBottom: '15px' }}>{d.contractSection.title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
          {d.contractSection.desc}
        </p>
        <div style={{ padding: '15px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '8px', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
          {ESCROW_ADDRESS}
        </div>
        <Link href={`https://bscscan.com/address/${ESCROW_ADDRESS}`} target="_blank" className="btn btn-outline" style={{ marginTop: '20px' }}>
          View on BscScan
        </Link>
      </div>

      <GovernanceTransparency />
    </div>
  );
}

import Link from 'next/link';
import styles from '../marketing.module.css';
import dict from '../../../i18n/en.json';
import { instances } from '../../../config/instances';
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
          {d.contractSection.desc} All contracts are <strong>Verified on BscScan</strong> and securely managed by a <strong>Gnosis Safe Multisig</strong> to ensure absolute transparency and trustless operations.
        </p>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>Treasury & Admin:</span>
          <Link href="https://app.safe.global/home?safe=bnb:0x872F979aa868145bE3c3A6EA787614BE2A18C7f7" target="_blank" className="hover:underline" style={{ color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Gnosis Safe (0x872F...C7f7) ↗
          </Link>
        </div>
        <div style={{ padding: '15px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '8px', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...new Set(Object.values(instances).map(i => i.contractAddress))].map((addr, idx) => {
             // Map address back to tier approximately for display
             const tierMap = {
               "0xD5B180580D183A7A9278118312207bc8a9C9f89E": "10% Tier",
               "0xa45f887b938a08B295A5b96b6559600632F09Ab0": "8% Tier",
               "0x56c2227E06dBC16062179Be397839b101a8e58c7": "5% Tier",
               "0x3EEEA456daCF2247CB0023a70923E60C3E13D6C3": "3% Tier",
               "0x7986Bd37C4DA6d1822958fCB97E7a284b40DD7Cc": "2% Tier"
             };
             const tierName = tierMap[addr] || "Custom Tier";
             return (
               <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingBottom: idx < 4 ? '10px' : '0' }}>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tierName}</span>
                   <span>{addr}</span>
                 </div>
                 <Link href={`https://bscscan.com/address/${addr}`} target="_blank" className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                   BscScan
                 </Link>
               </div>
             );
          })}
        </div>
      </div>

      <GovernanceTransparency />
    </div>
  );
}

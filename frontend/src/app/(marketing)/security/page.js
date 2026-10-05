import Link from 'next/link';
import styles from '../marketing.module.css';
import dict from '../../../i18n/en.json';
import { instances } from '../../../config/instances';
import GovernanceTransparency from '../../../components/GovernanceTransparency';
import { AUDITS, PRESALE_ADDRESSES } from '../../../config/presale';

// Resultats repris des rapports SpyWolf publies (relus le 2026-10-01 ; staking ajoute le 03/10).
const AUDIT_CARDS = [
  {
    title: 'Escrow contract (V4)',
    summary: '0 critical, 0 high. 1 medium and 2 low findings, all fixed and re-checked by SpyWolf. Same code on all 5 fee tiers listed below.',
    pdf: AUDITS.ESCROW_V4,
    bscscan: '#contracts',
    bscscanLabel: 'Contracts ↓',
  },
  {
    title: 'JOOB token',
    summary: 'Fixed supply of 1,000,000,000, no mint after deployment, no transfer tax. No critical, high or medium issue.',
    pdf: AUDITS.TOKEN,
    bscscan: `https://bscscan.com/address/${PRESALE_ADDRESSES.TOKEN}`,
    bscscanLabel: 'BscScan ↗',
  },
  {
    title: 'Presale vault',
    summary: 'Sealed vault, public price schedule, on-chain vesting for every buyer. No critical, high or medium issue.',
    pdf: AUDITS.PRESALE,
    bscscan: `https://bscscan.com/address/${PRESALE_ADDRESSES.PRESALE}`,
    bscscanLabel: 'BscScan ↗',
  },
  {
    title: 'JOOB staking',
    summary: 'Stake JOOB, earn JOOB in 30-day periods, 7-day withdrawal delay. Owned by the Safe multisig; opens after the TGE.',
    pdf: AUDITS.STAKING,
    bscscan: 'https://bscscan.com/address/0x7949528182876027b1F4B2e43E3a46eb2dADD32b',
    bscscanLabel: 'BscScan ↗',
  },
];

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

      <section style={{ marginTop: '40px' }}>
        <h2 style={{ color: '#fff', marginBottom: '8px' }}>{d.auditSection.title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>{d.auditSection.desc}</p>
        <div className={styles.auditGrid}>
          {AUDIT_CARDS.map((c) => (
            <div key={c.title} className={`glass-panel ${styles.auditCard}`}>
              <span className={styles.auditCardTag}>SpyWolf</span>
              <h3>{c.title}</h3>
              <p>{c.summary}</p>
              <div className={styles.auditCardLinks}>
                <a href={c.pdf} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Report (PDF)</a>
                <a href={c.bscscan} target="_blank" rel="noopener noreferrer" className="btn btn-outline">{c.bscscanLabel}</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div id="contracts" className="glass-panel" style={{ marginTop: '30px', padding: '40px' }}>
        <h2 style={{ color: '#fff', marginBottom: '15px' }}>{d.contractSection.title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
          {d.contractSection.desc} All contracts are <strong>Verified on BscScan</strong> and securely managed by a <strong>Gnosis Safe Multisig</strong> (3 of 5 signatures required for any admin action).
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

      {/* Official Protocol Addresses & Anti-Scam */}
      <div className="glass-panel" style={{ marginTop: '30px', padding: '40px' }}>
        <h2 style={{ color: '#fff', marginBottom: '10px' }}>Official Addresses & Anti-Scam Verification</h2>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', color: '#fca5a5', fontSize: '0.9rem' }}>
          <strong>Anti-Scam Notice:</strong> We never DM first. JoobEscrow team members will never ask for your private keys, seed phrases, or direct token transfers. Only trust addresses listed on this official page or verified on BscScan.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'JOOB Token', addr: PRESALE_ADDRESSES.TOKEN, note: 'Fixed 1B supply, no mint, no transfer tax' },
            { label: 'Presale Vault', addr: PRESALE_ADDRESSES.PRESALE, note: 'Sealed vault, linear 180-day vesting' },
            { label: 'Governance & Treasury Safe (3/5)', addr: '0x872F979aa868145bE3c3A6EA787614BE2A18C7f7', note: 'Gnosis Safe multisig (3 signatures required)' },
            { label: 'JOOB Staking', addr: '0x7949528182876027b1F4B2e43E3a46eb2dADD32b', note: 'Audited staking pool (opens post-TGE)' },
            { label: 'Treasury Vesting (36m)', addr: '0x8cbac3786F61572D4571C951e9215FC289FB2ff3', note: '130M JOOB on-chain vesting' },
            { label: 'Team Vesting (24m)', addr: '0xc430f8C4E26FFc25326C4AA84947B3e2A1328012', note: '120M JOOB locked until 2028' },
          ].map((item) => (
            <div key={item.addr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>{item.label}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{item.addr}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>{item.note}</div>
              </div>
              <Link href={`https://bscscan.com/address/${item.addr}`} target="_blank" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                BscScan ↗
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Presale On-Chain Permissions */}
      <div className="glass-panel" style={{ marginTop: '30px', padding: '40px' }}>
        <h2 style={{ color: '#fff', marginBottom: '10px' }}>Presale Smart Contract Permissions</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
          Administrative privileges on the presale smart contract (<code>VestingPresale.sol</code>) are strictly governed by the 3-of-5 Safe multisig. Contract code is immutable and verified on BscScan:
        </p>
        <ul className="list-disc pl-5 text-gray-400 space-y-2 text-sm leading-relaxed">
          <li><strong>Sale Activation (<code>start()</code>):</strong> Can only be triggered by the Safe strictly after <code>startTime</code> (15/10/2026 14:00 UTC). Any attempt prior to this exact timestamp is programmatically rejected by the contract.</li>
          <li><strong>Emergency Pause (<code>pause() / unpause()</code>):</strong> The Safe can pause new token purchases during operational emergencies. Pausing cannot freeze existing allocations or prevent user claim withdrawals.</li>
          <li><strong>Fund Withdrawals (<code>withdrawFunds()</code>):</strong> Raised USDT and USDC can only be withdrawn to the verified Safe multisig wallet (<code>owner()</code>). No arbitrary destination address is accepted.</li>
          <li><strong>Unsold Tokens (<code>withdrawUnsoldTokens()</code>):</strong> Only callable once the sale has concluded (<code>State.Ended</code>). The contract accurately computes investor debt, returning only excess unsold tokens to the Safe for permanent burn.</li>
          <li><strong>Rescue Guard (<code>rescueERC20()</code>):</strong> The owner cannot withdraw deposited JOOB tokens, USDT, or USDC under the guise of stuck tokens. Those core assets are explicitly locked out of rescue functions.</li>
          <li><strong>Public Functions (<code>finalize() & claim()</code>):</strong> Finalization is permissionless once the end date or cap is reached. Every participant directly and independently claims their vested allocation.</li>
        </ul>
      </div>

      <GovernanceTransparency />
    </div>
  );
}

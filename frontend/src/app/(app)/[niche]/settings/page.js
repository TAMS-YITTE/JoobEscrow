import './settings.css';

// Etapes reprises de la roadmap publique (presale/page.js et whitepaper) : aucune date, statuts identiques.
const COMING = [
  { icon: '🔔', title: 'Telegram deal alerts', text: 'Get notified when an escrow is funded, accepted, released or disputed.', status: 'Next' },
  { icon: '💸', title: 'Lower fees with JOOB', text: 'Stake JOOB to pay lower fees, by tier, up to a full fee waiver at the highest tier (Escrow V5).', status: 'Planned' },
  { icon: '✉️', title: 'Email sign-in, no seed phrase', text: 'Start with an email or social account, network fees covered, card payments.', status: 'Planned' },
  { icon: '🤝', title: 'Co-funded escrow', text: 'Several sponsors pool funds on PerShare and open one escrow, paid only on delivery.', status: 'Planned' },
  { icon: '🗳️', title: 'JOOB governance', text: 'JOOB holders vote on new categories, fee tiers and ecosystem grants.', status: 'Planned' },
];

export default function SettingsPage() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient">Settings</h1>
          <p className="subtitle">Preferences and what is coming next</p>
        </div>
      </header>

      <div className="glass-panel settings-panel">
        <h3 className="settings-title">Notifications</h3>
        <div className="settings-row">
          <div>
            <p className="settings-name">Telegram &amp; email alerts <span className="settings-pill">Next</span></p>
            <p className="settings-desc">Get alerts for contract updates and disputes via Telegram or email.</p>
          </div>
          <button className="btn btn-outline" disabled style={{ opacity: 0.55, cursor: 'not-allowed' }}>Coming soon</button>
        </div>
      </div>

      <div className="glass-panel settings-panel">
        <h3 className="settings-title">What&apos;s coming</h3>
        <p className="settings-desc" style={{ marginBottom: 18 }}>
          Next milestones from our public roadmap. No dates: each one ships when it is ready, and audited where needed.
        </p>
        <div className="coming-grid">
          {COMING.map((c) => (
            <div key={c.title} className="coming-card">
              <div className="coming-head">
                <span className="coming-icon" aria-hidden="true">{c.icon}</span>
                <span className={`coming-status ${c.status === 'Next' ? 'is-now' : ''}`}>{c.status}</span>
              </div>
              <h4 className="coming-title">{c.title}</h4>
              <p className="coming-text">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

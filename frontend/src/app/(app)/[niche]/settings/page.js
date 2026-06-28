export default function SettingsPage() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient" style={{ backgroundImage: 'linear-gradient(to right, #94a3b8, #cbd5e1)' }}>Settings</h1>
          <p className="subtitle">Preferences and Platform Configuration</p>
        </div>
      </header>

      <div className="glass-panel" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>General Settings</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: '500' }}>Dark Mode</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Always on for the Premium Web3 experience.</p>
            </div>
            <button className="btn btn-outline" disabled>Enabled</button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: '500' }}>Notifications <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#3b82f6', color: '#fff', borderRadius: '4px', marginLeft: '8px' }}>Phase 3</span></p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Get alerts for contract updates and disputes via Telegram or Email.</p>
            </div>
            <button className="btn btn-outline" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Coming Soon</button>
          </div>
        </div>
      </div>
    </div>
  );
}

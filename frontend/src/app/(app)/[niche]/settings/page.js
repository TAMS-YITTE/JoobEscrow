import './settings.css';

export default function SettingsPage() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient">Settings</h1>
          <p className="subtitle">Preferences and notifications</p>
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

    </div>
  );
}

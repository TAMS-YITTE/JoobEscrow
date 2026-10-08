import Link from 'next/link';
import { instances } from '../../../config/instances';

export default function HubPage() {
  const niches = Object.values(instances);

  return (
    <div className="hub-container">
      <h1 className="text-gradient hub-title">Joob Escrow</h1>
      <p className="subtitle hub-subtitle">
        The Universal Non-Custodial Trust Layer
      </p>

      <Link href="/try" style={{ textDecoration: 'none', display: 'block', maxWidth: '720px', margin: '0 auto 40px' }}>
        <div className="glass-panel" style={{ borderColor: 'rgba(163, 230, 53, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ padding: '2px 10px', borderRadius: '999px', background: 'linear-gradient(90deg, #d9f99d, #a3e635)', color: '#0d1117', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.04em' }}>DEMO</span>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', margin: '8px 0 4px' }}>New here? Try it with $1</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Run a full escrow between two of your own wallets. 0% fee, 1 to 20 USDT or USDC.</p>
          </div>
          <span className="btn btn-primary">Start the demo →</span>
        </div>
      </Link>

      <h2 className="hub-section-title">Featured Ecosystems</h2>
      <div className="featured-grid">
        {niches.slice(0, 3).map((niche) => (
          <Link href={`/${niche.slug}`} key={niche.slug} style={{ textDecoration: 'none', width: '100%' }}>
            <div 
              className="glass-panel featured-card" 
              style={{ borderTopColor: niche.theme.primary }}
            >
              <h2 className="featured-title" style={{ color: niche.theme.primary }}>{niche.name}</h2>
              <p className="featured-desc">
                Secure transactions between<br/>
                <strong style={{color: '#fff'}}>{niche.lexicon.client}</strong> and <strong style={{color: '#fff'}}>{niche.lexicon.provider}</strong>.
              </p>
              <div className="fee-badge">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Platform Fee:</span> <strong style={{color: '#fff'}}>{niche.feeTier}%</strong>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="hub-section-title" style={{color: 'var(--text-secondary)', fontSize: '1.5rem', marginTop: '60px'}}>Specialized Escrows</h2>
      <div className="specialized-grid">
        {niches.slice(3).map((niche) => (
          <Link href={`/${niche.slug}`} key={niche.slug} style={{ textDecoration: 'none' }}>
            <div 
              className="glass-panel specialized-card" 
              style={{ borderLeftColor: niche.theme.primary }}
            >
              <div>
                <h3 className="specialized-title" style={{ color: niche.theme.primary }}>{niche.name}</h3>
                <p className="specialized-desc">
                  {niche.lexicon.client} & {niche.lexicon.provider}
                </p>
              </div>
              <div className="fee-badge" style={{ marginTop: 0 }}>
                <strong style={{color: '#fff', fontSize: '0.9rem'}}>{niche.feeTier}%</strong>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

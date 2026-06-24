import Link from 'next/link';
import { instances } from '../../../config/instances';

export default function HubPage() {
  const niches = Object.values(instances);

  return (
    <div className="hub-container">
      <h1 className="text-gradient hub-title">Joob Escrow</h1>
      <p className="subtitle hub-subtitle">
        The Universal Decentralized Trust Layer
      </p>

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

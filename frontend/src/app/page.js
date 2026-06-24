import Link from 'next/link';
import { instances } from '../config/instances';

export default function HubPage() {
  const niches = Object.values(instances);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '10px' }}>Joob Escrow</h1>
      <p className="subtitle" style={{ fontSize: '1.2rem', marginBottom: '40px' }}>
        The Universal Decentralized Trust Layer
      </p>

      <h2 style={{color: '#fff', fontSize: '2rem', marginBottom: '30px'}}>Featured Ecosystems</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        justifyItems: 'center'
      }}>
        {niches.slice(0, 3).map((niche) => (
          <Link href={`/${niche.slug}`} key={niche.slug} style={{ textDecoration: 'none', width: '100%' }}>
            <div className="glass-panel" style={{
              padding: '30px', 
              borderRadius: '12px',
              borderTop: `4px solid ${niche.theme.primary}`,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <h2 style={{ color: niche.theme.primary, marginBottom: '15px', fontSize: '1.8rem' }}>{niche.name}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', flexGrow: 1 }}>
                Secure transactions between<br/>
                <strong style={{color: '#fff'}}>{niche.lexicon.client}</strong> and <strong style={{color: '#fff'}}>{niche.lexicon.provider}</strong>.
              </p>
              <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'inline-block', alignSelf: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Platform Fee:</span> <strong style={{color: '#fff'}}>{niche.feeTier}%</strong>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <h2 style={{color: 'var(--text-secondary)', fontSize: '1.5rem', marginTop: '60px', marginBottom: '30px'}}>Specialized Escrows</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {niches.slice(3).map((niche) => (
          <Link href={`/${niche.slug}`} key={niche.slug} style={{ textDecoration: 'none' }}>
            <div className="glass-panel" style={{
              padding: '20px', 
              borderRadius: '8px',
              borderLeft: `3px solid ${niche.theme.primary}`,
              transition: 'transform 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ color: niche.theme.primary, margin: '0 0 5px 0', fontSize: '1.2rem', textAlign: 'left' }}>{niche.name}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem', textAlign: 'left' }}>
                  {niche.lexicon.client} & {niche.lexicon.provider}
                </p>
              </div>
              <div style={{ padding: '5px 10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <strong style={{color: '#fff', fontSize: '0.9rem'}}>{niche.feeTier}%</strong>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNiche } from '../context/NicheContext';
import './Sidebar.css';

export default function Sidebar() {
  const pathname = usePathname();
  const niche = useNiche();

  const menuItems = [
    { name: 'Dashboard', path: `/${niche.slug}` },
    { name: 'Contracts', path: `/${niche.slug}/contracts` },
    { name: 'Disputes', path: `/${niche.slug}/disputes` },
    { name: 'Settings', path: `/${niche.slug}/settings` },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-brand">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.jpg" alt="JoobEscrow Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
          <h2>Joob</h2>
        </Link>
        <p style={{color: niche.theme.primary, marginTop: '8px'}}>{niche.name}</p>
      </div>
      
      <nav className="nav-menu">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== `/${niche.slug}` && pathname.startsWith(item.path));
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
              style={isActive ? { borderLeftColor: niche.theme.primary, color: niche.theme.primary } : {}}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p className="status-text"><span className="status-dot green"></span> Network: BSC Mainnet</p>
        <Link href="/terms" style={{ display: 'block', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          TOS & Security
        </Link>
      </div>
    </aside>
  );
}

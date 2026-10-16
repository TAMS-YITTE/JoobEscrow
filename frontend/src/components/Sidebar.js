'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNiche } from '../context/NicheContext';
import { allInstances } from '../config/instances';
import './Sidebar.css';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const niche = useNiche();

  const menuItems = [
    { name: 'Create', path: `/${niche.slug}` },
  ];
  const generalItems = [
    { name: "What's next", path: `/${niche.slug}/whats-next`, badge: 'NEW' },
    { name: 'Settings', path: `/${niche.slug}/settings` },
  ];
  const allEscrowsPath = `/${niche.slug}/all`;

  const renderLink = (item) => {
    const isActive = pathname === item.path || (item.path !== `/${niche.slug}` && pathname.startsWith(item.path));
    return (
      <Link
        key={item.name}
        href={item.path}
        className={`nav-link ${isActive ? 'active' : ''}`}
      >
        {item.name}
        {item.badge && <span className="nav-badge">{item.badge}</span>}
      </Link>
    );
  };

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-brand">
        {/* Le logo reste dans l'app : retour a la vue d'ensemble des categories (/app). */}
        <Link href="/app" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.svg" alt="JoobEscrow Logo" style={{ width: '40px', height: '40px' }} />
          <h2>Joob</h2>
        </Link>
      </div>

      <nav className="nav-menu">
        {renderLink({ name: 'My escrows', path: allEscrowsPath })}

        <div className="nav-section-head">
          <label className="nav-section-label" htmlFor="category-select">Category</label>
          <Link href="/app" className="nav-all-categories">All categories</Link>
        </div>
        <select
          id="category-select"
          className="category-select"
          value={niche.slug}
          onChange={(e) => router.push(`/${e.target.value}`)}
          style={{ borderColor: niche.theme.primary }}
        >
          {/* La demo (0 %) n'est pas une categorie : visible seulement quand on y est deja. */}
          {Object.values(allInstances).filter((n) => !n.isDemo || n.slug === niche.slug).map((n) => (
            <option key={n.slug} value={n.slug}>{n.name}</option>
          ))}
        </select>
        {menuItems.map(renderLink)}

        <div className="nav-divider" />
        {generalItems.map(renderLink)}
      </nav>

      <Link href="/" className="sidebar-back">← Back to joobescrow.com</Link>

      <div className="sidebar-footer">
        <p className="status-text"><span className="status-dot green"></span> Network: BSC Mainnet</p>
        <Link href="/terms" style={{ display: 'block', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          TOS & Security
        </Link>
      </div>
    </aside>
  );
}

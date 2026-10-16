'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNiche } from '../context/NicheContext';
import WalletConnect from './WalletConnect';
import './Sidebar.css';

function subscribeActions(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('joob-actions-updated', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('joob-actions-updated', callback);
    window.removeEventListener('storage', callback);
  };
}

function getActionsSnapshot() {
  try {
    const raw = sessionStorage.getItem('joob_actions_required');
    if (raw === null) return 0;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

function getActionsServerSnapshot() {
  return 0;
}

export default function Sidebar() {
  const pathname = usePathname() || '';
  const niche = useNiche();
  const [moreOpen, setMoreOpen] = useState(false);
  const actionsRequired = useSyncExternalStore(subscribeActions, getActionsSnapshot, getActionsServerSnapshot);

  const createPath = `/${niche.slug}`;
  const allEscrowsPath = `/${niche.slug}/all`;
  const categoriesPath = '/app';
  const demoPath = '/demo';
  const whatsNextPath = `/${niche.slug}/whats-next`;
  const settingsPath = `/${niche.slug}/settings`;

  const isMyEscrowsActive = pathname === allEscrowsPath;
  const isCreateActive = pathname === createPath;
  const isCategoriesActive = pathname === categoriesPath;
  const isMoreActive = pathname === whatsNextPath || pathname === settingsPath || pathname === demoPath;

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          {/* Le logo reste dans l'app : retour a la vue d'ensemble des categories (/app). */}
          <Link href="/app" className="sidebar-brand-link">
            <img src="/logo.svg" alt="JoobEscrow Logo" style={{ width: '38px', height: '38px' }} />
            <h2>JoobEscrow</h2>
          </Link>
          <div className="sidebar-mobile-wallet">
            <WalletConnect />
          </div>
        </div>

        <Link href={createPath} className="sidebar-create-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Create escrow</span>
        </Link>

        <nav className="nav-menu" aria-label="Main navigation">
          <Link href={allEscrowsPath} className={`nav-link ${isMyEscrowsActive ? 'active' : ''}`}>
            <span>My escrows</span>
            {actionsRequired > 0 && (
              <span className="nav-badge nav-badge--warn" title={`${actionsRequired} action(s) required`}>
                {actionsRequired}
              </span>
            )}
          </Link>

          <Link href={categoriesPath} className={`nav-link ${isCategoriesActive ? 'active' : ''}`}>
            <span>Categories &amp; fees</span>
          </Link>

          <Link href={demoPath} className={`nav-link ${pathname === demoPath ? 'active' : ''}`}>
            <span>Try it with $1</span>
          </Link>

          <div className="nav-divider" />

          <Link href={whatsNextPath} className={`nav-link ${pathname === whatsNextPath ? 'active' : ''}`}>
            <span>What&apos;s next</span>
            <span className="nav-badge">NEW</span>
          </Link>

          <Link href={settingsPath} className={`nav-link ${pathname === settingsPath ? 'active' : ''}`}>
            <span>Settings</span>
          </Link>
        </nav>

        <Link href="/" className="sidebar-back">← Back to joobescrow.com</Link>

        <div className="sidebar-footer">
          <Link href="/terms" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--app-text-muted, #627067)', textDecoration: 'none' }}>
            TOS &amp; Security
          </Link>
        </div>
      </aside>

      {/* Mobile More Sheet */}
      {moreOpen && (
        <div className="mobile-more-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="mobile-more-sheet" onClick={(e) => e.stopPropagation()}>
            <Link href={demoPath} className={`mobile-more-link ${pathname === demoPath ? 'is-active' : ''}`} onClick={() => setMoreOpen(false)}>
              <span>Try it with $1</span>
              <span className="nav-badge">0% fee</span>
            </Link>
            <Link href={whatsNextPath} className={`mobile-more-link ${pathname === whatsNextPath ? 'is-active' : ''}`} onClick={() => setMoreOpen(false)}>
              <span>What&apos;s next</span>
              <span className="nav-badge">NEW</span>
            </Link>
            <Link href={settingsPath} className={`mobile-more-link ${pathname === settingsPath ? 'is-active' : ''}`} onClick={() => setMoreOpen(false)}>
              <span>Settings</span>
            </Link>
            <Link href="/" className="mobile-more-link" onClick={() => setMoreOpen(false)}>
              <span>← Back to website</span>
            </Link>
            <Link href="/terms" className="mobile-more-link" onClick={() => setMoreOpen(false)}>
              <span>TOS &amp; Security</span>
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link href={allEscrowsPath} className={`mobile-nav-item ${isMyEscrowsActive ? 'is-active' : ''}`} onClick={() => setMoreOpen(false)}>
          {actionsRequired > 0 && <span className="mobile-nav-badge">{actionsRequired}</span>}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span>My escrows</span>
        </Link>

        <Link href={createPath} className={`mobile-nav-item is-create ${isCreateActive ? 'is-active' : ''}`} onClick={() => setMoreOpen(false)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span>+ Create</span>
        </Link>

        <Link href={categoriesPath} className={`mobile-nav-item ${isCategoriesActive ? 'is-active' : ''}`} onClick={() => setMoreOpen(false)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Categories</span>
        </Link>

        <button
          type="button"
          className={`mobile-nav-item ${moreOpen || isMoreActive ? 'is-active' : ''}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
          </svg>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

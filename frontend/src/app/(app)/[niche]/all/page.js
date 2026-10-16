'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../../context/Web3Context';
import { useNiche, NicheScope } from '../../../../context/NicheContext';
import { useToast } from '../../../../context/ToastContext';
import { allInstances } from '../../../../config/instances';
import { ESCROW_ABI, TOKEN_ADDRESSES } from '../../../../config/contract';
import { loadMyEscrows } from '../../../../lib/myEscrows';
import { isUserRejection } from '../../../../lib/walletErrors';
import EscrowCard from '../../../../components/EscrowCard';
import WalletConnect from '../../../../components/WalletConnect';
import '../page.css';

// Un contrat par niveau de frais (+ demo) ; plusieurs categories partagent un contrat.
// Chaque escrow est affiche une seule fois, avec la categorie principale de son contrat.
const CONTRACTS = Object.values(allInstances).reduce((acc, n) => {
  if (!acc.some((c) => c.contractAddress.toLowerCase() === n.contractAddress.toLowerCase())) acc.push(n);
  return acc;
}, []);

const FILTERS = [
  { key: 'action', label: 'Action required', test: (e) => Boolean(e.actionRequired) },
  { key: 'active', label: 'Active', test: (e) => e.status === 'FUNDED' || e.status === 'DISPUTED' },
  { key: 'disputes', label: 'Disputes', test: (e) => e.status === 'DISPUTED' },
  { key: 'history', label: 'History', test: (e) => !['FUNDED', 'DISPUTED'].includes(e.status) },
  { key: 'all', label: 'All', test: () => true },
];

export default function MyEscrowsPage() {
  const { account, signer, readProvider, ensureCorrectChain } = useWeb3();
  const niche = useNiche();
  const { showToast } = useToast();
  const [rows, setRows] = useState(null);
  const [pending, setPending] = useState([]);
  const [filter, setFilter] = useState('active');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!account || !readProvider) return;
    setError(null);
    try {
      const found = [];
      const toClaim = [];
      for (const n of CONTRACTS) {
        const list = await loadMyEscrows(n.contractAddress, readProvider, account);
        list.forEach((e) => found.push({ ...e, niche: n, key: `${n.contractAddress}-${e.id}` }));
        const contract = new ethers.Contract(n.contractAddress, ESCROW_ABI, readProvider);
        for (const sym of n.tokens || ['USDT']) {
          const amount = await contract.withdrawable(account, TOKEN_ADDRESSES[sym]);
          if (amount > 0n) toClaim.push({ niche: n, sym, amount: ethers.formatEther(amount) });
        }
      }
      found.sort((a, b) => {
        if (a.actionRequired && !b.actionRequired) return -1;
        if (!a.actionRequired && b.actionRequired) return 1;
        return b.createdAt - a.createdAt;
      });
      setRows(found);
      setPending(toClaim);
      try {
        const actionsCount = found.filter(FILTERS[0].test).length;
        sessionStorage.setItem('joob_actions_required', String(actionsCount));
        window.dispatchEvent(new Event('joob-actions-updated'));
      } catch {
        /* ignore */
      }
      // Premier affichage : « Action required » s'il y en a, sinon « Active », sinon tout.
      setFilter((f) => (f !== 'active' ? f : found.some((e) => e.actionRequired) ? 'action' : found.some(FILTERS[1].test) ? 'active' : 'all'));
    } catch (err) {
      console.error('[My escrows]', err);
      setError('Could not load your escrows right now. Please try again.');
    }
  }, [account, readProvider]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const claim = async ({ niche: n, sym }) => {
    if (!signer) return;
    try {
      await ensureCorrectChain();
      const contract = new ethers.Contract(n.contractAddress, ESCROW_ABI, signer);
      const tx = await contract.withdraw(TOKEN_ADDRESSES[sym]);
      showToast('success', 'Withdrawal transaction sent!');
      await tx.wait();
      showToast('success', 'Withdrawal successful!');
      load();
    } catch (err) {
      console.error(err);
      if (!isUserRejection(err)) showToast('error', 'Withdrawal failed: ' + (err.shortMessage || err.message));
    }
  };

  const active = (rows || []).filter(FILTERS[1].test);
  const secured = active.reduce((s, e) => s + Number(e.amount), 0);
  const actions = (rows || []).filter(FILTERS[0].test).length;
  const current = FILTERS.find((f) => f.key === filter) || FILTERS[4];
  const shown = (rows || []).filter(current.test);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient">My escrows</h1>
          <p className="subtitle">Every escrow where you are the client or the provider, across all categories.</p>
        </div>
        <WalletConnect />
      </header>

      {!account && <p style={{ color: 'var(--text-secondary)' }}>Connect your wallet to see your escrows.</p>}
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {account && !error && rows === null && <p style={{ color: 'var(--text-secondary)' }}>Loading your escrows from the blockchain…</p>}

      {rows && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">
                <span aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                </span>
                <span className="label-long">Active escrows</span>
                <span className="label-short">Active</span>
              </div>
              <div className="stat-value tabular-nums">{active.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">
                <span aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </span>
                <span className="label-long">Total secured</span>
                <span className="label-short">Secured</span>
              </div>
              <div className="stat-value tabular-nums">{secured.toFixed(2)}<small>USD</small></div>
            </div>
            <div className="stat-card">
              <div className="stat-label">
                <span aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </span>
                <span className="label-long">Actions required</span>
                <span className="label-short">Actions</span>
              </div>
              <div className="stat-value warn tabular-nums">{actions}</div>
            </div>
          </div>

          {pending.length > 0 && (
            <div className="controls-right" style={{ marginBottom: 20, justifyContent: 'flex-start' }}>
              {pending.map((p) => (
                <div key={`${p.niche.contractAddress}-${p.sym}`} className="claim-box">
                  <span>Funds available to withdraw{p.niche.isDemo ? ' (demo)' : ''}</span>
                  <button className="btn btn-primary tabular-nums" onClick={() => claim(p)}>Claim {p.amount} {p.sym}</button>
                </div>
              ))}
            </div>
          )}

          <div className="dashboard-controls" style={{ flexWrap: 'wrap', gap: 15 }}>
            <div className="tabs" style={{ flexWrap: 'wrap', gap: '8px 20px' }}>
              {FILTERS.map((f) => (
                <button key={f.key} className={`tab tabular-nums ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
                  {f.label} ({rows.filter(f.test).length})
                </button>
              ))}
            </div>
            <Link href={`/${niche.slug}`} className="btn btn-primary">+ Create escrow</Link>
          </div>

          {shown.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>{rows.length === 0 ? 'No escrow yet for this wallet.' : 'Nothing here.'}</p>
          ) : (
            <div className="escrow-grid">
              {shown.map((e) => (
                <div key={e.key}>
                  <NicheScope niche={e.niche}>
                    <EscrowCard escrow={e} isDisputeView={e.status === 'DISPUTED'} onUpdate={load} />
                  </NicheScope>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

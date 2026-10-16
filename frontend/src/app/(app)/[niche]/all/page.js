'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../../context/Web3Context';
import { allInstances } from '../../../../config/instances';
import { ESCROW_ABI } from '../../../../config/contract';
import { readEscrowReference } from '../../../../lib/escrowReference';

// Tous les escrows du wallet connecte, sur tous les contrats (un par niveau de frais + demo).
// Plusieurs categories partagent un contrat : on affiche la categorie principale de chaque contrat.
const CONTRACTS = Object.values(allInstances).reduce((acc, n) => {
  if (!acc.some((c) => c.address.toLowerCase() === n.contractAddress.toLowerCase())) {
    acc.push({ address: n.contractAddress, slug: n.slug, name: n.name, fee: n.feeTier });
  }
  return acc;
}, []);

const STATUS = { 1: 'Funded', 2: 'Paid', 3: 'In dispute', 4: 'Dispute settled', 5: 'Cancelled' };

function Reference({ provider, contract, id, createdAt }) {
  const [ref, setRef] = useState(null);
  useEffect(() => {
    let cancelled = false;
    readEscrowReference(provider, contract, id, createdAt).then((r) => { if (!cancelled) setRef(r); }).catch(() => {});
    return () => { cancelled = true; };
  }, [provider, contract, id, createdAt]);
  return ref ? <span style={{ color: '#bef264', fontSize: '0.8rem' }}>{ref}</span> : null;
}

export default function AllEscrowsPage() {
  const { account, readProvider } = useWeb3();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!account || !readProvider) return;
    setError(null);
    try {
      const me = account.toLowerCase();
      const found = [];
      for (const c of CONTRACTS) {
        const contract = new ethers.Contract(c.address, ESCROW_ABI, readProvider);
        const count = Number(await contract.escrowCounter());
        for (let i = 1; i <= count; i++) {
          const e = await contract.getEscrowDetails(i);
          const isClient = e.client.toLowerCase() === me;
          const isProvider = e.provider.toLowerCase() === me;
          if (!isClient && !isProvider) continue;
          found.push({
            key: `${c.address}-${i}`, id: i, contract: c, role: isClient ? 'Client' : 'Provider',
            amount: Number(ethers.formatUnits(e.amount, 18)), status: Number(e.status), accepted: Boolean(e.accepted),
            createdAt: e.createdAt,
          });
        }
      }
      found.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
      setRows(found);
    } catch (err) {
      console.error('[All escrows]', err);
      setError('Could not load your escrows right now. Please try again.');
    }
  }, [account, readProvider]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: 6 }}>All my escrows</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Every escrow where you are the client or the provider, across all categories.</p>

      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {!error && rows === null && <p style={{ color: 'var(--text-secondary)' }}>Loading your escrows…</p>}
      {rows && rows.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No escrow yet for this wallet.</p>}

      {rows && rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r) => (
            <div key={r.key} className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ color: '#fff', fontWeight: 700 }}>{r.contract.name} #{r.id} <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.8rem' }}>· {r.contract.fee}% · {r.role}</span></span>
                <Reference provider={readProvider} contract={r.contract.address} id={String(r.id)} createdAt={r.createdAt} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', color: '#f8fafc' }}>{r.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT</span>
                <span style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: 999, border: '1px solid var(--border-color)', color: r.status === 1 ? '#bef264' : '#cbd5e1' }}>
                  {r.status === 1 && r.accepted ? 'In progress' : STATUS[r.status] ?? 'Unknown'}
                </span>
                <Link href={`/${r.contract.slug}?escrow=${r.id}`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Open</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

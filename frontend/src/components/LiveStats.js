'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { instances } from '../config/instances';
import { ESCROW_ABI } from '../config/contract';

// Le volume en $ n'est affiche qu'a partir de ce montant (un petit chiffre dessert plus qu'il ne rassure).
const VOLUME_DISPLAY_MIN_USD = 1000;
// Statuts du contrat V4 : 1 FUNDED, 2 RELEASED, 3 DISPUTED, 4 RESOLVED, 5 CANCELLED.
const COMPLETED = new Set([2, 4]);
const IN_PROGRESS = new Set([1, 3]);

const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' };
const labelStyle = { fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' };
const valueStyle = { fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' };

function Row({ label, value, loading, error, accent }) {
  return (
    <div style={accent ? { ...rowStyle, backgroundColor: 'rgba(50,255,100,0.05)', border: '1px solid rgba(50,255,100,0.2)' } : rowStyle}>
      <span style={accent ? { ...labelStyle, color: '#4ade80' } : labelStyle}>{label}</span>
      {loading ? (
        <div style={{ height: '24px', width: '48px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
      ) : error ? (
        <span style={{ ...valueStyle, fontSize: '1.2rem', color: 'var(--text-secondary)' }}>N/A</span>
      ) : (
        <span style={accent ? { ...valueStyle, color: '#4ade80' } : valueStyle}>{value}</span>
      )}
    </div>
  );
}

export default function LiveStats() {
  const { readProvider } = useWeb3();
  const [stats, setStats] = useState({ created: 0, completed: 0, inProgress: 0, releasedUsd: 0, loading: true, error: false });

  useEffect(() => {
    let isMounted = true;

    // Lecture directe des escrows (statut + montant) : exact, sans dependre d'une fenetre d'evenements.
    async function fetchStats() {
      if (!readProvider) return;
      try {
        let created = 0, completed = 0, inProgress = 0, releasedUsd = 0;
        // Instances publiques uniquement : la demo est hors de `instances` et n'est jamais comptee.
        const contracts = [...new Set(Object.values(instances).map((i) => i.contractAddress))];
        for (const address of contracts) {
          const contract = new ethers.Contract(address, ESCROW_ABI, readProvider);
          const count = Number(await contract.escrowCounter());
          created += count;
          for (let id = 1; id <= count; id++) {
            const e = await contract.getEscrowDetails(id);
            const status = Number(e.status);
            if (COMPLETED.has(status)) {
              completed++;
              releasedUsd += Number(ethers.formatUnits(e.amount, 18)); // USDT/USDC BEP-20 : 18 decimales
            } else if (IN_PROGRESS.has(status)) {
              inProgress++;
            }
          }
        }
        if (isMounted) setStats({ created, completed, inProgress, releasedUsd, loading: false, error: false });
      } catch (err) {
        console.error('Error fetching live stats:', err);
        if (isMounted) setStats((s) => ({ ...s, loading: false, error: true }));
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [readProvider]);

  const showVolume = stats.releasedUsd >= VOLUME_DISPLAY_MIN_USD;

  return (
    <div className="glass-panel" style={{ padding: '30px', margin: '0', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#fff', margin: '0 0 8px 0' }}>Live Network Stats</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Read directly from the escrow contracts on BNB Smart Chain.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Row label="Escrows created" value={stats.created} loading={stats.loading} error={stats.error} />
        <Row label="In progress" value={stats.inProgress} loading={stats.loading} error={stats.error} />
        <Row
          label={showVolume ? 'Funds released' : 'Completed'}
          value={showVolume ? `$${stats.releasedUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : stats.completed}
          loading={stats.loading}
          error={stats.error}
          accent
        />
      </div>
    </div>
  );
}

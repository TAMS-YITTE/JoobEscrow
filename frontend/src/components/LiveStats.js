'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { instances } from '../config/instances';
import { USDT_ADDRESS, ESCROW_ABI } from '../config/contract';

export default function LiveStats() {
  const { readProvider } = useWeb3();
  const [stats, setStats] = useState({
    tvl: null,
    totalEscrows: null,
    fundsReleased: null,
    loading: true,
    error: false
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      if (!readProvider) return;
      
      try {
        let totalTvl = 0n;
        let totalEscrows = 0n;
        let totalReleased = 0n;

        // Iterate over all active instances to accumulate global stats
        // To avoid too many RPC requests on public nodes, we do it carefully.
        const instanceKeys = Object.keys(instances);
        const uniqueContracts = [...new Set(instanceKeys.map(k => instances[k].contractAddress))];

        for (const address of uniqueContracts) {
          const contract = new ethers.Contract(address, ESCROW_ABI, readProvider);
          
          try {
            // 1. TVL (Total Locked USDT)
            const locked = await contract.totalLocked(USDT_ADDRESS);
            totalTvl += locked;

            // 2. Escrows Created
            const count = await contract.escrowCounter();
            totalEscrows += count;

            // 3. Funds Released (Events)
            // On public RPCs, queryFilter might fail if the block range is too large.
            // We use a try-catch for the events to not break the whole component.
            try {
              const filter = contract.filters.FundsReleased();
              // Try fetching from the last 100,000 blocks to avoid timeout, or fetch all if node supports it
              const events = await contract.queryFilter(filter, -100000); 
              for (const event of events) {
                // providerAmount is args[1], feeAmount is args[2]
                totalReleased += event.args[1] + event.args[2];
              }
            } catch (eventErr) {
              console.warn("Could not fetch historical events:", eventErr);
            }
          } catch (contractErr) {
            console.warn(`Error fetching stats for ${address}:`, contractErr);
          }
        }

        if (isMounted) {
          setStats({
            tvl: ethers.formatUnits(totalTvl, 18),
            totalEscrows: totalEscrows.toString(),
            fundsReleased: ethers.formatUnits(totalReleased, 18),
            loading: false,
            error: false
          });
        }
      } catch (err) {
        console.error("Error fetching live stats:", err);
        if (isMounted) setStats(s => ({ ...s, loading: false, error: true }));
      }
    }

    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [readProvider]);

  return (
    <div className="glass-panel" style={{ padding: '30px', margin: '0', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#fff', margin: '0 0 8px 0' }}>Live Network Stats</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Real-time metrics straight from the blockchain.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Total Secured</span>
          {stats.loading ? (
            <div style={{ height: '24px', width: '80px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
          ) : stats.error ? (
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>N/A</span>
          ) : (
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>${Number(stats.tvl).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Escrows Created</span>
          {stats.loading ? (
            <div style={{ height: '24px', width: '40px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
          ) : stats.error ? (
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>N/A</span>
          ) : (
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>{stats.totalEscrows}</span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: 'rgba(50,255,100,0.05)', borderRadius: '8px', border: '1px solid rgba(50,255,100,0.2)' }}>
          <span style={{ fontSize: '0.9rem', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Funds Released</span>
          {stats.loading ? (
            <div style={{ height: '24px', width: '80px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
          ) : stats.error ? (
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>N/A</span>
          ) : (
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4ade80' }}>${Number(stats.fundsReleased).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
          )}
        </div>

      </div>
    </div>
  );
}

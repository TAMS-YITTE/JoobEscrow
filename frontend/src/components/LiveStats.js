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
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <div className="glass-panel p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        
        <div className="flex flex-col space-y-2">
          <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Total Value Secured</span>
          {stats.loading ? (
            <div className="h-10 bg-gray-800 animate-pulse rounded w-1/2 mx-auto"></div>
          ) : stats.error ? (
            <span className="text-3xl font-bold text-gray-500">N/A</span>
          ) : (
            <span className="text-3xl font-bold text-white">${Number(stats.tvl).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Escrows Created</span>
          {stats.loading ? (
            <div className="h-10 bg-gray-800 animate-pulse rounded w-1/2 mx-auto"></div>
          ) : stats.error ? (
            <span className="text-3xl font-bold text-gray-500">N/A</span>
          ) : (
            <span className="text-3xl font-bold text-white">{stats.totalEscrows}</span>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Funds Released</span>
          {stats.loading ? (
            <div className="h-10 bg-gray-800 animate-pulse rounded w-1/2 mx-auto"></div>
          ) : stats.error ? (
            <span className="text-3xl font-bold text-gray-500">N/A</span>
          ) : (
            <span className="text-3xl font-bold text-white">${Number(stats.fundsReleased).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
          )}
        </div>

      </div>
    </div>
  );
}

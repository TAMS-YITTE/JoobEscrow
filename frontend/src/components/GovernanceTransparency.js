'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { ESCROW_ADDRESS, ESCROW_ABI } from '../config/contract';

export default function GovernanceTransparency() {
  const { readProvider } = useWeb3();
  const [govData, setGovData] = useState({
    owner: null,
    feeRecipient: null,
    defaultFeeBPS: null,
    timelockDelayDays: null,
    loading: true,
    error: false
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchGov() {
      if (!readProvider) return;
      
      try {
        // We read from the default escrow contract (ESCROW_ADDRESS)
        const contract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, readProvider);
        
        const [ownerAddr, recipientAddr, feeBps, timelockSecs] = await Promise.all([
          contract.owner(),
          contract.feeRecipient(),
          contract.defaultFeeBPS(),
          contract.TIMELOCK_DELAY()
        ]);

        if (isMounted) {
          setGovData({
            owner: ownerAddr,
            feeRecipient: recipientAddr,
            defaultFeeBPS: Number(feeBps) / 100, // BPS to percentage
            timelockDelayDays: Number(timelockSecs) / 86400, // seconds to days
            loading: false,
            error: false
          });
        }
      } catch (err) {
        console.error("Error fetching governance data:", err);
        if (isMounted) setGovData(s => ({ ...s, loading: false, error: true }));
      }
    }

    fetchGov();
  }, [readProvider]);

  if (govData.loading) {
    return (
      <div className="glass-panel p-6 mt-8 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-800 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-gray-800 rounded w-1/2"></div>
      </div>
    );
  }

  if (govData.error) {
    return null; // Fail gracefully
  }

  return (
    <div className="glass-panel p-6 mt-8 border border-white/10">
      <h3 className="font-bold text-2xl text-white mb-4">Live Governance Transparency</h3>
      <p className="text-gray-400 mb-6">
        The parameters below are read directly from the blockchain. These Timelock and Governance rules apply identically to all 5 tier contracts (2%, 3%, 5%, 8%, 10%). The values displayed below are fetched from the default 8% contract.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-black/40 rounded border border-white/5 overflow-hidden">
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Contract Owner (Arbitrator)</span>
          <span className="text-sm text-white font-mono break-all">{govData.owner}</span>
        </div>
        
        <div className="p-4 bg-black/40 rounded border border-white/5 overflow-hidden">
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Treasury Wallet</span>
          <span className="text-sm text-white font-mono break-all">{govData.feeRecipient}</span>
        </div>

        <div className="p-4 bg-black/40 rounded border border-white/5">
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Default Base Fee</span>
          <span className="text-xl font-bold text-white">{govData.defaultFeeBPS}%</span>
        </div>

        <div className="p-4 bg-black/40 rounded border border-white/5">
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Timelock Delay</span>
          <span className="text-xl font-bold text-white">{govData.timelockDelayDays} Days</span>
        </div>
      </div>
    </div>
  );
}

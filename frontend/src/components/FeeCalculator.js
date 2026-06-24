'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { ESCROW_ADDRESS, ESCROW_ABI } from '../config/contract';

export default function FeeCalculator() {
  const { readProvider } = useWeb3();
  const [amount, setAmount] = useState(1000);
  const [feeBPS, setFeeBPS] = useState(200); // default 200 BPS = 2%
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchFee() {
      if (!readProvider) return;
      try {
        const contract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, readProvider);
        const bps = await contract.defaultFeeBPS();
        if (isMounted) {
          setFeeBPS(Number(bps));
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching fee BPS:", err);
        if (isMounted) setLoading(false);
      }
    }
    fetchFee();
    return () => { isMounted = false; };
  }, [readProvider]);

  const handleAmountChange = (e) => {
    const val = Number(e.target.value);
    setAmount(val >= 0 ? val : 0);
  };

  const percentage = feeBPS / 100;
  const feeAmount = (amount * percentage) / 100;
  const providerReceives = amount - feeAmount;

  return (
    <div className="glass-panel p-6 max-w-md mx-auto my-8 border border-white/10">
      <div className="text-center mb-6">
        <h3 className="font-bold text-2xl text-white">Transparent Fees</h3>
        <p className="text-gray-400 text-sm">Calculate exactly what you pay and what they get.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Escrow Amount (USDT)</label>
        <div className="relative">
          <span className="absolute left-4 top-3 text-gray-500 font-bold">$</span>
          <input 
            type="number" 
            className="w-full bg-black/50 border border-gray-700 rounded-lg py-3 pl-8 pr-4 text-white text-xl font-bold focus:outline-none focus:border-green-500"
            value={amount}
            onChange={handleAmountChange}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-black/40 rounded">
          <span className="text-gray-400">Client deposits:</span>
          <span className="text-white font-bold">{amount.toFixed(2)} USDT</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-red-900/10 border border-red-500/20 rounded">
          <span className="text-gray-400 flex items-center gap-2">
            JoobEscrow Fee 
            {loading ? <span className="animate-pulse bg-gray-700 h-4 w-8 rounded"></span> : <span className="text-xs bg-gray-800 px-2 py-1 rounded">{percentage}%</span>}
          </span>
          <span className="text-red-400 font-bold">-{feeAmount.toFixed(2)} USDT</span>
        </div>

        <div className="flex justify-between items-center p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <span className="text-green-400 font-bold">Provider receives:</span>
          <span className="text-green-400 font-bold text-xl">{providerReceives.toFixed(2)} USDT</span>
        </div>
      </div>
      
      <p className="text-xs text-center text-gray-500 mt-4">
        The fee is only deducted from the provider&apos;s payout upon successful completion. 100% refund if cancelled.
      </p>
    </div>
  );
}

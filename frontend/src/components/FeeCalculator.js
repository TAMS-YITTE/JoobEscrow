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
    <div className="glass-panel" style={{ padding: '30px', margin: '0', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flex: 1, minWidth: '300px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#fff', margin: '0 0 8px 0' }}>Transparent Fees</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Calculate exactly what you pay and what they get.</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Escrow Amount (USDT)</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '1.2rem' }}>$</span>
          <input 
            type="number" 
            style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 12px 12px 35px', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }}
            value={amount}
            onChange={handleAmountChange}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Client deposits:</span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{amount.toFixed(2)} USDT</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', backgroundColor: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            JoobEscrow Fee 
            {loading ? <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', height: '16px', width: '30px', borderRadius: '4px' }}></span> : <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>{percentage}%</span>}
          </span>
          <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>-{feeAmount.toFixed(2)} USDT</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 15px', backgroundColor: 'rgba(50,255,100,0.1)', border: '1px solid rgba(50,255,100,0.2)', borderRadius: '8px' }}>
          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Provider receives:</span>
          <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.2rem' }}>{providerReceives.toFixed(2)} USDT</span>
        </div>
      </div>
      
      <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' }}>
        The fee is only deducted from the provider's payout upon successful completion. 100% refund if cancelled.
      </p>
    </div>
  );
}

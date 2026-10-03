'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { ESCROW_ADDRESS, ESCROW_ABI } from '../config/contract';
import { instances } from '../config/instances';

// Une instance par niveau de frais ; les taux sont lus on-chain (defaultFeeBPS), jamais codes en dur.
const FEE_CONTRACTS = [...new Set(Object.values(instances).map((i) => i.contractAddress))];

export default function FeeCalculator() {
  const { readProvider } = useWeb3();
  const [amount, setAmount] = useState(1000);
  const [tiers, setTiers] = useState([]); // [{ address, bps }] tries par taux
  const [selected, setSelected] = useState(ESCROW_ADDRESS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchFee() {
      if (!readProvider) return;
      try {
        const read = await Promise.all(FEE_CONTRACTS.map(async (address) => ({
          address,
          bps: Number(await new ethers.Contract(address, ESCROW_ABI, readProvider).defaultFeeBPS()),
        })));
        if (isMounted) {
          setTiers(read.sort((a, b) => a.bps - b.bps));
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

  const feeBPS = tiers.find((t) => t.address === selected)?.bps ?? 0;
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

      <div style={{ marginBottom: '20px' }}>
        <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Fee tier (depends on the category)</span>
        <div role="radiogroup" aria-label="Fee tier" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {loading ? (
            <span style={{ height: '34px', width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px' }} />
          ) : tiers.map((t) => {
            const active = t.address === selected;
            return (
              <button
                key={t.address}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(t.address)}
                style={{ flex: '1 1 0', minWidth: '52px', padding: '8px 0', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit', color: active ? '#0d1117' : '#fff', background: active ? '#10b981' : 'rgba(0,0,0,0.4)', border: active ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)' }}
              >
                {t.bps / 100}%
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Client deposits:</span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{amount.toFixed(2)} USDT</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', backgroundColor: 'rgba(190,242,100,0.08)', border: '1px solid rgba(190,242,100,0.28)', borderRadius: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            JoobEscrow Fee 
            {loading ? <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', height: '16px', width: '30px', borderRadius: '4px' }}></span> : <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>{percentage}%</span>}
          </span>
          <span style={{ color: '#d9f99d', fontWeight: 'bold' }}>-{feeAmount.toFixed(2)} USDT</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 15px', backgroundColor: 'rgba(50,255,100,0.1)', border: '1px solid rgba(50,255,100,0.2)', borderRadius: '8px' }}>
          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Provider receives:</span>
          <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.2rem' }}>{providerReceives.toFixed(2)} USDT</span>
        </div>
      </div>
      
      <div style={{ marginTop: '14px', padding: '10px 15px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.15)', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
        On this deal, a marketplace keeping 20–30% would take <strong style={{ color: '#fff' }}>{(amount * 0.2).toFixed(0)}–{(amount * 0.3).toFixed(0)} USDT</strong>.
        JoobEscrow: <strong style={{ color: '#4ade80' }}>{feeAmount.toFixed(0)} USDT</strong>, client pays 0%.
      </div>

      <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' }}>
        The fee is only deducted from the provider&apos;s payout on completion. If the escrow is cancelled before the provider accepts, the client gets a full refund (minus network gas).
      </p>
    </div>
  );
}

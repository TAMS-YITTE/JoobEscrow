'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../../context/Web3Context';
import { useNiche } from '../../../context/NicheContext';
import { useEscrowContract } from '../../../hooks/useEscrowContract';
import { ethers } from 'ethers';
import EscrowCard from '../../../components/EscrowCard';

export default function DisputesPage() {
  const { account } = useWeb3();
  const contract = useEscrowContract();
  const niche = useNiche();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDisputes() {
      if (!contract || !account) return;
      setLoading(true);
      try {
        const counter = await contract.escrowCounter();
        const maxId = Number(counter);
        const fetched = [];
        
        for (let i = 1; i <= maxId; i++) {
          const details = await contract.getEscrowDetails(i);
          if (details.status === 2n || details.status === 2) {
             if (details.client.toLowerCase() === account.toLowerCase() || 
                 details.provider.toLowerCase() === account.toLowerCase()) {
                 
                const amountStr = ethers.formatEther(details.amount);
                fetched.push({
                  id: i,
                  client: details.client,
                  provider: details.provider,
                  amount: amountStr,
                  status: details.status,
                  tokenSymbol: "Token"
                });
             }
          }
        }
        setDisputes(fetched.reverse());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchDisputes();
  }, [contract, account]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient" style={{ backgroundImage: 'linear-gradient(to right, #ef4444, #8b5cf6)' }}>Active Disputes</h1>
          <p className="subtitle">Manage disputes between {niche.lexicon.client} and {niche.lexicon.provider}</p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '40px 20px', marginTop: '20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading disputes...</p>
        ) : disputes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {disputes.map(e => <EscrowCard key={e.id} escrow={e} isDisputeView={true} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>You have no active disputes at the moment.</p>
            <p style={{ color: 'var(--accent-primary)', marginTop: '10px', fontSize: '0.9rem' }}>Everything is running smoothly! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}

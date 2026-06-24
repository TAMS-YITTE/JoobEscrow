'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../../context/Web3Context';
import { useNiche } from '../../../context/NicheContext';
import { useEscrowContract } from '../../../hooks/useEscrowContract';
import { ethers } from 'ethers';
import EscrowCard from '../../../components/EscrowCard';

export default function ContractsPage() {
  const { account } = useWeb3();
  const contract = useEscrowContract();
  const niche = useNiche();
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchEscrows() {
      if (!contract || !account) return;
      setLoading(true);
      try {
        const counter = await contract.escrowCounter();
        const maxId = Number(counter);
        const fetched = [];
        
        for (let i = 1; i <= maxId; i++) {
          const details = await contract.getEscrowDetails(i);
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
        setEscrows(fetched.reverse());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchEscrows();
  }, [contract, account]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient" style={{backgroundImage: `linear-gradient(to right, ${niche.theme.primary}, #fff)`}}>My {niche.lexicon.client} Contracts</h1>
          <p className="subtitle">View and manage your escrow contracts.</p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '40px 20px', marginTop: '20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading from blockchain...</p>
        ) : escrows.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {escrows.map(e => <EscrowCard key={e.id} escrow={e} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No contracts found yet.</p>
            <button className="btn btn-primary" style={{ marginTop: '20px' }}>+ Create New Contract</button>
          </div>
        )}
      </div>
    </div>
  );
}

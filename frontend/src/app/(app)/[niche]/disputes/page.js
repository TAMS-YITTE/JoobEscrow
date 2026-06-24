'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../../../context/Web3Context';
import { useNiche } from '../../../../context/NicheContext';
import { ethers } from 'ethers';
import EscrowCard from '../../../../components/EscrowCard';
import { ESCROW_ADDRESS, ESCROW_ABI } from '../../../../config/contract';

export default function DisputesPage() {
  const { account, provider, readProvider } = useWeb3();
  const niche = useNiche();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDisputes() {
      const currentProvider = readProvider || provider;
      if (!currentProvider || !account) return;
      setLoading(true);
      try {
        const contract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, currentProvider);
        const counter = await contract.escrowCounter();
        const maxId = Number(counter);
        const globalStaleTimeout = await contract.staleDisputeTimeout();
        const staleTimeoutNumber = Number(globalStaleTimeout);

        const fetched = [];
        
        for (let i = 1; i <= maxId; i++) {
          const details = await contract.getEscrowDetails(i);
          const statusEnum = Number(details.status);
          
          if (statusEnum === 3) { // DISPUTED
             if (details.client.toLowerCase() === account.toLowerCase() || 
                 details.provider.toLowerCase() === account.toLowerCase()) {
                 
                const amountStr = ethers.formatEther(details.amount);
                const openedAt = await contract.disputeOpenedAt(i);
                
                fetched.push({
                  id: i.toString(),
                  client: details.client,
                  provider: details.provider,
                  amount: amountStr,
                  status: 'DISPUTED',
                  tokenSymbol: 'USDT',
                  accepted: Boolean(details.accepted),
                  timeoutDate: Number(details.timeoutDate),
                  disputeOpenedAt: Number(openedAt),
                  staleDisputeTimeout: staleTimeoutNumber,
                  createdAt: Number(details.createdAt)
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
  }, [account, provider, readProvider]);

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

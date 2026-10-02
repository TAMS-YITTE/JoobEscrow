'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWeb3 } from '../../../../context/Web3Context';
import { useNiche } from '../../../../context/NicheContext';
import { ethers } from 'ethers';
import EscrowCard from '../../../../components/EscrowCard';
import { ESCROW_ABI } from '../../../../config/contract';

const STATUS = ['FUNDED', 'RELEASED', 'DISPUTED', 'RESOLVED', 'CANCELLED'];

export default function ContractsPage() {
  const { account, readProvider, provider } = useWeb3();
  const niche = useNiche();
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lecture seule via le RPC public : pas besoin de signataire pour lister ses escrows.
  const fetchEscrows = useCallback(async () => {
    const reader = readProvider || provider;
    if (!reader || !account) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, reader);
      const maxId = Number(await contract.escrowCounter());
      const staleTimeout = Number(await contract.staleDisputeTimeout());
      const me = account.toLowerCase();
      const fetched = [];
      for (let i = 1; i <= maxId; i++) {
        const e = await contract.getEscrowDetails(i);
        const isClient = e.client.toLowerCase() === me;
        const isProvider = e.provider.toLowerCase() === me;
        if (!isClient && !isProvider) continue;
        const statusEnum = Number(e.status);
        const accepted = Boolean(e.accepted);
        let actionRequired = null;
        if (statusEnum === 1) {
          if (!accepted && isProvider) actionRequired = 'Action Required: Accept Job';
          else if (accepted && isClient) actionRequired = 'Action Required: Release or Dispute';
        }
        fetched.push({
          id: i.toString(),
          client: e.client,
          provider: e.provider,
          amount: ethers.formatEther(e.amount),
          status: STATUS[statusEnum - 1] || 'UNKNOWN',
          tokenSymbol: e.sym || 'USDT',
          actionRequired,
          createdAt: Number(e.createdAt),
          timeoutDate: Number(e.timeoutDate),
          accepted,
          disputeOpenedAt: statusEnum === 3 ? Number(await contract.disputeOpenedAt(i)) : 0,
          staleDisputeTimeout: staleTimeout,
        });
      }
      setEscrows(fetched.reverse());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [account, readProvider, provider, niche.contractAddress]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEscrows();
  }, [fetchEscrows]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient" style={{backgroundImage: `linear-gradient(to right, ${niche.theme.primary}, #fff)`}}>My {niche.isDemo ? 'demo escrows' : 'contracts'}</h1>
          <p className="subtitle">Every escrow where you are the {niche.lexicon.client.toLowerCase()} or the {niche.lexicon.provider.toLowerCase()}, newest first.</p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '40px 20px', marginTop: '20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading from blockchain...</p>
        ) : escrows.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {escrows.map(e => <EscrowCard key={e.id} escrow={e} onUpdate={fetchEscrows} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No contracts found yet.</p>
            <Link href={`/${niche.slug}`} className="btn btn-primary" style={{ marginTop: '20px' }}>+ Create New Contract</Link>
          </div>
        )}
      </div>
    </div>
  );
}

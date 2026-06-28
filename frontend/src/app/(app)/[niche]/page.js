'use client';

import WalletConnect from '../../../components/WalletConnect';
import EscrowCard from '../../../components/EscrowCard';
import CreateEscrowModal from '../../../components/CreateEscrowModal';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWeb3 } from '../../../context/Web3Context';
import { useNiche } from '../../../context/NicheContext';
import { ethers } from 'ethers';
import { USDT_ADDRESS, ERC20_ABI, ESCROW_ABI } from '../../../config/contract';
import './page.css';

function DashboardContent() {
  const { account, provider, signer, readProvider } = useWeb3();
  const niche = useNiche();
  const [activeTab, setActiveTab] = useState('active');
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingUsdt, setPendingUsdt] = useState('0');
  const searchParams = useSearchParams();
  const highlightedId = searchParams?.get('escrow');

  const fetchPending = useCallback(async () => {
    const currentProvider = readProvider || provider;
    if (!currentProvider || !account) return;
    try {
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, currentProvider);
      const pending = await contract.withdrawable(account, USDT_ADDRESS);
      setPendingUsdt(ethers.formatEther(pending));
    } catch (e) {
      console.error("Error fetching withdrawable:", e);
    }
  }, [account, provider, readProvider, niche.contractAddress]);

  const fetchEscrows = useCallback(async () => {
    const currentProvider = readProvider || provider;
    if (!currentProvider) return;
    
    setLoading(true);
    try {
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, currentProvider);
      const escrowCount = await contract.escrowCounter();
      const count = Number(escrowCount);
      const globalStaleTimeout = await contract.staleDisputeTimeout();
      const staleTimeoutNumber = Number(globalStaleTimeout);
      
      const loaded = [];
      for (let i = 1; i <= count; i++) {
        const e = await contract.getEscrowDetails(i);
        // If wallet is connected, show only user's escrows. Otherwise, show public recent ones.
        const isClient = account && e.client.toLowerCase() === account.toLowerCase();
        const isProvider = account && e.provider.toLowerCase() === account.toLowerCase();
        
        if (!account || isClient || isProvider) {
           const statusEnum = Number(e.status);
           const isAccepted = Boolean(e.accepted);
           
           // Calculate Action Required
           let actionRequired = null;
           if (statusEnum === 1) { // FUNDED
             if (!isAccepted && isProvider) {
               actionRequired = "Action Required: Accept Job";
             } else if (isAccepted && isClient) {
               actionRequired = "Action Required: Release or Dispute";
             } else if (isAccepted && isProvider && Number(e.timeoutDate) > 0 && (Date.now()/1000) > Number(e.timeoutDate)) {
               actionRequired = "Action Required: Claim Timeout";
             }
           }
           
           let disputeOpenedAt = 0;
           if (statusEnum === 3) { // DISPUTED
             const openedAt = await contract.disputeOpenedAt(i);
             disputeOpenedAt = Number(openedAt);
           }

           loaded.push({
             id: i.toString(),
             client: e.client,
             provider: e.provider,
             amount: ethers.formatEther(e.amount),
             status: ['FUNDED', 'RELEASED', 'DISPUTED', 'RESOLVED', 'CANCELLED'][statusEnum - 1] || 'UNKNOWN',
             tokenSymbol: 'USDT', // We only use USDT right now
             actionRequired,
             highlighted: highlightedId === i.toString(),
             createdAt: Number(e.createdAt),
             timeoutDate: Number(e.timeoutDate),
             accepted: Boolean(e.accepted),
             disputeOpenedAt,
             staleDisputeTimeout: staleTimeoutNumber
           });
        }
      }
      
      if (!account) {
        loaded.reverse();
        setEscrows(loaded.slice(0, 10)); // Show 10 latest publicly
      } else {
        // Sort: action required first, then highlighted, then newest
        loaded.sort((a, b) => {
          if (a.actionRequired && !b.actionRequired) return -1;
          if (!a.actionRequired && b.actionRequired) return 1;
          if (a.highlighted && !b.highlighted) return -1;
          if (!a.highlighted && b.highlighted) return 1;
          return Number(b.id) - Number(a.id);
        });
        setEscrows(loaded);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [account, provider, readProvider, highlightedId, niche.contractAddress]);

  useEffect(() => {
    if (readProvider || provider) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEscrows();
      fetchPending();
    }
  }, [fetchEscrows, fetchPending, readProvider, provider, highlightedId]);

  const handleFaucet = async () => {
    if (!signer) return;
    try {
      const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      const bal = await usdt.balanceOf(account);
      alert(`You have ${ethers.formatEther(bal)} USDT`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaim = async () => {
    if (!signer) return;
    try {
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, signer);
      const tx = await contract.withdraw(USDT_ADDRESS);
      alert('Withdrawal transaction sent!');
      await tx.wait();
      alert('Withdrawal successful!');
      fetchPending();
    } catch (err) {
      console.error(err);
      alert('Withdrawal failed: ' + err.message);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient" style={{ backgroundImage: `linear-gradient(to right, ${niche.theme.primary}, #fff)` }}>Dashboard</h1>
          <p className="subtitle">Manage your {niche.name} {niche.lexicon.action.toLowerCase()}s & escrows</p>
        </div>
        <WalletConnect />
      </header>

      <div className="dashboard-controls">
        <div className="tabs">
          <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Contracts</button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
        </div>
        <div style={{display:'flex', gap: '10px', alignItems: 'center'}}>
          {Number(pendingUsdt) > 0 && (
            <button className="btn btn-primary" onClick={handleClaim} style={{background: '#22c55e', border: '1px solid #16a34a'}}>
              Claim {pendingUsdt} USDT (Pending)
            </button>
          )}
          {account && <button className="btn btn-outline" onClick={handleFaucet}>USDT Balance</button>}
          <button className="btn btn-primary" disabled={!account} onClick={() => setShowModal(true)}>+ New Escrow</button>
        </div>
      </div>

      {loading ? (
        <p style={{color: 'var(--text-secondary)'}}>Loading blockchain data...</p>
      ) : escrows.length === 0 ? (
        <div className="glass-panel" style={{textAlign: 'center', padding: '40px'}}>
           <p style={{color: 'var(--text-secondary)'}}>{account ? "No contracts found." : "Connect wallet to view contracts."}</p>
        </div>
      ) : (
        <div className="escrow-grid">
          {escrows.map(escrow => (
            <EscrowCard key={escrow.id} escrow={escrow} />
          ))}
        </div>
      )}

      {showModal && <CreateEscrowModal onClose={() => setShowModal(false)} onSuccess={fetchEscrows} />}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="glass-panel text-center p-8 m-8">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

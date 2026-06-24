'use client';

import WalletConnect from '../../../components/WalletConnect';
import EscrowCard from '../../../components/EscrowCard';
import CreateEscrowModal from '../../../components/CreateEscrowModal';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWeb3 } from '../../../context/Web3Context';
import { useNiche } from '../../../context/NicheContext';
import { ethers } from 'ethers';
import { ESCROW_ADDRESS, ESCROW_ABI, USDT_ADDRESS, ERC20_ABI } from '../../../config/contract';
import './page.css';

function DashboardContent() {
  const { account, provider, signer, readProvider } = useWeb3();
  const niche = useNiche();
  const [activeTab, setActiveTab] = useState('active');
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const searchParams = useSearchParams();
  const highlightedId = searchParams?.get('escrow');

  const fetchEscrows = useCallback(async () => {
    const currentProvider = readProvider || provider;
    if (!currentProvider) return;
    
    setLoading(true);
    try {
      const contract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, currentProvider);
      const escrowCount = await contract.escrowCounter();
      const count = Number(escrowCount);
      
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
             }
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
             accepted: Boolean(e.accepted)
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
  }, [account, provider, readProvider, highlightedId]);

  useEffect(() => {
    if (readProvider || provider) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEscrows();
    }
  }, [fetchEscrows, readProvider, provider, highlightedId]);

  const handleFaucet = async () => {
    if (!signer) return;
    try {
      const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      // MockUSDT was minted to the deployer.
      // If the current user is not the deployer, transfer will fail.
      // But in Hardhat, account 0 deploys and we often connect with it.
      // For a demo, we just try to read the balance.
      const bal = await usdt.balanceOf(account);
      alert(`You have ${ethers.formatEther(bal)} MockUSDT`);
    } catch (err) {
      console.error(err);
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
        <div style={{display:'flex', gap: '10px'}}>
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

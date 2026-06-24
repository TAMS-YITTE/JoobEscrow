'use client';

import WalletConnect from '../../../components/WalletConnect';
import EscrowCard from '../../../components/EscrowCard';
import CreateEscrowModal from '../../../components/CreateEscrowModal';
import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../../../context/Web3Context';
import { useNiche } from '../../../context/NicheContext';
import { ethers } from 'ethers';
import { ESCROW_ADDRESS, ESCROW_ABI, USDT_ADDRESS, ERC20_ABI } from '../../../config/contract';
import './page.css';

export default function Dashboard() {
  const { account, provider, signer, readProvider } = useWeb3();
  const niche = useNiche();
  const [activeTab, setActiveTab] = useState('active');
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
        if (!account || e.client.toLowerCase() === account.toLowerCase() || e.provider.toLowerCase() === account.toLowerCase()) {
           loaded.push({
             id: i.toString(),
             client: e.client,
             provider: e.provider,
             amount: ethers.formatEther(e.amount),
             status: ['FUNDED', 'ACCEPTED', 'DISPUTED', 'RESOLVED', 'CANCELLED'][Number(e.status)],
             tokenSymbol: e.sym || 'Token'
           });
        }
      }
      
      if (!account) {
        loaded.reverse();
        setEscrows(loaded.slice(0, 10)); // Show 10 latest publicly
      } else {
        setEscrows(loaded);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [account, provider, readProvider]);

  useEffect(() => {
    if (readProvider || provider) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEscrows();
    }
  }, [fetchEscrows, readProvider, provider]);

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

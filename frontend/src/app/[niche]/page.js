'use client';

import WalletConnect from '../../components/WalletConnect';
import EscrowCard from '../../components/EscrowCard';
import CreateEscrowModal from '../../components/CreateEscrowModal';
import { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useNiche } from '../../context/NicheContext';
import { ethers } from 'ethers';
import { ESCROW_ADDRESS, ESCROW_ABI, USDT_ADDRESS, ERC20_ABI } from '../../config/contract';
import './page.css';

export default function Dashboard() {
  const { account, provider, signer } = useWeb3();
  const niche = useNiche();
  const [activeTab, setActiveTab] = useState('active');
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (account && provider) {
      fetchEscrows();
    } else {
      setEscrows([]);
    }
  }, [account, provider]);

  const fetchEscrows = async () => {
    setLoading(true);
    try {
      const contract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      const escrowCount = await contract.escrowCounter();
      const count = Number(escrowCount);
      
      const loaded = [];
      for (let i = 1; i <= count; i++) {
        const e = await contract.getEscrowDetails(i);
        if (e.client.toLowerCase() === account.toLowerCase() || e.provider.toLowerCase() === account.toLowerCase()) {
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
      setEscrows(loaded);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFaucet = async () => {
    if (!signer) return;
    try {
      const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      // MockUSDT a été minté au déployeur. 
      // Si l'utilisateur actuel n'est pas le déployeur, le transfert échouera. 
      // Mais dans Hardhat, le compte 0 déploie et on se connecte souvent avec.
      // Pour une démo, on essaye juste de voir la balance
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

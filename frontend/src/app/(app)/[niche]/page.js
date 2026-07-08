'use client';

import WalletConnect from '../../../components/WalletConnect';
import EscrowCard from '../../../components/EscrowCard';
import CreateEscrowModal from '../../../components/CreateEscrowModal';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWeb3 } from '../../../context/Web3Context';
import { useNiche } from '../../../context/NicheContext';
import { useToast } from '../../../context/ToastContext';
import { useAppKit } from '@reown/appkit/react';
import { ethers } from 'ethers';
import { USDT_ADDRESS, ERC20_ABI, ESCROW_ABI } from '../../../config/contract';
import './page.css';

function DashboardContent() {
  const { account, provider, signer, readProvider } = useWeb3();
  const niche = useNiche();
  const { showToast } = useToast();
  const { open } = useAppKit();
  const [activeTab, setActiveTab] = useState('active');
  const [escrows, setEscrows] = useState([]);
  const [invitedEscrow, setInvitedEscrow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingUsdt, setPendingUsdt] = useState('0');
  const [usdtBalance, setUsdtBalance] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const searchParams = useSearchParams();
  const highlightedId = searchParams?.get('escrow');

  const fetchPending = useCallback(async () => {
    const currentProvider = readProvider || provider;
    if (!currentProvider || !account) return;
    try {
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, currentProvider);
      const pending = await contract.withdrawable(account, USDT_ADDRESS);
      setPendingUsdt(ethers.formatEther(pending));

      const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, currentProvider);
      const bal = await usdt.balanceOf(account);
      setUsdtBalance(ethers.formatEther(bal));
    } catch (e) {
      console.error("Error fetching withdrawable/balance:", e);
    }
  }, [account, provider, readProvider, niche.contractAddress]);

  // Load the single escrow referenced by ?escrow=N (works read-only, even when
  // disconnected) so the recipient of a share link always sees a focused card.
  const fetchInvited = useCallback(async () => {
    const currentProvider = readProvider || provider;
    if (!currentProvider || !highlightedId) { setInvitedEscrow(null); return; }
    try {
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, currentProvider);
      const e = await contract.getEscrowDetails(highlightedId);
      const statusEnum = Number(e.status);
      const isAccepted = Boolean(e.accepted);
      const isClient = account && e.client.toLowerCase() === account.toLowerCase();
      const isProvider = account && e.provider.toLowerCase() === account.toLowerCase();

      let disputeOpenedAt = 0;
      if (statusEnum === 3) disputeOpenedAt = Number(await contract.disputeOpenedAt(highlightedId));
      const staleTimeoutNumber = Number(await contract.staleDisputeTimeout());

      let actionRequired = null;
      if (statusEnum === 1) {
        if (!isAccepted && isProvider) actionRequired = "Action Required: Accept Job";
        else if (isAccepted && isClient) actionRequired = "Action Required: Release or Dispute";
      }

      setInvitedEscrow({
        id: highlightedId.toString(),
        client: e.client,
        provider: e.provider,
        amount: ethers.formatEther(e.amount),
        status: ['FUNDED', 'RELEASED', 'DISPUTED', 'RESOLVED', 'CANCELLED'][statusEnum - 1] || 'UNKNOWN',
        tokenSymbol: 'USDT',
        actionRequired,
        highlighted: true,
        createdAt: 0,
        timeoutDate: Number(e.timeoutDate),
        accepted: isAccepted,
        disputeOpenedAt,
        staleDisputeTimeout: staleTimeoutNumber
      });
    } catch (err) {
      console.error("Invited escrow not found:", err);
      setInvitedEscrow(null);
    }
  }, [highlightedId, readProvider, provider, account, niche.contractAddress]);

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
      
      const ownerAddr = await contract.owner();
      const currentIsOwner = account && ownerAddr.toLowerCase() === account.toLowerCase();
      setIsOwner(currentIsOwner);
      
      const loaded = [];
      for (let i = 1; i <= count; i++) {
        const e = await contract.getEscrowDetails(i);
        // If wallet is connected, show only user's escrows (or all if owner). Otherwise, show public recent ones.
        const isClient = account && e.client.toLowerCase() === account.toLowerCase();
        const isProvider = account && e.provider.toLowerCase() === account.toLowerCase();
        
        if (!account || isClient || isProvider || currentIsOwner) {
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
        // Sort: action required first, then disputed (for admin), then newest
        loaded.sort((a, b) => {
          if (a.actionRequired && !b.actionRequired) return -1;
          if (!a.actionRequired && b.actionRequired) return 1;
          if (a.status === 'DISPUTED' && b.status !== 'DISPUTED') return -1;
          if (a.status !== 'DISPUTED' && b.status === 'DISPUTED') return 1;
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
      fetchInvited();
    }
  }, [fetchEscrows, fetchPending, fetchInvited, readProvider, provider, highlightedId]);

  const handleClaim = async () => {
    if (!signer) return;
    try {
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, signer);
      const tx = await contract.withdraw(USDT_ADDRESS);
      showToast('success', 'Withdrawal transaction sent!');
      await tx.wait();
      showToast('success', 'Withdrawal successful!');
      fetchPending();
    } catch (err) {
      console.error(err);
      showToast('error', 'Withdrawal failed: ' + err.message);
    }
  };

  const activeEscrows = escrows.filter(e => e.status === 'FUNDED' || e.status === 'DISPUTED');
  const activeCount = activeEscrows.length;
  const totalSecured = activeEscrows.reduce((sum, e) => sum + Number(e.amount), 0);
  const actionRequiredCount = activeEscrows.filter(e => e.actionRequired).length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.jpg" alt="JoobEscrow Logo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(59, 130, 246, 0.8)', padding: '2px', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)', filter: 'brightness(1.4)' }} />
          <div>
            <h1 className="text-gradient" style={{ backgroundImage: `linear-gradient(to right, ${niche.theme.primary}, #fff)` }}>Dashboard</h1>
            <p className="subtitle">Manage your {niche.name} {niche.lexicon.action.toLowerCase()}s & secure payments</p>
          </div>
        </div>
        <WalletConnect />
      </header>

      {account && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
            <div className="text-gray-400 text-sm mb-2 flex items-center gap-2">
              <span>💼</span> Active Transactions
            </div>
            <div className="text-3xl font-bold text-white">{activeCount}</div>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
            <div className="text-gray-400 text-sm mb-2 flex items-center gap-2">
              <span>💶</span> Total Secured
            </div>
            <div className="text-3xl font-bold text-white">{totalSecured.toFixed(2)} USDT</div>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
            <div className="text-gray-400 text-sm mb-2 flex items-center gap-2">
              <span>⚠️</span> Actions Required
            </div>
            <div className="text-3xl font-bold text-yellow-400">{actionRequiredCount}</div>
          </div>
        </div>
      )}

      <div className="dashboard-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tabs" style={{ flex: '1 1 auto' }}>
          <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Contracts</button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
        </div>
        <div style={{display:'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
          {Number(pendingUsdt) > 0 && (
            <div className="flex items-center gap-3 bg-green-900/30 border border-green-500/50 text-green-300 px-4 py-2 rounded-lg" style={{ animation: 'pulse 2s infinite' }}>
              <span className="text-sm">ℹ️ Funds available to withdraw</span>
              <button className="btn btn-primary" onClick={handleClaim} style={{background: '#22c55e', border: '1px solid #16a34a', padding: '6px 12px', fontSize: '0.875rem', height: 'auto'}}>
                Claim {pendingUsdt} USDT
              </button>
            </div>
          )}
          {account && (
            <div className="badge badge-outline" style={{ display: 'flex', alignItems: 'center', padding: '0 15px', height: '40px', border: '1px solid #22c55e', color: '#22c55e', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.05)', fontWeight: '600' }}>
              {usdtBalance ? `${Number(usdtBalance).toFixed(2)} USDT` : 'Loading...'}
            </div>
          )}
          <button className="btn btn-primary" disabled={!account} onClick={() => setShowModal(true)}>+ Create Secure Transaction</button>
        </div>
      </div>

      {highlightedId && invitedEscrow && (() => {
        const short = (a) => a ? `${a.substring(0, 6)}...${a.substring(a.length - 4)}` : '';
        const meProvider = account && invitedEscrow.provider.toLowerCase() === account.toLowerCase();
        const meClient = account && invitedEscrow.client.toLowerCase() === account.toLowerCase();
        let banner;
        if (!account) {
          banner = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
              <p className="text-gray-300 text-sm">
                You've been invited to <strong>Escrow #{invitedEscrow.id}</strong> ({invitedEscrow.amount} {invitedEscrow.tokenSymbol}).
                Connect the wallet <strong style={{ fontFamily: 'monospace', color: niche.theme.primary }}>{short(invitedEscrow.provider)}</strong> ({niche.lexicon.provider}) to review and accept it.
              </p>
              <button className="btn btn-primary" onClick={() => open()} style={{ backgroundColor: niche.theme.primary, borderColor: niche.theme.primary, padding: '10px 20px' }}>
                Connect Wallet
              </button>
            </div>
          );
        } else if (meProvider) {
          banner = <p className="text-sm" style={{ color: '#22c55e' }}>✓ You are connected as the recipient ({niche.lexicon.provider}). Review and accept this escrow below.</p>;
        } else if (meClient) {
          banner = <p className="text-sm text-gray-300">You created this escrow ({niche.lexicon.client}). Waiting for the {niche.lexicon.provider.toLowerCase()} to accept.</p>;
        } else {
          banner = (
            <p className="text-sm" style={{ color: '#f59e0b' }}>
              ⚠️ This escrow is addressed to <strong style={{ fontFamily: 'monospace' }}>{short(invitedEscrow.provider)}</strong>, but you're connected as <strong style={{ fontFamily: 'monospace' }}>{short(account)}</strong>. Switch to the correct wallet to accept it.
            </p>
          );
        }
        return (
          <div className="glass-panel mt-6 p-5" style={{ border: `1px solid ${niche.theme.primary}`, background: 'rgba(0,0,0,0.3)' }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: niche.theme.primary }}>📨 Escrow Invitation</h3>
            {banner}
            <div className="mt-4">
              <EscrowCard escrow={invitedEscrow} isOwner={isOwner} onUpdate={() => { fetchInvited(); fetchEscrows(); fetchPending(); }} />
            </div>
          </div>
        );
      })()}

      {loading ? (
        <p style={{color: 'var(--text-secondary)'}}>Loading blockchain data...</p>
      ) : escrows.length === 0 ? (
        <div className="glass-panel text-center p-8 max-w-3xl mx-auto mt-8 border border-gray-800">
           {account ? (
             <div className="flex flex-col items-center">
               <h2 className="text-2xl font-bold mb-6 text-white">How it works</h2>
               <div className="flex flex-col md:flex-row gap-4 text-left w-full">
                 <div className="flex-1 bg-black/40 p-5 rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors">
                   <div className="text-2xl mb-3">1️⃣</div>
                   <h3 className="font-bold text-white mb-2">Create & Fund</h3>
                   <p className="text-sm text-gray-400 leading-relaxed">Click <strong>+ New Escrow</strong> to lock funds in the smart contract. Share the link with your {niche.lexicon.provider.toLowerCase()}.</p>
                 </div>
                 <div className="flex-1 bg-black/40 p-5 rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors">
                   <div className="text-2xl mb-3">2️⃣</div>
                   <h3 className="font-bold text-white mb-2">Work & Deliver</h3>
                   <p className="text-sm text-gray-400 leading-relaxed">The {niche.lexicon.provider.toLowerCase()} accepts the contract and completes the task securely.</p>
                 </div>
                 <div className="flex-1 bg-black/40 p-5 rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors">
                   <div className="text-2xl mb-3">3️⃣</div>
                   <h3 className="font-bold text-white mb-2">Release or Dispute</h3>
                   <p className="text-sm text-gray-400 leading-relaxed">Satisfied? Release funds instantly. Issue? Open a dispute for fair resolution.</p>
                 </div>
               </div>
               <button className="btn btn-primary mt-8 px-8 py-3 shadow-lg" onClick={() => setShowModal(true)} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
                 Create Your First Escrow
               </button>
             </div>
           ) : (
             <div className="py-12 flex flex-col items-center">
               <div className="text-4xl mb-4">🔒</div>
               <h3 className="text-xl font-bold text-white mb-2">Secure Web3 Escrow</h3>
               <p className="text-gray-400 mb-6 text-center">Connect your wallet to view or create contracts.</p>
               <div style={{ transform: 'scale(1.2)' }}>
                 <WalletConnect />
               </div>
             </div>
           )}
        </div>
      ) : (
        <div className="escrow-grid">
          {escrows
            .filter(escrow => !(invitedEscrow && escrow.id === invitedEscrow.id))
            .map(escrow => (
              <EscrowCard key={escrow.id} escrow={escrow} isOwner={isOwner} onUpdate={() => { fetchEscrows(); fetchPending(); }} />
            ))}
        </div>
      )}

      {showModal && <CreateEscrowModal onClose={() => setShowModal(false)} onSuccess={() => { fetchEscrows(); fetchPending(); }} />}
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

'use client';

import Link from 'next/link';
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
import { TOKEN_ADDRESSES, ERC20_ABI, ESCROW_ABI } from '../../../config/contract';
import './page.css';

const DEMO_STEPS = [
  { who: 'Wallet A', title: 'Create & fund', text: 'Click "+ Create Secure Transaction", paste wallet B as provider and lock 1 USDT or USDC.' },
  { who: 'Wallet B', title: 'Accept', text: 'Switch to wallet B and accept the escrow. No spending approval is ever asked from B.' },
  { who: 'Wallet A', title: 'Release', text: 'Switch back to wallet A and release the funds, as you would once the work is delivered.' },
  { who: 'Wallet B', title: 'Withdraw', text: 'On wallet B, click "Claim": the exact amount arrives, 0% fee.' },
];

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
  // Montants par jeton de la niche (USDT par defaut ; USDT + USDC pour la demo).
  const [pending, setPending] = useState({});
  const [balances, setBalances] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const searchParams = useSearchParams();
  const highlightedId = searchParams?.get('escrow');

  const fetchPending = useCallback(async () => {
    const currentProvider = readProvider || provider;
    if (!currentProvider || !account) return;
    try {
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, currentProvider);
      const nextPending = {};
      const nextBalances = {};
      for (const sym of niche.tokens || ['USDT']) {
        const tokenAddr = TOKEN_ADDRESSES[sym];
        nextPending[sym] = ethers.formatEther(await contract.withdrawable(account, tokenAddr));
        const erc20 = new ethers.Contract(tokenAddr, ERC20_ABI, currentProvider);
        nextBalances[sym] = ethers.formatEther(await erc20.balanceOf(account));
      }
      setPending(nextPending);
      setBalances(nextBalances);
    } catch (e) {
      console.error("Error fetching withdrawable/balance:", e);
    }
  }, [account, provider, readProvider, niche.contractAddress, niche.tokens]);

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
        tokenSymbol: e.sym || 'USDT',
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
             tokenSymbol: e.sym || 'USDT',
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

  const handleClaim = async (sym) => {
    if (!signer) return;
    try {
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, signer);
      const tx = await contract.withdraw(TOKEN_ADDRESSES[sym]);
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
          <img src="/logo.svg" alt="JoobEscrow Logo" style={{ width: '48px', height: '48px' }} />
          <div>
            <h1 className="text-gradient" style={{ backgroundImage: `linear-gradient(to right, ${niche.theme.primary}, #fff)` }}>Dashboard</h1>
            <p className="subtitle">{niche.isDemo ? 'Test a real on-chain escrow with $1, between two of your wallets' : `Manage your ${niche.name} ${niche.lexicon.action.toLowerCase()}s & secure payments`}</p>
          </div>
        </div>
        <WalletConnect />
      </header>

      {niche.isDemo && (
        <div className="demo-banner">
          <div className="demo-banner-text">
            <div className="demo-banner-title">
              <span className="demo-pill">DEMO</span>
              Try JoobEscrow with $1
            </div>
            <p>
              A full escrow between <strong>two of your own wallets</strong>, with {niche.minAmount} to {niche.maxAmount} USDT or USDC.
              0% fee: you get back exactly what you deposited. Demo escrows are not counted in JoobEscrow statistics.
            </p>
          </div>
          <Link href="/try" className="demo-guide-link">Step-by-step guide →</Link>
        </div>
      )}

      {account && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label"><span>💼</span><span className="label-long">Active Transactions</span><span className="label-short">Active</span></div>
            <div className="stat-value">{activeCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><span>💶</span><span className="label-long">Total Secured</span><span className="label-short">Secured</span></div>
            <div className="stat-value">{totalSecured.toFixed(2)}<small>{niche.tokens ? 'USD' : 'USDT'}</small></div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><span>⚠️</span><span className="label-long">Actions Required</span><span className="label-short">Actions</span></div>
            <div className="stat-value warn">{actionRequiredCount}</div>
          </div>
        </div>
      )}

      <div className="dashboard-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tabs" style={{ flex: '1 1 auto' }}>
          <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Contracts</button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
        </div>
        <div className="controls-right">
          {Object.entries(pending).filter(([, v]) => Number(v) > 0).map(([sym, v]) => (
            <div key={sym} className="claim-box">
              <span>ℹ️ Funds available to withdraw</span>
              <button className="btn btn-primary" onClick={() => handleClaim(sym)}>
                Claim {v} {sym}
              </button>
            </div>
          ))}
          {account && (
            <div className="balance-badge">
              {balances ? Object.entries(balances).map(([sym, v]) => `${Number(v).toFixed(2)} ${sym}`).join(' · ') : 'Loading...'}
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
            <div className="invite-body">
              <p>
                You&apos;ve been invited to <strong>Escrow #{invitedEscrow.id}</strong> ({invitedEscrow.amount} {invitedEscrow.tokenSymbol}).
                Connect the wallet <strong style={{ fontFamily: 'monospace', color: niche.theme.primary }}>{short(invitedEscrow.provider)}</strong> ({niche.lexicon.provider}) to review and accept it.
              </p>
              <button className="btn btn-primary" onClick={() => open()} style={{ backgroundColor: niche.theme.primary, borderColor: niche.theme.primary, padding: '10px 20px' }}>
                Connect Wallet
              </button>
            </div>
          );
        } else if (meProvider) {
          banner = <p style={{ color: '#22c55e' }}>✓ You are connected as the recipient ({niche.lexicon.provider}). Review and accept this escrow below.</p>;
        } else if (meClient) {
          banner = <p>You created this escrow ({niche.lexicon.client}). Waiting for the {niche.lexicon.provider.toLowerCase()} to accept.</p>;
        } else {
          banner = (
            <p style={{ color: '#facc15' }}>
              ⚠️ This escrow is addressed to <strong style={{ fontFamily: 'monospace' }}>{short(invitedEscrow.provider)}</strong>, but you&apos;re connected as <strong style={{ fontFamily: 'monospace' }}>{short(account)}</strong>. Switch to the correct wallet to accept it.
            </p>
          );
        }
        return (
          <div className="glass-panel invite-panel" style={{ borderColor: niche.theme.primary }}>
            <h3 style={{ color: niche.theme.primary }}>📨 Escrow Invitation</h3>
            {banner}
            <div className="invite-card">
              <EscrowCard escrow={invitedEscrow} isOwner={isOwner} onUpdate={() => { fetchInvited(); fetchEscrows(); fetchPending(); }} />
            </div>
          </div>
        );
      })()}

      {loading ? (
        <p style={{color: 'var(--text-secondary)'}}>Loading blockchain data...</p>
      ) : escrows.length === 0 ? (
        <div className="glass-panel empty-panel" style={{ '--niche-primary': niche.theme.primary }}>
           {account ? (
             <>
               <h2>How it works</h2>
               {niche.isDemo && <p className="empty-sub">4 steps, about 10 minutes, two wallets you own.</p>}
               <div className="steps-grid">
                 {(niche.isDemo ? DEMO_STEPS : [
                   { title: 'Create & Fund', text: `Click "+ Create Secure Transaction" to lock funds in the smart contract. Share the link with your ${niche.lexicon.provider.toLowerCase()}.` },
                   { title: 'Work & Deliver', text: `The ${niche.lexicon.provider.toLowerCase()} accepts the contract and completes the task securely.` },
                   { title: 'Release or Dispute', text: 'Satisfied? Release funds instantly. Issue? Open a dispute for fair resolution.' },
                 ]).map((s, i) => (
                   <div key={s.title} className="step-card">
                     <span className="step-num">{i + 1}</span>
                     {s.who && <span className="step-who">{s.who}</span>}
                     <h3>{s.title}</h3>
                     <p>{s.text}</p>
                   </div>
                 ))}
               </div>
               <button className="btn btn-primary empty-cta" onClick={() => setShowModal(true)} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
                 {niche.isDemo ? 'Start the demo with wallet A' : 'Create Your First Escrow'}
               </button>
             </>
           ) : (
             <div className="connect-empty">
               <div className="lock">🔒</div>
               <h3>Secure Web3 Escrow</h3>
               <p>Connect your wallet to view or create contracts.</p>
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

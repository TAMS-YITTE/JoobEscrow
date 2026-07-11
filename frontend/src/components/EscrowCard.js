'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { useEscrowContract } from '../hooks/useEscrowContract';
import { useToast } from '../context/ToastContext';
import { track } from '@vercel/analytics';
import dynamic from 'next/dynamic';
import './EscrowCard.css';

const ChatBox = dynamic(() => import('./ChatBox'), { ssr: false });

export default function EscrowCard({ escrow, isDisputeView, isOwner, onUpdate }) {
  const { account } = useWeb3();
  const contract = useEscrowContract();
  const niche = useNiche();
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvePercent, setResolvePercent] = useState(50);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseAck, setReleaseAck] = useState(false);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'messages' | 'files'

  const getStatusBadge = () => {
    if (escrow.status === 'FUNDED' && escrow.accepted) {
      return <span className="status-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid #3b82f6' }}>🔵 Secured</span>;
    }
    switch (escrow.status) {
      case 'FUNDED':
        return <span className="status-badge" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af', border: '1px solid #6b7280' }}>⚪ Pending</span>;
      case 'RELEASED':
      case 'RESOLVED':
        return <span className="status-badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid #22c55e' }}>🟢 Completed</span>;
      case 'DISPUTED':
        return <span className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid #ef4444' }}>🔴 Mediation</span>;
      case 'CANCELLED':
        return <span className="status-badge">Cancelled</span>;
      default:
        return <span className="status-badge">{escrow.status?.toString()}</span>;
    }
  };

  const formatAddr = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleAccept = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.acceptEscrow(escrow.id);
      await tx.wait();
      showToast('success', "Escrow accepted!");
      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        showToast('error', `Failed to accept: ${reason}`);
      }
    }
    setLoading(false);
  };

  const handleRelease = async () => {
    if (!contract) return;
    // If the provider hasn't accepted yet, require an explicit acknowledgement
    // (releasing now pays directly and gives up the escrow protection).
    if (!escrow.accepted) {
      setReleaseAck(false);
      setShowReleaseModal(true);
      return;
    }
    await executeRelease();
  };

  const executeRelease = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.releaseFunds(escrow.id);
      await tx.wait();
      showToast('success', "Funds released!");

      const kolRef = localStorage.getItem('joob_ref');
      if (kolRef) {
        track('Escrow_Completed', { kol: kolRef });
      }

      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        showToast('error', `Failed to release: ${reason}`);
      }
    }
    setLoading(false);
  };

  const handleOpenDispute = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.openDispute(escrow.id, ethers.ZeroHash);
      await tx.wait();
      showToast('success', "Dispute opened!");
      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        showToast('error', `Failed to open dispute: ${reason}`);
      }
    }
    setLoading(false);
  };

  const handleStaleResolution = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.resolveStaleDispute(escrow.id);
      await tx.wait();
      showToast('success', "Stale dispute resolved 50/50!");
      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        showToast('error', `Failed to resolve: ${reason}`);
      }
    }
    setLoading(false);
  };

  const handleAdminResolve = async () => {
    setShowResolveModal(true);
  };

  const executeAdminResolve = async () => {
    if (!contract) return;
    
    const providerBps = resolvePercent * 100;
    
    setLoading(true);
    try {
      const tx = await contract.resolveDispute(escrow.id, providerBps);
      await tx.wait();
      showToast('success', `Dispute resolved! ${niche.lexicon.provider} will receive ${resolvePercent}% and ${niche.lexicon.client} will get back ${100 - resolvePercent}%.`);
      setShowResolveModal(false);
      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        showToast('error', `Failed to resolve: ${reason}`);
      }
    }
    setLoading(false);
  };

  const handleClaimTimeout = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.claimTimeout(escrow.id);
      await tx.wait();
      showToast('success', "Timeout claimed!");
      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        showToast('error', `Failed to claim timeout: ${reason}`);
      }
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.cancelEscrow(escrow.id);
      await tx.wait();
      showToast('success', "Escrow cancelled!");
      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        showToast('error', `Failed to cancel: ${reason}`);
      }
    }
    setLoading(false);
  };

  const isClient = account && escrow.client && account.toLowerCase() === escrow.client.toLowerCase();
  const isProvider = account && escrow.provider && account.toLowerCase() === escrow.provider.toLowerCase();
  const [nowSec, setNowSec] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNowSec(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 10000);
    return () => clearInterval(interval);
  }, []);

  const getExplorerLink = () => {
    if (!niche || !niche.contractAddress) return null;
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '56';
    if (chainId === '56') return `https://bscscan.com/address/${niche.contractAddress}`;
    if (chainId === '97') return `https://testnet.bscscan.com/address/${niche.contractAddress}`;
    return null;
  };

  return (
    <div className={`escrow-card glass-panel ${escrow.highlighted ? 'highlight-pulse' : ''}`} id={`escrow-${escrow.id}`}>
      {escrow.actionRequired && (
        <div className="action-required-banner">
          ⚠️ {escrow.actionRequired}
        </div>
      )}
      <div className="escrow-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>Escrow #{escrow.id.toString()}</h3>
          {getExplorerLink() && (
            <a href={getExplorerLink()} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-white underline" style={{ marginTop: '4px' }}>
              View Contract on BscScan
            </a>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Timeline */}
      <div className="escrow-timeline my-4 p-3 bg-black/20 rounded-lg border border-white/5">
        <div className="flex items-center text-xs font-medium text-gray-500 mb-3" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <div className={`flex flex-col items-center ${escrow.createdAt ? 'text-blue-400' : ''}`} style={{ flex: 1 }}>
            <div className={`w-3 h-3 rounded-full mb-1 ${escrow.createdAt ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 'bg-gray-700'}`}></div>
            Secured
          </div>
          <div className={`flex-1 h-px ${escrow.accepted ? 'bg-blue-400' : 'bg-gray-700'}`} style={{ minWidth: '20px' }}></div>
          <div className={`flex flex-col items-center ${escrow.accepted ? 'text-blue-400' : (escrow.status === 'FUNDED' ? 'text-gray-400' : '')}`} style={{ flex: 1 }}>
            <div className={`w-3 h-3 rounded-full mb-1 ${escrow.accepted ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 'bg-gray-700'}`}></div>
            In Progress
          </div>
          <div className={`flex-1 h-px ${['RELEASED', 'RESOLVED'].includes(escrow.status) ? 'bg-green-400' : 'bg-gray-700'}`} style={{ minWidth: '20px' }}></div>
          <div className={`flex flex-col items-center ${['RELEASED', 'RESOLVED'].includes(escrow.status) ? 'text-green-400' : (escrow.status === 'DISPUTED' ? 'text-red-400' : '')}`} style={{ flex: 1 }}>
            <div className={`w-3 h-3 rounded-full mb-1 ${['RELEASED', 'RESOLVED'].includes(escrow.status) ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : (escrow.status === 'DISPUTED' ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]' : 'bg-gray-700')}`}></div>
            Paid
          </div>
        </div>
        {escrow.timeoutDate > 0 && escrow.status !== 'RELEASED' && escrow.status !== 'RESOLVED' && escrow.status !== 'CANCELLED' && (
          <div className="text-center text-xs text-gray-400 bg-black/30 rounded py-1 px-2 mt-2 w-fit mx-auto border border-white/5">
            ⏳ Delivery Deadline: <strong className="text-white">{new Date(escrow.timeoutDate * 1000).toLocaleString()}</strong>
          </div>
        )}
      </div>
      
      <div className="escrow-body">
        <div className="escrow-row">
          <span className="label">Amount:</span>
          <span className="value amount text-gradient">{escrow.amount} {escrow.tokenSymbol}</span>
        </div>
        <div className="escrow-row">
          <span className="label">{niche.lexicon.client}:</span>
          <span className="value address">{formatAddr(escrow.client)}</span>
        </div>
        <div className="escrow-row">
          <span className="label">{niche.lexicon.provider}:</span>
          <span className="value address">{formatAddr(escrow.provider)}</span>
        </div>
      </div>
      
      <div className="escrow-footer flex flex-wrap gap-2 justify-end mt-4">
        {escrow.status === 'FUNDED' && !escrow.accepted && isProvider && (
          <button className="btn btn-primary" onClick={handleAccept} disabled={loading} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
            {loading ? 'Processing...' : 'Start Work'}
          </button>
        )}

        {escrow.status === 'FUNDED' && !escrow.accepted && isClient && (
          <button className="btn btn-outline text-red-500 border-red-500 hover:bg-red-500/10" onClick={handleCancel} disabled={loading}>
            {loading ? 'Processing...' : 'Cancel & Refund'}
          </button>
        )}

        {escrow.status === 'FUNDED' && (
          <>
            {(isClient || isProvider) && (
              <button className="btn btn-outline" onClick={handleOpenDispute} disabled={loading}>
                {loading ? 'Processing...' : 'Request Mediation'}
              </button>
            )}
            {isClient && (
              <button className="btn btn-primary" onClick={handleRelease} disabled={loading} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
                {loading ? 'Processing...' : 'Approve & Pay'}
              </button>
            )}
          </>
        )}

        {escrow.status === 'FUNDED' && escrow.accepted && isProvider && escrow.timeoutDate > 0 && nowSec > escrow.timeoutDate && (
           <button className="btn btn-primary" onClick={handleClaimTimeout} disabled={loading} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
             {loading ? 'Processing...' : 'Claim Timeout'}
           </button>
        )}



        {escrow.status === 'DISPUTED' && isOwner && (
          <div className="w-full flex justify-end mt-2">
             <button className="btn btn-primary" style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }} onClick={handleAdminResolve} disabled={loading}>
               {loading ? 'Processing...' : 'Admin: Resolve Dispute'}
             </button>
          </div>
        )}
        
        {escrow.status === 'DISPUTED' && isDisputeView && (
          <div className="w-full flex justify-end">
            {escrow.disputeOpenedAt > 0 && nowSec > (escrow.disputeOpenedAt + escrow.staleDisputeTimeout) ? (
              <button className="btn btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={handleStaleResolution} disabled={loading}>
                {loading ? 'Processing...' : 'Force 50/50 Resolution'}
              </button>
            ) : (
              <div className="text-sm text-gray-400 mt-2 text-center w-full p-2 bg-black/20 rounded">
                Stale resolution available after: {new Date((escrow.disputeOpenedAt + escrow.staleDisputeTimeout) * 1000).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
      

      {(isClient || isProvider) && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              className={`btn btn-sm ${activeTab === 'details' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab === 'details' ? {backgroundColor: niche.theme.primary, borderColor: niche.theme.primary, padding: '6px 14px', borderRadius: '8px'} : {padding: '6px 14px', borderRadius: '8px'}}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'messages' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab === 'messages' ? {backgroundColor: niche.theme.primary, borderColor: niche.theme.primary, padding: '6px 14px', borderRadius: '8px'} : {padding: '6px 14px', borderRadius: '8px'}}
              onClick={() => setActiveTab('messages')}
            >
              Activate Chat
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'files' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab === 'files' ? {backgroundColor: niche.theme.primary, borderColor: niche.theme.primary, padding: '6px 14px', borderRadius: '8px'} : {padding: '6px 14px', borderRadius: '8px'}}
              onClick={() => setActiveTab('files')}
            >
              Send Files
            </button>
          </div>

          {activeTab === 'details' && (
            <div className="text-gray-400 text-sm">
              <p>Escrow ID: {escrow.id}</p>
              {escrow.createdAt > 0 && <p>Created: {new Date(escrow.createdAt * 1000).toLocaleString()}</p>}
              {escrow.timeoutDate > 0 && <p>Delivery Deadline: {new Date(escrow.timeoutDate * 1000).toLocaleString()}</p>}
              <p className="mt-2 text-xs">No formal description provided. Use the messages tab to coordinate delivery.</p>
            </div>
          )}

          {activeTab === 'messages' && (
            <>
              <p className="text-xs text-gray-500 mb-2 text-center" title="Due to browser OPFS limits, using multiple tabs can lock the database.">⚠️ <strong>Note:</strong> Please avoid opening the chat in multiple tabs simultaneously.</p>
              <ChatBox peerAddress={isClient ? escrow.provider : escrow.client} />
            </>
          )}

          {activeTab === 'files' && (
            <div className="text-gray-500 text-sm italic text-center py-4 border border-dashed border-gray-700 rounded-lg">
              File attachments coming soon...
            </div>
          )}
        </div>
      )}

      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{position: 'fixed'}}>
          <div className="glass-panel p-6 max-w-md w-full mx-4" style={{border: '1px solid #f59e0b', background: '#0d0f17', backdropFilter: 'none'}}>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#f59e0b' }}>
              ⚠️ Release without acceptance?
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              <strong>{niche.lexicon.provider}</strong> has not accepted this escrow yet.
              If you release the funds now, you <strong>pay directly</strong> and give up
              the escrow protection (delivery verification, recourse in case of a dispute).
              This action is <strong>irreversible</strong>.
            </p>

            <label className="flex items-start gap-3 text-sm text-gray-200 mb-6 cursor-pointer p-3 rounded-lg" style={{background: 'rgba(0,0,0,0.3)'}}>
              <input
                type="checkbox"
                checked={releaseAck}
                onChange={(e) => setReleaseAck(e.target.checked)}
                style={{ marginTop: '3px', accentColor: '#f59e0b', width: '16px', height: '16px' }}
              />
              <span>
                I understand that I am releasing the funds without escrow protection, and I
                confirm I want to do this.
              </span>
            </label>

            <div className="flex gap-3 justify-end">
              <button className="btn btn-outline" onClick={() => setShowReleaseModal(false)} disabled={loading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => { setShowReleaseModal(false); await executeRelease(); }}
                disabled={loading || !releaseAck}
                style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', opacity: releaseAck ? 1 : 0.5 }}
              >
                {loading ? 'Processing...' : 'Release funds'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{position: 'fixed'}}>
          <div className="glass-panel p-6 max-w-md w-full mx-4" style={{border: `1px solid ${niche.theme.primary}`, background: '#0d0f17', backdropFilter: 'none'}}>
            <h3 className="text-xl font-bold mb-4 text-gradient" style={{ backgroundImage: `linear-gradient(to right, ${niche.theme.primary}, #fff)` }}>
              Resolve Dispute
            </h3>
            <p className="text-gray-300 text-sm mb-6">
              Adjust the slider to set the percentage of funds the <strong>{niche.lexicon.provider}</strong> will receive. The remaining balance will be refunded to the {niche.lexicon.client}.
            </p>
            
            <div className="mb-6 p-4 rounded-xl" style={{background: 'rgba(0,0,0,0.3)'}}>
              <div className="flex justify-between text-sm mb-4 font-semibold">
                <span className="text-gray-400">{niche.lexicon.client}: {100 - resolvePercent}%</span>
                <span style={{color: niche.theme.primary}}>{niche.lexicon.provider}: {resolvePercent}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={resolvePercent} 
                onChange={(e) => setResolvePercent(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{accentColor: niche.theme.primary}}
              />
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button className="btn btn-outline" onClick={() => setShowResolveModal(false)} disabled={loading}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={executeAdminResolve} 
                disabled={loading}
                style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}
              >
                {loading ? 'Processing...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

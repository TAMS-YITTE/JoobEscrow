'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { useEscrowContract } from '../hooks/useEscrowContract';
import dynamic from 'next/dynamic';
import './EscrowCard.css';

const ChatBox = dynamic(() => import('./ChatBox'), { ssr: false });

export default function EscrowCard({ escrow, isDisputeView }) {
  const { account } = useWeb3();
  const contract = useEscrowContract();
  const niche = useNiche();
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const getStatusBadge = () => {
    if (escrow.status === 'FUNDED' && escrow.accepted) {
      return <span className="status-badge status-funded">Accepted</span>;
    }
    switch (escrow.status) {
      case 'FUNDED':
        return <span className="status-badge status-funded">Funded</span>;
      case 'RELEASED':
        return <span className="status-badge status-resolved">Released</span>;
      case 'DISPUTED':
        return <span className="status-badge status-disputed">Disputed</span>;
      case 'RESOLVED':
        return <span className="status-badge status-resolved">Resolved</span>;
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
      alert("Escrow accepted!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        alert(`Failed to accept: ${reason}`);
      }
    }
    setLoading(false);
  };

  const handleRelease = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.releaseFunds(escrow.id);
      await tx.wait();
      alert("Funds released!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        alert(`Failed to release: ${reason}`);
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
      alert("Dispute opened!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        alert(`Failed to open dispute: ${reason}`);
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
      alert("Stale dispute resolved 50/50!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        alert(`Failed to resolve: ${reason}`);
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
      alert("Timeout claimed!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        alert(`Failed to claim timeout: ${reason}`);
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
      alert("Escrow cancelled!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
        alert(`Failed to cancel: ${reason}`);
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
      <div className="escrow-timeline my-4">
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
          <div className={`flex flex-col items-center ${escrow.createdAt ? 'text-green-400' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-current mb-1"></span>
            Created
          </div>
          <div className="flex-1 h-px bg-gray-800 mx-2"></div>
          <div className={`flex flex-col items-center ${escrow.accepted ? 'text-green-400' : (escrow.status === 'FUNDED' ? 'text-yellow-400' : '')}`}>
            <span className="w-2 h-2 rounded-full bg-current mb-1"></span>
            Accepted
          </div>
          <div className="flex-1 h-px bg-gray-800 mx-2"></div>
          <div className={`flex flex-col items-center ${['RELEASED', 'RESOLVED'].includes(escrow.status) ? 'text-green-400' : (escrow.status === 'DISPUTED' ? 'text-red-400' : '')}`}>
            <span className="w-2 h-2 rounded-full bg-current mb-1"></span>
            Completed
          </div>
        </div>
        {escrow.timeoutDate > 0 && escrow.status !== 'RELEASED' && escrow.status !== 'RESOLVED' && escrow.status !== 'CANCELLED' && (
          <div className="text-center text-xs mt-2 text-gray-400">
            ⏳ Timeout: {new Date(escrow.timeoutDate * 1000).toLocaleString()}
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
            {loading ? 'Processing...' : 'Accept'}
          </button>
        )}

        {escrow.status === 'FUNDED' && !escrow.accepted && isClient && (
          <button className="btn btn-outline text-red-500 border-red-500 hover:bg-red-500/10" onClick={handleCancel} disabled={loading}>
            {loading ? 'Processing...' : 'Cancel (Refund)'}
          </button>
        )}

        {escrow.status === 'FUNDED' && (
          <>
            {(isClient || isProvider) && (
              <button className="btn btn-outline" onClick={handleOpenDispute} disabled={loading}>
                {loading ? 'Processing...' : 'Open Dispute'}
              </button>
            )}
            {isClient && (
              <button className="btn btn-primary" onClick={handleRelease} disabled={loading} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
                {loading ? 'Processing...' : 'Release Funds'}
              </button>
            )}
          </>
        )}

        {escrow.status === 'FUNDED' && escrow.accepted && isProvider && escrow.timeoutDate > 0 && nowSec > escrow.timeoutDate && (
           <button className="btn btn-primary" onClick={handleClaimTimeout} disabled={loading} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
             {loading ? 'Processing...' : 'Claim Timeout'}
           </button>
        )}

        {(isClient || isProvider) && (
          <button className="btn btn-outline" style={{ marginLeft: 'auto' }} onClick={() => setShowChat(!showChat)}>
            {showChat ? 'Hide Chat' : '💬 Chat'}
          </button>
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
      
      {showChat && (isClient || isProvider) && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <ChatBox peerAddress={isClient ? escrow.provider : escrow.client} />
        </div>
      )}
    </div>
  );
}

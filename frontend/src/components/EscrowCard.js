'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { useEscrowContract } from '../hooks/useEscrowContract';
import './EscrowCard.css';

export default function EscrowCard({ escrow, isDisputeView }) {
  const { account } = useWeb3();
  const contract = useEscrowContract();
  const niche = useNiche();
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FUNDED':
      case 0n:
      case 0:
        return <span className="status-badge status-funded">Funded</span>;
      case 'ACCEPTED':
      case 1n:
      case 1:
        return <span className="status-badge status-funded">Accepted</span>;
      case 'DISPUTED':
      case 2n:
      case 2:
        return <span className="status-badge status-disputed">Disputed</span>;
      case 'RESOLVED':
      case 3n:
      case 3:
        return <span className="status-badge status-resolved">Resolved</span>;
      case 'CANCELLED':
      case 4n:
      case 4:
        return <span className="status-badge">Cancelled</span>;
      default:
        return <span className="status-badge">{status.toString()}</span>;
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

  const isClient = account && escrow.client && account.toLowerCase() === escrow.client.toLowerCase();
  const isProvider = account && escrow.provider && account.toLowerCase() === escrow.provider.toLowerCase();

  return (
    <div className="escrow-card glass-panel">
      <div className="escrow-header">
        <h3>Escrow #{escrow.id.toString()}</h3>
        {getStatusBadge(escrow.status)}
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
      
      <div className="escrow-footer">
        {(escrow.status === 'FUNDED' || escrow.status === 0n) && isProvider && (
          <button className="btn btn-primary" onClick={handleAccept} disabled={loading} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
            {loading ? 'Processing...' : 'Accept'}
          </button>
        )}

        {(escrow.status === 'ACCEPTED' || escrow.status === 1n || escrow.status === 'FUNDED') && (
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

        {(escrow.status === 'DISPUTED' || escrow.status === 2n || escrow.status === 2) && isDisputeView && (
          <button className="btn btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={handleStaleResolution} disabled={loading}>
            {loading ? 'Processing...' : 'Force 50/50 Resolution'}
          </button>
        )}
      </div>
    </div>
  );
}

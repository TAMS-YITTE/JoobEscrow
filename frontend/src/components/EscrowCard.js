'use client';

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { useEscrowContract } from '../hooks/useEscrowContract';
import { useToast } from '../context/ToastContext';
import { track } from '@vercel/analytics';
import dynamic from 'next/dynamic';
import './EscrowCard.css';
import { readEscrowReference } from '../lib/escrowReference';
import { isUserRejection } from '../lib/walletErrors';
import { TOKEN_ADDRESSES } from '../config/contract';
import { GAS_TOPUP_BNB, LOW_GAS_BNB } from '../config/gas';

const ChatBox = dynamic(() => import('./ChatBox'), { ssr: false });

export default function EscrowCard({ escrow, isDisputeView, isOwner, onUpdate, defaultExpanded = false, onReference }) {
  const { account, signer, readProvider, ensureCorrectChain } = useWeb3();
  const contract = useEscrowContract();
  const niche = useNiche();
  // Reference gravee dans la transaction de creation (si le client en a saisi une).
  const [reference, setReference] = useState(null);
  const onReferenceRef = useRef(onReference);
  useEffect(() => {
    onReferenceRef.current = onReference;
  }, [onReference]);
  useEffect(() => {
    if (!readProvider || !niche?.contractAddress || !escrow?.createdAt) return;
    let cancelled = false;
    readEscrowReference(readProvider, niche.contractAddress, escrow.id.toString(), escrow.createdAt)
      .then((r) => {
        if (!cancelled) {
          setReference(r);
          if (r && onReferenceRef.current) onReferenceRef.current(r, escrow?.key);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [readProvider, niche?.contractAddress, escrow?.id, escrow?.createdAt, escrow?.key]);

  const [loading, setLoading] = useState(false);
  // Action en cours (seul le bouton clique affiche « Processing... ») : accept | release | dispute | stale | admin | timeout | cancel.
  const [busy, setBusy] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  // Libelle du client dans la fenetre « Decline » (la demo nomme ses roles « Client wallet »).
  const clientWord = niche.isDemo ? 'client' : niche.lexicon.client.toLowerCase();
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvePercent, setResolvePercent] = useState(50);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseAck, setReleaseAck] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  // Confirmation avant les actions irreversibles sans fenetre dediee : 'cancel' | 'stale' | null.
  const [confirmAction, setConfirmAction] = useState(null);
  const { showToast } = useToast();

  const [isExpanded, setIsExpanded] = useState(Boolean(defaultExpanded));
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'messages' | 'files'
  const drawerRef = useRef(null);

  const isClient = account && escrow.client && account.toLowerCase() === escrow.client.toLowerCase();
  const isProvider = account && escrow.provider && account.toLowerCase() === escrow.provider.toLowerCase();
  const [nowSec, setNowSec] = useState(0);

  // Aide au gas : le client voit si le prestataire n'a pas assez de BNB pour agir (Accept, Claim,
  // litige) et peut lui en envoyer. Pas en demo : les deux wallets appartiennent au testeur.
  const [providerLowGas, setProviderLowGas] = useState(false);
  useEffect(() => {
    if (!isClient || niche.isDemo || !readProvider || !escrow.provider) return;
    let cancelled = false;
    (async () => {
      try {
        let needsGas = ['FUNDED', 'DISPUTED'].includes(escrow.status);
        if (['RELEASED', 'RESOLVED'].includes(escrow.status)) {
          // Apres liberation, utile seulement si le prestataire n'a pas encore retire ses fonds.
          const c = new ethers.Contract(niche.contractAddress, ['function withdrawable(address,address) view returns (uint256)'], readProvider);
          needsGas = (await c.withdrawable(escrow.provider, TOKEN_ADDRESSES[escrow.tokenSymbol])) > 0n;
        }
        if (!needsGas) return;
        const bal = await readProvider.getBalance(escrow.provider);
        if (!cancelled) setProviderLowGas(bal < ethers.parseEther(LOW_GAS_BNB));
      } catch {
        /* lecture impossible : pas de proposition */
      }
    })();
    return () => { cancelled = true; };
  }, [isClient, niche.isDemo, niche.contractAddress, readProvider, escrow.provider, escrow.status, escrow.tokenSymbol]);

  const handleSendGas = async () => {
    if (!signer) return;
    setBusy('gas');
    try {
      await ensureCorrectChain();
      const tx = await signer.sendTransaction({ to: escrow.provider, value: ethers.parseEther(GAS_TOPUP_BNB) });
      await tx.wait();
      showToast('success', `${GAS_TOPUP_BNB} BNB sent to the ${niche.lexicon.provider.toLowerCase()} for network fees.`);
      setProviderLowGas(false);
    } catch (err) {
      console.error(err);
      if (!isUserRejection(err)) showToast('error', `Failed to send BNB: ${err.shortMessage || err.message}`);
    }
    setBusy(null);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNowSec(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 10000);
    return () => clearInterval(interval);
  }, []);

  const isExpired = escrow.status === 'FUNDED' && escrow.accepted && escrow.timeoutDate > 0 && nowSec > 0 && nowSec > escrow.timeoutDate;

  const getStatusBadge = () => {
    if (escrow.status === 'FUNDED') {
      if (!escrow.accepted) {
        return (
          <span className="escrow-badge escrow-badge--awaiting">
            <span className="escrow-badge-dot" aria-hidden="true" />
            Awaiting acceptance
          </span>
        );
      }
      if (isExpired) {
        return (
          <span className="escrow-badge escrow-badge--expired">
            <span className="escrow-badge-dot" aria-hidden="true" />
            Deadline passed
          </span>
        );
      }
      return (
        <span className="escrow-badge escrow-badge--progress">
          <span className="escrow-badge-dot" aria-hidden="true" />
          In progress
        </span>
      );
    }
    switch (escrow.status) {
      case 'RELEASED':
      case 'RESOLVED':
        return (
          <span className="escrow-badge escrow-badge--completed">
            <span className="escrow-badge-dot" aria-hidden="true" />
            Completed
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="escrow-badge escrow-badge--mediation">
            <span className="escrow-badge-dot" aria-hidden="true" />
            In mediation
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="escrow-badge escrow-badge--cancelled">
            <span className="escrow-badge-dot" aria-hidden="true" />
            Cancelled
          </span>
        );
      default:
        return <span className="escrow-badge escrow-badge--cancelled">{escrow.status?.toString()}</span>;
    }
  };

  const formatAddr = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const copyDealLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/deal/${niche.slug}/${escrow.id.toString()}`);
    showToast('success', 'Deal link copied: viewable without a wallet');
  };

  const handleOpenChat = () => {
    setIsExpanded(true);
    setActiveTab('messages');
    setTimeout(() => {
      drawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  const handleAccept = async () => {
    if (!contract) return;
    setLoading(true);
    setBusy('accept');
    try {
      await ensureCorrectChain();
      const tx = await contract.acceptEscrow(escrow.id);
      await tx.wait();
      showToast('success', "Escrow accepted!");
      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!isUserRejection(err)) {
        showToast('error', `Failed to accept: ${reason}`);
      }
    }
    setLoading(false);
    setBusy(null);
  };

  const handleRelease = async () => {
    if (!contract) return;
    // Toujours demander confirmation avant liberation des fonds (avec case obligatoire si non accepte).
    setReleaseAck(Boolean(escrow.accepted));
    setShowReleaseModal(true);
  };

  const executeRelease = async () => {
    if (!contract) return;
    setLoading(true);
    setBusy('release');
    try {
      await ensureCorrectChain();
      const tx = await contract.releaseFunds(escrow.id);
      await tx.wait();
      showToast('success', "Funds released!");

      const kolRef = localStorage.getItem('joob_ref');
      if (kolRef) {
        track('Escrow_Completed', { kol: kolRef });
        localStorage.removeItem('joob_ref');
      }

      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!isUserRejection(err)) {
        showToast('error', `Failed to release: ${reason}`);
      }
    }
    setLoading(false);
    setBusy(null);
  };

  const handleOpenDispute = () => {
    if (!contract) return;
    setShowDisputeModal(true);
  };

  const executeOpenDispute = async () => {
    if (!contract) return;
    setLoading(true);
    setBusy('dispute');
    try {
      await ensureCorrectChain();
      const tx = await contract.openDispute(escrow.id, ethers.ZeroHash);
      await tx.wait();
      showToast('success', "Dispute opened!");
      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!isUserRejection(err)) {
        showToast('error', `Failed to open dispute: ${reason}`);
      }
    }
    setLoading(false);
    setBusy(null);
  };

  const handleStaleResolution = async () => {
    if (!contract) return;
    setLoading(true);
    setBusy('stale');
    try {
      await ensureCorrectChain();
      const tx = await contract.resolveStaleDispute(escrow.id);
      await tx.wait();
      showToast('success', "Stale dispute resolved 50/50!");

      const kolRef = localStorage.getItem('joob_ref');
      if (kolRef) {
        track('Escrow_Completed', { kol: kolRef });
        localStorage.removeItem('joob_ref');
      }

      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!isUserRejection(err)) {
        showToast('error', `Failed to resolve: ${reason}`);
      }
    }
    setLoading(false);
    setBusy(null);
  };

  const handleAdminResolve = async () => {
    setShowResolveModal(true);
  };

  const executeAdminResolve = async () => {
    if (!contract) return;
    const providerBps = resolvePercent * 100;
    setLoading(true);
    setBusy('admin');
    try {
      await ensureCorrectChain();
      const tx = await contract.resolveDispute(escrow.id, providerBps);
      await tx.wait();
      showToast('success', `Dispute resolved! ${niche.lexicon.provider} will receive ${resolvePercent}% and ${niche.lexicon.client} will get back ${100 - resolvePercent}%.`);
      setShowResolveModal(false);

      const kolRef = localStorage.getItem('joob_ref');
      if (kolRef) {
        track('Escrow_Completed', { kol: kolRef });
        localStorage.removeItem('joob_ref');
      }

      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!isUserRejection(err)) {
        showToast('error', `Failed to resolve: ${reason}`);
      }
    }
    setLoading(false);
    setBusy(null);
  };

  const handleClaimTimeout = async () => {
    if (!contract) return;
    setLoading(true);
    setBusy('timeout');
    try {
      await ensureCorrectChain();
      const tx = await contract.claimTimeout(escrow.id);
      await tx.wait();
      showToast('success', "Timeout claimed!");

      const kolRef = localStorage.getItem('joob_ref');
      if (kolRef) {
        track('Escrow_Completed', { kol: kolRef });
        localStorage.removeItem('joob_ref');
      }

      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!isUserRejection(err)) {
        showToast('error', `Failed to claim timeout: ${reason}`);
      }
    }
    setLoading(false);
    setBusy(null);
  };

  const handleCancel = async () => {
    if (!contract) return;
    setLoading(true);
    setBusy('cancel');
    try {
      await ensureCorrectChain();
      const tx = await contract.cancelEscrow(escrow.id);
      await tx.wait();
      showToast('success', "Escrow cancelled!");
      setTimeout(() => { if (onUpdate) onUpdate(); else window.location.reload(); }, 1500);
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!isUserRejection(err)) {
        showToast('error', `Failed to cancel: ${reason}`);
      }
    }
    setLoading(false);
    setBusy(null);
  };

  const getExplorerLink = () => {
    if (!niche || !niche.contractAddress) return null;
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '56';
    if (chainId === '56') return `https://bscscan.com/address/${niche.contractAddress}`;
    if (chainId === '97') return `https://testnet.bscscan.com/address/${niche.contractAddress}`;
    return null;
  };

  const isCompleted = ['RELEASED', 'RESOLVED'].includes(escrow.status);
  const isCancelled = escrow.status === 'CANCELLED';
  const isDisputed = escrow.status === 'DISPUTED';

  const step1Done = escrow.accepted || isCompleted || isDisputed;
  const step1Active = escrow.status === 'FUNDED' && !escrow.accepted;
  // Libellé dynamique de la 1re étape : en attente tant que non accepté, « Accepted » une fois franchie, « Cancelled » si annulé avant acceptation
  const step1Label = step1Done ? 'Accepted' : isCancelled ? 'Cancelled' : 'Awaiting acceptance';

  let step2Label = 'In progress';
  let step2Class = '';
  if (isDisputed) {
    step2Label = 'In mediation';
    step2Class = 'is-danger';
  } else if (isExpired) {
    step2Label = 'Deadline passed';
    step2Class = 'is-warn';
  } else if (isCompleted) {
    step2Label = 'In progress';
    step2Class = 'is-done';
  } else if (escrow.status === 'FUNDED' && escrow.accepted) {
    step2Label = 'In progress';
    step2Class = 'is-active';
  }

  const feeLabel = niche.isDemo ? 'Demo · 0% fee' : `${niche.feeTier}% fee`;
  const roleLabel = isClient ? 'You are the client' : isProvider ? 'You are the provider' : null;

  return (
    <div className={`escrow-card ${escrow.highlighted ? 'highlight-pulse' : ''}`} id={`escrow-${escrow.id}`}>
      {escrow.actionRequired && (
        <div className="action-required-banner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{escrow.actionRequired}</span>
        </div>
      )}

      <div className="escrow-header">
        <div className="escrow-header-left">
          <div className="escrow-title-row">
            <h3>Escrow #{escrow.id.toString()}</h3>
            <span className="escrow-meta-tag">{feeLabel}</span>
            {roleLabel && <span className="escrow-meta-tag">{roleLabel}</span>}
          </div>
          {reference && <span className="escrow-reference">{reference}</span>}
        </div>
        {getStatusBadge()}
      </div>

      <div className="escrow-summary">
        <div className="escrow-amount-block">
          <div className="value amount tabular-nums">
            {escrow.amount}
            <span className="token-sym">{escrow.tokenSymbol}</span>
          </div>
          {escrow.timeoutDate > 0 && !isCompleted && !isCancelled && (
            <div className={`escrow-deadline ${isExpired ? 'is-expired' : ''}`}>
              {isExpired ? 'Deadline passed: ' : 'Deadline: '}
              {new Date(escrow.timeoutDate * 1000).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="escrow-body">
          <div className="escrow-party">
            <span className="label">{niche.lexicon.client}</span>
            <span className="value address">
              {formatAddr(escrow.client)}
              {isClient && <span className="you-tag">You</span>}
            </span>
          </div>
          <div className="escrow-party">
            <span className="label">{niche.lexicon.provider}</span>
            <span className="value address">
              {formatAddr(escrow.provider)}
              {isProvider && <span className="you-tag">You</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Frise / Timeline */}
      <div className="escrow-timeline">
        <div className="timeline-track">
          <div className={`timeline-step ${step1Done ? 'is-done' : step1Active ? 'is-active' : ''}`}>
            <span className="timeline-node" aria-hidden="true">
              {step1Done ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              )}
            </span>
            <span className="timeline-label">{step1Label}</span>
          </div>

          {!isCancelled && (<>
          <div className={`timeline-line ${step1Done ? 'is-done' : ''}`} />

          <div className={`timeline-step ${step2Class}`}>
            <span className="timeline-node" aria-hidden="true">
              {isCompleted ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              )}
            </span>
            <span className="timeline-label">{step2Label}</span>
          </div>

          <div className={`timeline-line ${isCompleted ? 'is-done' : isDisputed ? 'is-danger' : ''}`} />

          <div className={`timeline-step ${isCompleted ? 'is-done' : ''}`}>
            <span className="timeline-node" aria-hidden="true">
              {isCompleted ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              )}
            </span>
            <span className="timeline-label">Completed</span>
          </div>
          </>)}
        </div>
      </div>

      {/* Footer: Details toggle + Role-based Actions */}
      <div className="escrow-footer">
        <button
          type="button"
          className="escrow-details-toggle"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Hide details & chat ▴' : 'View details & chat ▾'}</span>
        </button>

        <div className="escrow-actions">
          {/* 1. Awaiting acceptance */}
          {escrow.status === 'FUNDED' && !escrow.accepted && isProvider && (
            <>
              {/* Le contrat V4 n'a pas de refus on-chain : « Decline » explique que le client peut annuler. */}
              <button type="button" className="btn btn-app-secondary" onClick={() => setShowDeclineModal(true)} disabled={loading}>
                Decline
              </button>
              <button className="btn btn-app-primary" onClick={handleAccept} disabled={loading}>
                {busy === 'accept' ? 'Processing...' : 'Accept'}
              </button>
            </>
          )}

          {escrow.status === 'FUNDED' && !escrow.accepted && isClient && (
            <>
              <button type="button" className="btn btn-app-secondary" onClick={copyDealLink}>
                Copy invite link
              </button>
              <button className="btn btn-app-danger" onClick={() => setConfirmAction('cancel')} disabled={loading}>
                {busy === 'cancel' ? 'Processing...' : 'Cancel & refund'}
              </button>
            </>
          )}

          {/* 2. In progress (not expired) */}
          {escrow.status === 'FUNDED' && escrow.accepted && !isExpired && isClient && (
            <>
              <button className="btn btn-app-danger" onClick={handleOpenDispute} disabled={loading}>
                {busy === 'dispute' ? 'Processing...' : 'Open dispute'}
              </button>
              <button className="btn btn-app-primary" onClick={handleRelease} disabled={loading}>
                {busy === 'release' ? 'Processing...' : 'Release'}
              </button>
            </>
          )}

          {escrow.status === 'FUNDED' && escrow.accepted && !isExpired && isProvider && (
            <>
              <button className="btn btn-app-danger" onClick={handleOpenDispute} disabled={loading}>
                {busy === 'dispute' ? 'Processing...' : 'Open dispute'}
              </button>
              <button type="button" className="btn btn-app-secondary" onClick={handleOpenChat}>
                Open chat
              </button>
            </>
          )}

          {/* 3. Deadline passed */}
          {escrow.status === 'FUNDED' && escrow.accepted && isExpired && isProvider && (
            <>
              <button className="btn btn-app-danger" onClick={handleOpenDispute} disabled={loading}>
                {busy === 'dispute' ? 'Processing...' : 'Open dispute'}
              </button>
              <button className="btn btn-app-primary" onClick={handleClaimTimeout} disabled={loading}>
                {busy === 'timeout' ? 'Processing...' : 'Claim timeout'}
              </button>
            </>
          )}

          {escrow.status === 'FUNDED' && escrow.accepted && isExpired && isClient && (
            <>
              <button className="btn btn-app-danger" onClick={handleOpenDispute} disabled={loading}>
                {busy === 'dispute' ? 'Processing...' : 'Open dispute'}
              </button>
              <button className="btn btn-app-primary" onClick={handleRelease} disabled={loading}>
                {busy === 'release' ? 'Processing...' : 'Release'}
              </button>
            </>
          )}

          {/* 4. In mediation */}
          {isDisputed && (isClient || isProvider) && (
            <button type="button" className="btn btn-app-secondary" onClick={handleOpenChat}>
              Open chat
            </button>
          )}

          {isDisputed && isDisputeView && (isClient || isProvider) && escrow.disputeOpenedAt > 0 && nowSec > (escrow.disputeOpenedAt + escrow.staleDisputeTimeout) && (
            <button className="btn btn-app-danger" onClick={() => setConfirmAction('stale')} disabled={loading}>
              {busy === 'stale' ? 'Processing...' : 'Force 50/50'}
            </button>
          )}

          {isDisputed && isOwner && (
            <button
              className="btn btn-app-secondary"
              style={{ borderColor: 'var(--app-yellow, #EAB308)', color: 'var(--app-yellow, #EAB308)' }}
              onClick={handleAdminResolve}
              disabled={loading}
            >
              {busy === 'admin' ? 'Processing...' : 'Admin: Resolve dispute'}
            </button>
          )}

          {/* 5. Completed / Cancelled */}
          {(isCompleted || isCancelled) && getExplorerLink() && (
            <a
              href={getExplorerLink()}
              target="_blank"
              rel="noreferrer"
              className="escrow-link-btn"
            >
              BscScan ↗
            </a>
          )}
        </div>
      </div>

      {providerLowGas && isClient && (
        <div className="escrow-gas-note">
          <span>The {niche.lexicon.provider.toLowerCase()} has no BNB to pay network fees, so they can&apos;t accept or claim yet.</span>
          <button type="button" className="btn btn-app-secondary escrow-gas-btn" onClick={handleSendGas} disabled={busy === 'gas'}>
            {busy === 'gas' ? 'Processing...' : `Send ${GAS_TOPUP_BNB} BNB`}
          </button>
        </div>
      )}

      {escrow.status === 'FUNDED' && !escrow.accepted && isClient && (
        <div className="escrow-stale-note">
          The provider has not accepted yet: you can cancel at any time and get a full refund.
        </div>
      )}

      {isDisputed && isDisputeView && (isClient || isProvider) && escrow.disputeOpenedAt > 0 && !(nowSec > (escrow.disputeOpenedAt + escrow.staleDisputeTimeout)) && (
        <div className="escrow-stale-note">
          Force 50/50 resolution available after: {new Date((escrow.disputeOpenedAt + escrow.staleDisputeTimeout) * 1000).toLocaleString()}
        </div>
      )}

      {/* Collapsible Drawer: Details / Messages / Files */}
      {isExpanded && (
        <div className="escrow-drawer" ref={drawerRef}>
          {(isClient || isProvider) && (
            <div className="escrow-tabs">
              <button
                type="button"
                className={`escrow-tab-btn ${activeTab === 'details' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                type="button"
                className={`escrow-tab-btn ${activeTab === 'messages' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('messages')}
              >
                Messages
              </button>
              <button
                type="button"
                className={`escrow-tab-btn ${activeTab === 'files' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                Files
              </button>
            </div>
          )}

          {(activeTab === 'details' || (!isClient && !isProvider)) && (
            <div className="escrow-details-pane">
              <div className="escrow-details-row">
                <span>Escrow ID</span>
                <strong>#{escrow.id.toString()}</strong>
              </div>
              <div className="escrow-details-row">
                <span>Protocol fee</span>
                <strong>{niche.feeTier}% (paid by provider)</strong>
              </div>
              {escrow.createdAt > 0 && (
                <div className="escrow-details-row">
                  <span>Created</span>
                  <strong>{new Date(escrow.createdAt * 1000).toLocaleString()}</strong>
                </div>
              )}
              {escrow.timeoutDate > 0 && (
                <div className="escrow-details-row">
                  <span>Delivery deadline</span>
                  <strong>{new Date(escrow.timeoutDate * 1000).toLocaleString()}</strong>
                </div>
              )}
              <div className="escrow-details-links">
                <button type="button" className="escrow-link-btn" onClick={copyDealLink}>
                  Copy deal link
                </button>
                {getExplorerLink() && (
                  <a href={getExplorerLink()} target="_blank" rel="noreferrer" className="escrow-link-btn">
                    View Contract on BscScan ↗
                  </a>
                )}
                {escrow.status === 'FUNDED' && !escrow.accepted && isClient && (
                  <button
                    type="button"
                    className="escrow-link-btn"
                    style={{ color: 'var(--app-text-secondary, #9CA8A1)' }}
                    onClick={handleRelease}
                    disabled={loading}
                  >
                    Release without acceptance
                  </button>
                )}
              </div>
            </div>
          )}

          {(isClient || isProvider) && activeTab === 'messages' && (
            <div>
              <p className="text-xs text-gray-500 mb-2 text-center" title="Due to browser OPFS limits, using multiple tabs can lock the database.">
                <strong>Note:</strong> Please avoid opening the chat in multiple tabs simultaneously.
              </p>
              <ChatBox peerAddress={isClient ? escrow.provider : escrow.client} />
            </div>
          )}

          {(isClient || isProvider) && activeTab === 'files' && (
            <div className="text-gray-500 text-sm italic text-center py-4 border border-dashed border-gray-700 rounded-lg">
              File attachments coming soon...
            </div>
          )}
        </div>
      )}

      {showReleaseModal && (
        <div className="escrow-modal-backdrop">
          <div className="escrow-modal-box" style={{ borderColor: escrow.accepted ? 'var(--app-lime, #A3E635)' : 'var(--app-yellow, #EAB308)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: escrow.accepted ? 'var(--app-text-primary, #F2F5F3)' : 'var(--app-yellow, #EAB308)' }}>
              {escrow.accepted ? 'Confirm funds release' : 'Release without acceptance?'}
            </h3>
            <div className="escrow-modal-body">
            {escrow.accepted ? (
              <>
                <p className="text-gray-300 text-sm mb-6">
                  You are about to release <strong>{escrow.amount} {escrow.tokenSymbol}</strong> to <strong>{niche.lexicon.provider}</strong> ({formatAddr(escrow.provider)}).
                  Once released, the funds are credited to their withdrawable balance and this action cannot be undone.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-300 text-sm mb-4">
                  <strong>{niche.lexicon.provider}</strong> has not accepted this escrow yet.
                  If you release the funds now, you <strong>pay directly</strong> and give up
                  the escrow protection (delivery verification, recourse in case of a dispute).
                  This action is <strong>irreversible</strong>.
                </p>

                <label className="flex items-start gap-3 text-sm text-gray-200 mb-6 cursor-pointer p-3 rounded-lg" style={{ background: 'var(--app-surface-2, #171E1A)' }}>
                  <input
                    type="checkbox"
                    checked={releaseAck}
                    onChange={(e) => setReleaseAck(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: 'var(--app-yellow, #EAB308)', width: '16px', height: '16px' }}
                  />
                  <span>
                    I understand that I am releasing the funds without escrow protection, and I
                    confirm I want to do this.
                  </span>
                </label>
              </>
            )}
            </div>

            <div className="escrow-modal-actions flex gap-3 justify-end">
              <button className="btn btn-app-secondary" onClick={() => setShowReleaseModal(false)} disabled={loading}>
                Cancel
              </button>
              <button
                className="btn btn-app-primary"
                onClick={async () => { setShowReleaseModal(false); await executeRelease(); }}
                disabled={loading || !releaseAck}
                style={!escrow.accepted ? { backgroundColor: 'var(--app-yellow, #EAB308)', borderColor: 'var(--app-yellow, #EAB308)', opacity: releaseAck ? 1 : 0.5 } : undefined}
              >
                {busy === 'release' ? 'Processing...' : 'Release funds'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeclineModal && (
        <div className="escrow-modal-backdrop">
          <div className="escrow-modal-box" style={{ borderColor: 'var(--app-border-default, #2A362E)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--app-text-primary, #F2F5F3)' }}>
              Decline this escrow?
            </h3>
            <div className="escrow-modal-body">
            <p className="text-gray-300 text-sm mb-6">
              No transaction is sent and the escrow stays open. Only the {clientWord} can cancel and get the <strong>{escrow.amount} {escrow.tokenSymbol}</strong> back: let them know in the chat.
            </p>
            </div>
            <div className="escrow-modal-actions flex flex-wrap gap-3 justify-end">
              <button type="button" className="btn btn-app-secondary" onClick={() => setShowDeclineModal(false)}>
                Close
              </button>
              <button type="button" className="btn btn-app-primary" onClick={() => { setShowDeclineModal(false); handleOpenChat(); }}>
                Tell the {clientWord} in the chat
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="escrow-modal-backdrop">
          <div className="escrow-modal-box" style={{ borderColor: 'var(--app-red, #EF4444)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--app-text-primary, #F2F5F3)' }}>
              {confirmAction === 'cancel' ? 'Cancel this escrow?' : 'Force a 50/50 split?'}
            </h3>
            <div className="escrow-modal-body">
            <p className="text-gray-300 text-sm mb-6">
              {confirmAction === 'cancel'
                ? <>The full <strong>{escrow.amount} {escrow.tokenSymbol}</strong> is credited back to your withdrawable balance and the {niche.lexicon.provider.toLowerCase()} can no longer accept. This action cannot be undone.</>
                : <>The dispute has been open for more than 30 days. <strong>{escrow.amount} {escrow.tokenSymbol}</strong> is split in half: 50% to the {niche.lexicon.client.toLowerCase()}, 50% to the {niche.lexicon.provider.toLowerCase()}{niche.feeTier > 0 ? ` (the ${niche.feeTier}% fee applies to the provider's share)` : ''}. This action cannot be undone.</>}
            </p>
            </div>
            <div className="escrow-modal-actions flex gap-3 justify-end">
              <button type="button" className="btn btn-app-secondary" onClick={() => setConfirmAction(null)} disabled={loading}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-app-danger"
                style={{ backgroundColor: 'var(--app-red, #EF4444)', color: '#fff', borderColor: 'var(--app-red, #EF4444)' }}
                onClick={async () => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  if (action === 'cancel') await handleCancel(); else await handleStaleResolution();
                }}
                disabled={loading}
              >
                {confirmAction === 'cancel' ? 'Cancel & refund' : 'Confirm 50/50 split'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="escrow-modal-backdrop">
          <div className="escrow-modal-box" style={{ borderColor: 'var(--app-red, #EF4444)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--app-red, #EF4444)' }}>
              Open a dispute?
            </h3>
            <div className="escrow-modal-body">
            <p className="text-gray-300 text-sm mb-4">
              Opening a dispute freezes <strong>{escrow.amount} {escrow.tokenSymbol}</strong> in the smart contract until settled by mediation (or until either party triggers a 50/50 split after 30 days).
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Most delivery issues are resolved faster by messaging your counterparty directly in the encrypted chat first.
            </p>
            </div>
            <div className="escrow-modal-actions flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                className="btn btn-app-secondary"
                onClick={() => setShowDisputeModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-app-secondary"
                style={{ borderColor: 'var(--app-lime, #A3E635)', color: 'var(--app-lime, #A3E635)' }}
                onClick={() => {
                  setShowDisputeModal(false);
                  handleOpenChat();
                }}
                disabled={loading}
              >
                Open chat first
              </button>
              <button
                type="button"
                className="btn btn-app-danger"
                style={{ backgroundColor: 'var(--app-red, #EF4444)', color: '#fff', borderColor: 'var(--app-red, #EF4444)' }}
                onClick={async () => {
                  setShowDisputeModal(false);
                  await executeOpenDispute();
                }}
                disabled={loading}
              >
                {busy === 'dispute' ? 'Processing...' : 'Confirm & open dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div className="escrow-modal-backdrop">
          <div className="escrow-modal-box" style={{ borderColor: 'var(--app-lime, #A3E635)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--app-text-primary, #F2F5F3)' }}>
              Resolve Dispute
            </h3>
            <div className="escrow-modal-body">
            <p className="text-gray-300 text-sm mb-6">
              Adjust the slider to set the percentage of funds the <strong>{niche.lexicon.provider}</strong> will receive. The remaining balance will be refunded to the {niche.lexicon.client}.
            </p>

            <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--app-surface-2, #171E1A)' }}>
              <div className="flex justify-between text-sm mb-4 font-semibold tabular-nums">
                <span className="text-gray-400">{niche.lexicon.client}: {100 - resolvePercent}%</span>
                <span style={{ color: 'var(--app-lime, #A3E635)' }}>{niche.lexicon.provider}: {resolvePercent}%</span>
              </div>
              <input
                type="range"
                min="0" max="100"
                value={resolvePercent}
                onChange={(e) => setResolvePercent(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--app-lime, #A3E635)' }}
              />
            </div>
            </div>

            <div className="escrow-modal-actions flex gap-3 justify-end">
              <button className="btn btn-app-secondary" onClick={() => setShowResolveModal(false)} disabled={loading}>
                Cancel
              </button>
              <button
                className="btn btn-app-primary"
                onClick={executeAdminResolve}
                disabled={loading}
              >
                {busy === 'admin' ? 'Processing...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

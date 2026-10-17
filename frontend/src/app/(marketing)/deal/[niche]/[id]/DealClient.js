'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../../../context/Web3Context';
import { allInstances } from '../../../../../config/instances';
import { USDT_ADDRESS, USDC_ADDRESS } from '../../../../../config/contract';
import styles from './deal.module.css';
import { readEscrowReference } from '../../../../../lib/escrowReference';

// Page publique d'un escrow : lecture seule sur le contrat, sans wallet.
// Usage principal : un prestataire verifie que les fonds sont bien bloques avant de commencer.
const ESCROW_ABI = ['function escrows(uint256) view returns (address client, address provider, address token, uint256 amount, uint256 feeBPS, uint256 createdAt, uint256 timeoutDate, uint8 status, bool accepted)'];
const BSCSCAN = 'https://bscscan.com';
const TOKENS = { [USDT_ADDRESS.toLowerCase()]: 'USDT', [USDC_ADDRESS.toLowerCase()]: 'USDC' };

const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmtDate = (s) => new Date(Number(s) * 1000).toUTCString().replace(' GMT', ' UTC');

function statusOf(e) {
  const nowSec = Math.floor(Date.now() / 1000);
  const expired = Number(e.timeoutDate) > 0 && nowSec > Number(e.timeoutDate);
  switch (Number(e.status)) {
    case 1:
      if (!e.accepted) {
        return { label: 'Awaiting acceptance', tone: 'warn', note: 'The funds are locked in the contract. Until the provider accepts, the client can still cancel and get a full refund.' };
      }
      if (expired) {
        return { label: 'Deadline passed', tone: 'warn', note: 'The delivery deadline has passed. The provider can claim the timeout, or the client can release the funds or open a dispute.' };
      }
      return { label: 'In progress', tone: 'ok', note: 'The provider accepted. The client can no longer cancel: the funds can only be paid to the provider, or split through a dispute.' };
    case 2: return { label: 'Completed', tone: 'done', note: 'The funds were released to the provider.' };
    case 3: return { label: 'In mediation', tone: 'danger', note: 'A dispute is open. The 3-of-5 Safe multisig settles it; after 30 days either party can trigger a 50/50 split.' };
    case 4: return { label: 'Completed', tone: 'done', note: 'The dispute was settled and the funds were split.' };
    case 5: return { label: 'Cancelled', tone: 'done', note: 'The client cancelled before acceptance and was refunded.' };
    default: return null;
  }
}

// Etat de la frise 3 etapes aligne sur le vocabulaire d'EscrowCard.js.
function timelineOf(e) {
  const statusNum = Number(e.status);
  const nowSec = Math.floor(Date.now() / 1000);
  const isCompleted = statusNum === 2 || statusNum === 4;
  const isCancelled = statusNum === 5;
  const isDisputed = statusNum === 3;
  const isExpired = statusNum === 1 && Boolean(e.accepted) && Number(e.timeoutDate) > 0 && nowSec > Number(e.timeoutDate);

  const step1Done = Boolean(e.accepted) || isCompleted || isDisputed;
  const step1Active = statusNum === 1 && !e.accepted;
  const step1Label = step1Done ? 'Accepted' : isCancelled ? 'Cancelled' : 'Awaiting acceptance';

  let step2Label = 'In progress';
  let step2Class = '';
  if (isDisputed) {
    step2Label = 'In mediation';
    step2Class = styles.stepDanger;
  } else if (isExpired) {
    step2Label = 'Deadline passed';
    step2Class = styles.stepWarn;
  } else if (isCompleted) {
    step2Label = 'In progress';
    step2Class = styles.stepDone;
  } else if (statusNum === 1 && e.accepted) {
    step2Label = 'In progress';
    step2Class = styles.stepActive;
  }

  return { isCompleted, isCancelled, isDisputed, step1Done, step1Active, step1Label, step2Label, step2Class };
}

export default function DealClient({ niche, id }) {
  const { readProvider } = useWeb3();
  const inst = allInstances[niche];
  const validId = /^\d+$/.test(String(id));
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [reference, setReference] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!inst || !validId || !readProvider) return;
    let cancelled = false;
    (async () => {
      try {
        const c = new ethers.Contract(inst.contractAddress, ESCROW_ABI, readProvider);
        const e = await c.escrows(BigInt(id));
        if (cancelled) return;
        if (Number(e.status) === 0) { setState({ loading: false, error: 'not-found', data: null }); return; }
        const symbol = TOKENS[e.token.toLowerCase()] ?? 'tokens';
        const decimals = await new ethers.Contract(e.token, ['function decimals() view returns (uint8)'], readProvider).decimals();
        if (!cancelled) setState({ loading: false, error: null, data: { ...e.toObject(), symbol, decimals: Number(decimals) } });
        readEscrowReference(readProvider, inst.contractAddress, id, e.createdAt).then((r) => { if (!cancelled) setReference(r); }).catch(() => {});
      } catch (err) {
        console.error('[Deal] read:', err);
        if (!cancelled) setState({ loading: false, error: 'read', data: null });
      }
    })();
    return () => { cancelled = true; };
  }, [inst, validId, id, readProvider]);

  if (!inst || !validId) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Deal not found</h1>
          <p className={styles.muted}>Check the link you received.</p>
        </div>
      </div>
    );
  }

  const d = state.data;
  const st = d && statusOf(d);
  const tl = d && timelineOf(d);
  const amount = d ? Number(ethers.formatUnits(d.amount, d.decimals)).toLocaleString('en-US', { maximumFractionDigits: 2 }) : null;

  // Calcul exact en BigInt du net prestataire pour une liberation standard (masque si litige resolu ou annule).
  const statusNum = d ? Number(d.status) : 0;
  const showNetLine = d && statusNum !== 4 && statusNum !== 5;
  const feeBPSBig = d ? BigInt(d.feeBPS) : 0n;
  const netRaw = d ? d.amount - (d.amount * feeBPSBig) / 10000n : 0n;
  const netFormatted = d ? Number(ethers.formatUnits(netRaw, d.decimals)).toLocaleString('en-US', { maximumFractionDigits: 2 }) : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Silence si le navigateur refuse l'acces au presse-papiers */
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.badge}>Read-only · no wallet needed</span>
        <h1 className={styles.title}>{inst.lexicon?.escrow ?? 'Escrow'} #{id}</h1>
        <p className={styles.muted}>Data read directly from the audited smart contract on BNB Smart Chain.</p>

        {state.loading && <p className={styles.muted}>Loading…</p>}
        {state.error === 'not-found' && <p className={styles.muted}>No escrow #{id} on this contract. Check the link you received.</p>}
        {state.error === 'read' && <p className={styles.muted}>Could not read the contract right now. Please try again.</p>}

        {d && st && tl && (
          <>
            <div className={`${styles.status} ${styles[st.tone]}`}>{st.label}</div>
            <div className={styles.amount}>{amount} <span>{d.symbol}</span></div>
            <p className={styles.note}>{st.note}</p>

            {/* Frise 3 etapes identique au vocabulaire d'EscrowCard */}
            <div className={styles.timeline} aria-label="Deal progress">
              <div className={styles.timelineTrack}>
                <div className={`${styles.timelineStep} ${tl.step1Done ? styles.stepDone : tl.step1Active ? styles.stepActive : ''}`}>
                  <span className={styles.timelineNode} aria-hidden="true">
                    {tl.step1Done ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <span className={styles.timelineDot} />
                    )}
                  </span>
                  <span className={styles.timelineLabel}>{tl.step1Label}</span>
                </div>

                {!tl.isCancelled && (
                  <>
                    <div className={`${styles.timelineLine} ${tl.step1Done ? styles.lineDone : ''}`} />

                    <div className={`${styles.timelineStep} ${tl.step2Class}`}>
                      <span className={styles.timelineNode} aria-hidden="true">
                        {tl.isCompleted ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <span className={styles.timelineDot} />
                        )}
                      </span>
                      <span className={styles.timelineLabel}>{tl.step2Label}</span>
                    </div>

                    <div className={`${styles.timelineLine} ${tl.isCompleted ? styles.lineDone : tl.isDisputed ? styles.lineDanger : ''}`} />

                    <div className={`${styles.timelineStep} ${tl.isCompleted ? styles.stepDone : ''}`}>
                      <span className={styles.timelineNode} aria-hidden="true">
                        {tl.isCompleted ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <span className={styles.timelineDot} />
                        )}
                      </span>
                      <span className={styles.timelineLabel}>Completed</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <ul className={styles.rows}>
              {reference && <li><span>Reference</span><b>{reference}</b></li>}
              <li><span>{inst.lexicon?.client ?? 'Client'}</span><a href={`${BSCSCAN}/address/${d.client}`} target="_blank" rel="noopener noreferrer">{short(d.client)} ↗</a></li>
              <li><span>{inst.lexicon?.provider ?? 'Provider'}</span><a href={`${BSCSCAN}/address/${d.provider}`} target="_blank" rel="noopener noreferrer">{short(d.provider)} ↗</a></li>
              <li><span>Created</span><b>{fmtDate(d.createdAt)}</b></li>
              <li><span>Delivery deadline</span><b>{fmtDate(d.timeoutDate)}</b></li>
              <li><span>Provider fee</span><b>{Number(d.feeBPS) / 100}%</b></li>
              {showNetLine && (
                <li>
                  <span>Net to provider (on standard release)</span>
                  <b>{netFormatted} {d.symbol}{Number(d.feeBPS) === 0 ? ' (0% fee)' : ''}</b>
                </li>
              )}
              <li><span>Contract</span><a href={`${BSCSCAN}/address/${inst.contractAddress}#readContract`} target="_blank" rel="noopener noreferrer">{short(inst.contractAddress)} ↗</a></li>
            </ul>
            <div className={styles.actions}>
              <Link href={`/${niche}?escrow=${id}`} className={`btn btn-primary ${styles.cta}`}>Open in the app</Link>
              <button type="button" className={styles.copyBtn} onClick={handleCopyLink}>
                {copied ? 'Link copied' : 'Copy deal link'}
              </button>
            </div>
          </>
        )}
      </div>
      <p className={styles.fine}>Only trust links on joobescrow.com. JoobEscrow never asks for your seed phrase.</p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../../../context/Web3Context';
import { allInstances } from '../../../../../config/instances';
import { USDT_ADDRESS, USDC_ADDRESS } from '../../../../../config/contract';
import styles from './deal.module.css';

// Page publique d'un escrow : lecture seule sur le contrat, sans wallet.
// Usage principal : un prestataire verifie que les fonds sont bien bloques avant de commencer.
const ESCROW_ABI = ['function escrows(uint256) view returns (address client, address provider, address token, uint256 amount, uint256 feeBPS, uint256 createdAt, uint256 timeoutDate, uint8 status, bool accepted)'];
const BSCSCAN = 'https://bscscan.com';
const TOKENS = { [USDT_ADDRESS.toLowerCase()]: 'USDT', [USDC_ADDRESS.toLowerCase()]: 'USDC' };

const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmtDate = (s) => new Date(Number(s) * 1000).toUTCString().replace(' GMT', ' UTC');

function statusOf(e) {
  switch (Number(e.status)) {
    case 1: return e.accepted
      ? { label: 'Funds locked · work in progress', tone: 'ok', note: 'The provider accepted. The client can no longer cancel: the funds can only be paid to the provider, or split through a dispute.' }
      : { label: 'Funds locked · waiting for the provider', tone: 'ok', note: 'The funds are in the contract. Until the provider accepts, the client can still cancel and get a full refund.' };
    case 2: return { label: 'Paid', tone: 'done', note: 'The funds were released to the provider.' };
    case 3: return { label: 'In dispute', tone: 'warn', note: 'A dispute is open. The 3-of-5 Safe multisig settles it; after 30 days either party can trigger a 50/50 split.' };
    case 4: return { label: 'Dispute settled', tone: 'done', note: 'The dispute was settled and the funds were split.' };
    case 5: return { label: 'Cancelled · refunded', tone: 'done', note: 'The client cancelled before acceptance and was refunded.' };
    default: return null;
  }
}

export default function DealClient({ niche, id }) {
  const { readProvider } = useWeb3();
  const inst = allInstances[niche];
  const validId = /^\d+$/.test(String(id));
  const [state, setState] = useState({ loading: true, error: null, data: null });

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
  const amount = d ? Number(ethers.formatUnits(d.amount, d.decimals)).toLocaleString('en-US', { maximumFractionDigits: 2 }) : null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.badge}>Read-only · no wallet needed</span>
        <h1 className={styles.title}>{inst.lexicon?.escrow ?? 'Escrow'} #{id}</h1>
        <p className={styles.muted}>Data read directly from the audited smart contract on BNB Smart Chain.</p>

        {state.loading && <p className={styles.muted}>Loading…</p>}
        {state.error === 'not-found' && <p className={styles.muted}>No escrow #{id} on this contract. Check the link you received.</p>}
        {state.error === 'read' && <p className={styles.muted}>Could not read the contract right now. Please try again.</p>}

        {d && st && (
          <>
            <div className={`${styles.status} ${styles[st.tone]}`}>{st.label}</div>
            <div className={styles.amount}>{amount} <span>{d.symbol}</span></div>
            <p className={styles.note}>{st.note}</p>
            <ul className={styles.rows}>
              <li><span>{inst.lexicon?.client ?? 'Client'}</span><a href={`${BSCSCAN}/address/${d.client}`} target="_blank" rel="noopener noreferrer">{short(d.client)} ↗</a></li>
              <li><span>{inst.lexicon?.provider ?? 'Provider'}</span><a href={`${BSCSCAN}/address/${d.provider}`} target="_blank" rel="noopener noreferrer">{short(d.provider)} ↗</a></li>
              <li><span>Created</span><b>{fmtDate(d.createdAt)}</b></li>
              <li><span>Delivery deadline</span><b>{fmtDate(d.timeoutDate)}</b></li>
              <li><span>Provider fee</span><b>{Number(d.feeBPS) / 100}%</b></li>
              <li><span>Contract</span><a href={`${BSCSCAN}/address/${inst.contractAddress}#readContract`} target="_blank" rel="noopener noreferrer">{short(inst.contractAddress)} ↗</a></li>
            </ul>
            <Link href={`/${niche}?escrow=${id}`} className={`btn btn-primary ${styles.cta}`}>Open in the app</Link>
          </>
        )}
      </div>
      <p className={styles.fine}>Only trust links on joobescrow.com. JoobEscrow never asks for your seed phrase.</p>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { usePresaleState } from '../hooks/usePresaleState';
import { PLANNED_LISTING_PRICE } from '../config/presale';
import styles from './PresaleGlassCard.module.css';

function CountdownDisplay({ seconds }) {
  const s = seconds > 0n ? Number(seconds) : 0;
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  return (
    <div className={styles.timerMono}>
      <span>{String(days).padStart(2, '0')}d</span>{' '}
      <span>{String(hours).padStart(2, '0')}h</span>{' '}
      <span>{String(minutes).padStart(2, '0')}m</span>{' '}
      <span>{String(secs).padStart(2, '0')}s</span>
    </div>
  );
}

const BADGE = {
  LOADING: 'OPENS OCT 15 · 14:00 UTC',
  PENDING: 'OPENS OCT 15 · 14:00 UTC',
  AWAITING_START: 'OPENING SHORTLY',
  LIVE: 'LIVE',
  PAUSED: 'PAUSED',
  SOLD_OUT: 'SOLD OUT',
  FINALIZATION_PENDING: 'SALE ENDED',
  ENDED: 'SALE ENDED',
};

export default function PresaleGlassCard() {
  const { readProvider } = useWeb3();
  const {
    config,
    global,
    computedState,
    countdownSeconds,
    currentPrice,
    nextPrice,
    nextStepSeconds,
    finalPrice,
  } = usePresaleState(readProvider);

  const isLive = computedState === 'LIVE';
  const isPending = computedState === 'PENDING' || computedState === 'LOADING';
  const isClosed = computedState === 'ENDED' || computedState === 'FINALIZATION_PENDING';

  const priceUSD = config && currentPrice
    ? Number(ethers.formatUnits(currentPrice, config.paymentDecimals)).toFixed(4)
    : '0.0010';

  const nextPriceUSD = config && nextPrice
    ? Number(ethers.formatUnits(nextPrice, config.paymentDecimals)).toFixed(4)
    : '0.0012';

  const finalPriceUSD = config && finalPrice
    ? Number(ethers.formatUnits(finalPrice, config.paymentDecimals)).toFixed(4)
    : '0.0000';

  const raisedUSD = global && config
    ? Number(ethers.formatUnits(global.totalRaised, config.paymentDecimals)).toLocaleString('en-US', { maximumFractionDigits: 2 })
    : '0';

  const allocatedTokens = global && config
    ? Number(ethers.formatUnits(global.totalTokensOwed, config.tokenDecimals)).toLocaleString('en-US', { maximumFractionDigits: 0 })
    : '0';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <img src="/logo.svg" alt="" width={24} height={24} />
          <span>JOOB · Presale</span>
        </div>
        <span className={`${styles.badge} ${isLive ? styles.badgeLive : styles.badgePending}`}>
          {BADGE[computedState] ?? 'OPENS OCT 15 · 14:00 UTC'}
        </span>
      </div>

      {isPending ? (
        <div className={styles.countdownBox}>
          <div className={styles.boxLabel}>Presale Opens In</div>
          {computedState === 'LOADING' ? <span style={{ opacity: 0.6 }}>Loading…</span> : <CountdownDisplay seconds={countdownSeconds} />}
        </div>
      ) : (
        <div className={styles.raisedBox}>
          <div className={styles.boxLabel}>Total Raised</div>
          <div className={styles.raisedAmount}>${raisedUSD}</div>
        </div>
      )}

      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>{isClosed ? 'Final Price' : 'Current Price'}</div>
          <div className={styles.metricVal}>${isClosed ? finalPriceUSD : priceUSD}</div>
          <div className={styles.metricSub}>{isClosed ? 'Sale closed' : `Next: $${nextPriceUSD}`}</div>
        </div>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>{isPending ? 'Allocation Cap' : 'Tokens Allocated'}</div>
          <div className={styles.metricVal}>
            {isPending ? '163.5M' : allocatedTokens} <span className={styles.tokenUnit}>JOOB</span>
          </div>
          <div className={styles.metricSub}>Planned DEX: ${PLANNED_LISTING_PRICE} · not guaranteed</div>
        </div>
      </div>

      {isLive && nextStepSeconds > 0n && (
        <div className={styles.stepBox}>
          <div className={styles.stepHeader}>
            <span>Next price step in:</span>
            <CountdownDisplay seconds={nextStepSeconds} />
          </div>
        </div>
      )}

      <div className={styles.actionWrap}>
        <Link href="/presale" className="btn btn-primary" style={{ width: '100%', padding: '13px 0', fontSize: '1rem' }}>
          {isLive ? 'Buy JOOB Now →' : computedState === 'ENDED' ? 'Claim your JOOB →' : 'Access Presale Portal →'}
        </Link>
      </div>

      <div className={styles.footerGuarantees}>
        <span>🛡️ Audited by SpyWolf</span>
        <span>•</span>
        <span>🔐 3-of-5 Safe</span>
      </div>
    </div>
  );
}

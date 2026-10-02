'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useAppKitNetwork } from '@reown/appkit/react';
import { bsc } from '@reown/appkit/networks';
import { useWeb3 } from '../../../context/Web3Context';
import {
  PRESALE_ADDRESSES, PRESALE_ABI, ERC20_ABI, PRESALE_STATE, PRESALE_CHAIN_ID, BSCSCAN, AUDITS,
  priceAt, nextStepAt, volumeTierBps, readableError,
  PLANNED_LISTING_PRICE,
} from '../../../config/presale';
import styles from './presale.module.css';

// Tolerance d'arrondi entre l'estimation et l'execution (le prix ne change
// qu'aux paliers : si un palier tombe entre les deux, l'achat est annule).
const SLIPPAGE_BPS = 50n;
const REFRESH_INTERVAL_MS = 15_000;
const shortAddr = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
// Parametre distinct de ?ref= (deja utilise par ReferralTracker pour les KOL escrow).
const REF_PARAM = 'referrer';
const REF_STORAGE_KEY = 'joob_presale_referrer';
const TERMS_KEY = (a) => `joob_presale_terms:${a.toLowerCase()}`;

function readStored(k) {
  try { return typeof window === 'undefined' ? null : localStorage.getItem(k); } catch { return null; }
}

// Parrain : ?referrer= dans l'URL, sinon celui memorise lors d'une visite precedente.
function readInitialReferrer() {
  if (typeof window === 'undefined') return null;
  const fromUrl = new URLSearchParams(window.location.search).get(REF_PARAM);
  if (fromUrl && ethers.isAddress(fromUrl)) return ethers.getAddress(fromUrl);
  const stored = readStored(REF_STORAGE_KEY);
  return stored && ethers.isAddress(stored) ? ethers.getAddress(stored) : null;
}

const EMPTY_USER = {
  allocation: 0n, purchased: 0n, volumeBonus: 0n, claimed: 0n, claimable: 0n,
  contribution: 0n, contributionUSDC: 0n, contributionUSDT: 0n,
  balanceUSDC: 0n, balanceUSDT: 0n, allowanceUSDC: 0n, allowanceUSDT: 0n,
};

const fmtNum = (n, max = 2) => n.toLocaleString('en-US', { maximumFractionDigits: max });
const fmtToken = (v, d, max = 2) => fmtNum(Number(ethers.formatUnits(v, d)), max);
const fmtUsd = (v, d, max = 4) => Number(ethers.formatUnits(v, d)).toLocaleString('en-US', { minimumFractionDigits: Math.min(2, max), maximumFractionDigits: max });
const fmtDate = (s) => new Date(Number(s) * 1000).toLocaleString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' UTC';

function useNow() {
  const [now, setNow] = useState(() => BigInt(Math.floor(Date.now() / 1000)));
  useEffect(() => {
    const id = setInterval(() => setNow(BigInt(Math.floor(Date.now() / 1000))), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Countdown({ seconds }) {
  const s = seconds > 0n ? Number(seconds) : 0;
  const parts = [
    [Math.floor(s / 86400), 'd'], [Math.floor((s % 86400) / 3600), 'h'],
    [Math.floor((s % 3600) / 60), 'm'], [s % 60, 's'],
  ];
  return <span className={styles.mono}>{parts.map(([v, l]) => `${String(v).padStart(2, '0')}${l}`).join(' ')}</span>;
}

/** Lecture on-chain : configuration immuable (une fois), etat global et wallet (polling). */
function usePresale(account, readProvider) {
  const presale = useMemo(() => new ethers.Contract(PRESALE_ADDRESSES.PRESALE, PRESALE_ABI, readProvider), [readProvider]);
  const [config, setConfig] = useState(null);
  const [global, setGlobal] = useState(null);
  const [userData, setUserData] = useState({ account: null, data: EMPTY_USER });
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const [presaleName, tokenDecimals, paymentDecimals, cap, basePrice, priceIncreaseBps, priceIncreasePeriod,
            tgeBps, vestingDuration, referralBps, maxExtensions, extensionDuration, startTime, tiers] = await Promise.all([
            presale.presaleName(), presale.tokenDecimals(), presale.paymentTokenDecimals(), presale.presaleTokensCap(),
            presale.basePrice(), presale.priceIncreaseBps(), presale.priceIncreasePeriod(), presale.tgeBps(),
            presale.vestingDuration(), presale.referralBps(), presale.maxExtensions(), presale.extensionDuration(),
            presale.startTime(), presale.getVolumeBonusTiers(),
          ]);
          if (cancelled) return;
          setConfig({
            presaleName, tokenDecimals: Number(tokenDecimals), paymentDecimals: Number(paymentDecimals),
            cap, basePrice, priceIncreaseBps, priceIncreasePeriod, tgeBps, vestingDuration, referralBps,
            maxExtensions: Number(maxExtensions), extensionDuration, startTime,
            tierThresholds: [...tiers[0]], tierBps: [...tiers[1]],
          });
          return;
        } catch (err) {
          console.error('[Presale] config:', err);
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        }
      }
      if (!cancelled) setLoadError('Unable to load the presale contract. Please refresh the page.');
    })();
    return () => { cancelled = true; };
  }, [presale]);

  const refreshGlobal = useCallback(async () => {
    try {
      const [state, paused, endTime, extensionsUsed, tgeTimestamp, totalRaised, totalTokensOwed,
        depositedTokens, remainingTokens, currentPrice] = await Promise.all([
        presale.state(), presale.paused(), presale.endTime(), presale.extensionsUsed(), presale.tgeTimestamp(),
        presale.totalRaised(), presale.totalTokensOwed(), presale.depositedTokens(), presale.remainingTokens(),
        presale.getCurrentPrice(),
      ]);
      setGlobal({
        state: Number(state), paused: Boolean(paused), endTime, extensionsUsed: Number(extensionsUsed),
        tgeTimestamp, totalRaised, totalTokensOwed, depositedTokens, remainingTokens, currentPrice,
      });
    } catch (err) {
      console.error('[Presale] global:', err);
    }
  }, [presale]);

  const refreshUser = useCallback(async () => {
    if (!account) return;
    try {
      const usdc = new ethers.Contract(PRESALE_ADDRESSES.USDC, ERC20_ABI, readProvider);
      const usdt = new ethers.Contract(PRESALE_ADDRESSES.USDT, ERC20_ABI, readProvider);
      const [allocation, purchased, volumeBonus, claimed, claimable, cUSDC, cUSDT,
        balanceUSDC, balanceUSDT, allowanceUSDC, allowanceUSDT] = await Promise.all([
        presale.allocations(account), presale.purchasedTokens(account), presale.volumeBonusPaid(account),
        presale.claimed(account), presale.claimable(account), presale.contributionsUSDC(account),
        presale.contributionsUSDT(account), usdc.balanceOf(account), usdt.balanceOf(account),
        usdc.allowance(account, PRESALE_ADDRESSES.PRESALE), usdt.allowance(account, PRESALE_ADDRESSES.PRESALE),
      ]);
      setUserData({ account, data: {
        allocation, purchased, volumeBonus, claimed, claimable,
        contribution: cUSDC + cUSDT, contributionUSDC: cUSDC, contributionUSDT: cUSDT,
        balanceUSDC, balanceUSDT, allowanceUSDC, allowanceUSDT,
      } });
    } catch (err) {
      console.error('[Presale] user:', err);
    }
  }, [account, presale, readProvider]);

  useEffect(() => {
    const first = setTimeout(refreshGlobal, 0);
    const id = setInterval(() => { if (!document.hidden) refreshGlobal(); }, REFRESH_INTERVAL_MS);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [refreshGlobal]);

  useEffect(() => {
    const first = setTimeout(refreshUser, 0);
    const id = setInterval(() => { if (!document.hidden) refreshUser(); }, REFRESH_INTERVAL_MS);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [refreshUser]);

  const user = account && userData.account === account ? userData.data : EMPTY_USER;

  const refreshAll = useCallback(() => Promise.all([refreshGlobal(), refreshUser()]), [refreshGlobal, refreshUser]);

  return { config, global, user, loadError, refreshAll };
}

function Feedback({ status, step, success, error }) {
  if (status === 'loading' && step) return <div className={`${styles.feedback} ${styles.feedbackInfo}`}>{step}</div>;
  if (status === 'success' && success) return <div className={`${styles.feedback} ${styles.feedbackOk}`}>{success}</div>;
  if (status === 'error' && error) return <div className={`${styles.feedback} ${styles.feedbackErr}`}>{error}</div>;
  return null;
}

export default function PresaleClient() {
  const { account, provider, readProvider, connectWallet } = useWeb3();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { config, global, user, loadError, refreshAll } = usePresale(account, readProvider);
  const now = useNow();

  const [paymentToken, setPaymentToken] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('idle');
  const [step, setStep] = useState('');
  const [txError, setTxError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [referrer, setReferrer] = useState(readInitialReferrer);
  const [refInput, setRefInput] = useState(() => readInitialReferrer() ?? '');
  const [refError, setRefError] = useState(null);
  // Acceptation des conditions saisie pendant la session, par wallet (repli si localStorage indisponible).
  const [termsSession, setTermsSession] = useState({});

  const isCorrectNetwork = Number(chainId) === PRESALE_CHAIN_ID;

  // ── Parrain : ?referrer=0x... memorise pour les achats suivants ──────────
  useEffect(() => {
    try { if (referrer) localStorage.setItem(REF_STORAGE_KEY, referrer); } catch { /* ignore */ }
  }, [referrer]);

  // Code de parrainage saisi a la main = adresse du wallet du parrain.
  const applyReferral = useCallback(() => {
    const v = refInput.trim();
    if (!v) {
      setReferrer(null);
      try { localStorage.removeItem(REF_STORAGE_KEY); } catch { /* ignore */ }
      return;
    }
    if (!ethers.isAddress(v)) { setRefError('Invalid referral code: paste the referrer wallet address (0x…).'); return; }
    const checksum = ethers.getAddress(v);
    if (account && checksum.toLowerCase() === account.toLowerCase()) { setRefError('You cannot refer yourself.'); return; }
    setReferrer(checksum);
    setRefError(null);
    try { localStorage.setItem(REF_STORAGE_KEY, checksum); } catch { /* ignore */ }
  }, [refInput, account]);

  const effectiveReferrer = useMemo(
    () => (referrer && account && referrer.toLowerCase() !== account.toLowerCase() ? referrer : null),
    [referrer, account],
  );

  // ── Conditions acceptees : memorisees par wallet ─────────────────────────
  const key = account ? account.toLowerCase() : null;
  const termsAccepted = !!key && (key in termsSession ? termsSession[key] : readStored(TERMS_KEY(key)) !== null);
  const onTerms = useCallback((checked) => {
    if (!key) return;
    setTermsSession((prev) => ({ ...prev, [key]: checked }));
    try {
      if (checked) localStorage.setItem(TERMS_KEY(key), String(Date.now())); else localStorage.removeItem(TERMS_KEY(key));
    } catch { /* session uniquement */ }
  }, [key]);

  // ── Derives ──────────────────────────────────────────────────────────────
  const pd = config?.paymentDecimals ?? 18;
  const td = config?.tokenDecimals ?? 18;
  const state = global?.state ?? PRESALE_STATE.PENDING;
  const beforeStart = !!config && now < config.startTime;
  const isLive = state === PRESALE_STATE.ACTIVE && !!global && !global.paused && now <= global.endTime;
  const isEnded = state === PRESALE_STATE.ENDED;

  const currentPrice = global?.currentPrice ?? config?.basePrice ?? 0n;
  const nextStep = config ? nextStepAt(config, now) : 0n;
  const nextPrice = config ? priceAt(config, nextStep) : 0n;
  const endPrice = config && global ? priceAt(config, global.endTime) : 0n;
  // Prix maximal si toutes les prolongations restantes sont utilisees.
  const extensionsLeft = config && global ? Math.max(config.maxExtensions - global.extensionsUsed, 0) : 0;
  const maxPrice = config && global ? priceAt(config, global.endTime + BigInt(extensionsLeft) * config.extensionDuration) : 0n;

  const balance = paymentToken === 'USDT' ? user.balanceUSDT : user.balanceUSDC;
  const allowance = paymentToken === 'USDT' ? user.allowanceUSDT : user.allowanceUSDC;

  const amountWei = useMemo(() => {
    try { return amount && Number(amount) > 0 ? ethers.parseUnits(amount, pd) : 0n; } catch { return 0n; }
  }, [amount, pd]);

  // Estimation locale, meme formule que le contrat (estimateTokens / _volumeBonus).
  const estimate = useMemo(() => {
    if (!config || amountWei === 0n || currentPrice === 0n) return { tokens: 0n, bonus: 0n };
    const tokens = (amountWei * 10n ** BigInt(td)) / currentPrice;
    const bonusBps = volumeTierBps(config, user.contribution + amountWei);
    const owed = ((user.purchased + tokens) * bonusBps) / 10_000n;
    const bonus = owed > user.volumeBonus ? owed - user.volumeBonus : 0n;
    return { tokens, bonus };
  }, [config, amountWei, currentPrice, td, user]);

  // Prochain palier de bonus pour ce wallet.
  const nextTier = useMemo(() => {
    if (!config) return null;
    const cumulative = user.contribution + amountWei;
    const idx = config.tierThresholds.findIndex((t) => cumulative < t);
    if (idx === -1) return null;
    return { threshold: config.tierThresholds[idx], bps: config.tierBps[idx], missing: config.tierThresholds[idx] - cumulative };
  }, [config, user.contribution, amountWei]);

  // Montant maximal achetable (prudent : bonus maximal inclus).
  const maxPurchasable = useMemo(() => {
    if (!config || !global || currentPrice === 0n) return 0n;
    const maxBonusBps = (config.tierBps.length ? config.tierBps[config.tierBps.length - 1] : 0n) + config.referralBps;
    const tokens = (global.remainingTokens * 10_000n) / (10_000n + maxBonusBps);
    return (tokens * currentPrice) / 10n ** BigInt(td);
  }, [config, global, currentPrice, td]);

  const vaultSealed = !!config && !!global && global.depositedTokens >= config.cap;
  const soldPct = config && global && config.cap > 0n ? Number((global.totalTokensOwed * 10_000n) / config.cap) / 100 : 0;
  const referralLink = account && typeof window !== 'undefined' ? `${window.location.origin}/presale?${REF_PARAM}=${account}` : '';

  const amountError = useMemo(() => {
    if (amountWei === 0n) return null;
    if (account && amountWei > balance) return `Insufficient ${paymentToken} balance.`;
    if (maxPurchasable > 0n && amountWei > maxPurchasable) return `Above the maximum currently purchasable (~$${fmtUsd(maxPurchasable, pd, 2)}).`;
    return null;
  }, [amountWei, balance, account, paymentToken, maxPurchasable, pd]);

  const canBuy = isLive && isCorrectNetwork && termsAccepted && amountWei > 0n && !amountError && status !== 'loading';

  const doSwitch = async () => { try { await switchNetwork(bsc); } catch { /* annule */ } };

  // ── Achat ────────────────────────────────────────────────────────────────
  const handleBuy = async (e) => {
    e.preventDefault();
    setTxError(null); setSuccessMsg(null);
    if (!account || !provider) { await connectWallet(); return; }
    if (!isCorrectNetwork) { await doSwitch(); return; }
    if (!canBuy || !config) return;

    setStatus('loading');
    try {
      const signer = await provider.getSigner();
      const tokenAddr = paymentToken === 'USDT' ? PRESALE_ADDRESSES.USDT : PRESALE_ADDRESSES.USDC;
      const erc20 = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
      const presale = new ethers.Contract(PRESALE_ADDRESSES.PRESALE, PRESALE_ABI, signer);

      if (allowance < amountWei) {
        if (allowance > 0n) {
          setStep(`Resetting ${paymentToken} allowance…`);
          await (await erc20.approve(PRESALE_ADDRESSES.PRESALE, 0n)).wait();
        }
        setStep(`1/2 — Approving ${paymentToken}…`);
        await (await erc20.approve(PRESALE_ADDRESSES.PRESALE, amountWei)).wait();
      }

      setStep('2/2 — Buying JOOB…');
      const expected = await presale.estimateTokens(amountWei);
      if (expected === 0n) throw new Error('Presale: no tokens available');
      const minTokens = (expected * (10_000n - SLIPPAGE_BPS)) / 10_000n;
      const tx = await presale.buy(amountWei, minTokens, paymentToken === 'USDT', effectiveReferrer ?? ethers.ZeroAddress);
      await tx.wait();

      setStatus('success');
      setSuccessMsg(`Purchase confirmed: ~${fmtToken(expected + estimate.bonus, td)} JOOB added to your allocation.`);
      setAmount('');
      await refreshAll();
    } catch (err) {
      console.error('[Presale] buy:', err);
      setStatus('error');
      setTxError(readableError(err));
    } finally {
      setStep('');
    }
  };

  // ── Claim (apres la fin de la vente) ─────────────────────────────────────
  const handleClaim = async () => {
    if (!provider || !account) return;
    if (!isCorrectNetwork) { await doSwitch(); return; }
    setTxError(null); setSuccessMsg(null); setStatus('loading'); setStep('Claiming JOOB…');
    try {
      const signer = await provider.getSigner();
      const presale = new ethers.Contract(PRESALE_ADDRESSES.PRESALE, PRESALE_ABI, signer);
      await (await presale.claim()).wait();
      setStatus('success'); setSuccessMsg('Tokens claimed to your wallet.');
      await refreshAll();
    } catch (err) {
      console.error('[Presale] claim:', err);
      setStatus('error'); setTxError(readableError(err));
    } finally { setStep(''); }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  // ── Rendu ────────────────────────────────────────────────────────────────
  if (loadError) return <div className={styles.center}><p className={styles.error}>{loadError}</p></div>;
  if (!config || !global) return <div className={styles.center}><p className={styles.muted}>Loading presale data from BNB Smart Chain…</p></div>;

  const badge = isLive ? ['Live', styles.badgeLive]
    : isEnded ? ['Sale ended', styles.badgeMuted]
      : beforeStart ? ['Opening soon', styles.badgeInfo]
        : global.paused ? ['Paused', styles.badgeWarn]
          : ['Opening shortly — awaiting on-chain start', styles.badgeInfo];

  const buyLabel = status === 'loading' ? (step || 'Processing…')
    : !isLive ? (isEnded ? 'Sale ended' : 'Sale not open yet')
      : !termsAccepted ? 'Accept the terms to continue'
        : amountWei === 0n ? 'Enter an amount'
          : allowance < amountWei ? `Approve & buy with ${paymentToken}` : 'Buy JOOB';

  const tierPct = nextTier ? Math.min(100, Number(((user.contribution + amountWei) * 10_000n) / nextTier.threshold) / 100) : 100;

  return (
    <div className={styles.page}>
      <span className={`${styles.badge} ${badge[1]}`}>{isLive && <span className={styles.dot} />}{badge[0]}</span>
      <h1 className={styles.title}>{config.presaleName}</h1>
      <p className={styles.lead}>
        JOOB is the token of the JoobEscrow ecosystem. Public time-based price schedule, sealed token vault and
        vesting for every participant — all enforced by a verified smart contract.
      </p>

      <div className={styles.trustGrid}>
        <div className={styles.trustBlock}>
          <div className={styles.trustHead}>
            <span className={styles.trustIcon} aria-hidden="true">✓</span>
            <div>
              <div className={styles.trustTitle}>Verified on BscScan</div>
              <div className={styles.trustSub}>Public source code, owned by the Safe multisig</div>
            </div>
          </div>
          <a href={`${BSCSCAN}/address/${PRESALE_ADDRESSES.PRESALE}#code`} target="_blank" rel="noopener noreferrer" className={styles.trustRow}>
            <span>Presale contract</span><span className={styles.trustMeta}>{shortAddr(PRESALE_ADDRESSES.PRESALE)} ↗</span>
          </a>
          <a href={`${BSCSCAN}/token/${PRESALE_ADDRESSES.TOKEN}`} target="_blank" rel="noopener noreferrer" className={styles.trustRow}>
            <span>JOOB token</span><span className={styles.trustMeta}>{shortAddr(PRESALE_ADDRESSES.TOKEN)} ↗</span>
          </a>
          <a href={`${BSCSCAN}/address/${PRESALE_ADDRESSES.PRESALE}#readContract`} target="_blank" rel="noopener noreferrer" className={styles.trustRow}>
            <span>Token vault</span>
            <span className={vaultSealed ? styles.trustOk : styles.trustWarn}>
              {vaultSealed ? `🔒 ${fmtToken(global.depositedTokens, td, 0)} JOOB locked` : 'Funding pending'} ↗
            </span>
          </a>
        </div>

        <div className={styles.trustBlock}>
          <div className={styles.trustHead}>
            <span className={styles.trustIcon} aria-hidden="true">🛡</span>
            <div>
              <div className={styles.trustTitle}>Audited by SpyWolf</div>
              <div className={styles.trustSub}>No critical, high or medium issue</div>
            </div>
          </div>
          <a href={AUDITS.PRESALE} target="_blank" rel="noopener noreferrer" className={styles.trustRow}>
            <span>Presale contract audit</span><span className={styles.trustMeta}>PDF ↗</span>
          </a>
          <a href={AUDITS.TOKEN} target="_blank" rel="noopener noreferrer" className={styles.trustRow}>
            <span>JOOB token audit</span><span className={styles.trustMeta}>PDF ↗</span>
          </a>
          <Link href="/security" className={styles.trustRow}>
            <span>All audits &amp; contracts</span><span className={styles.trustMeta}>Security →</span>
          </Link>
        </div>
      </div>

      <div className={styles.column}>
        {beforeStart && (
          <div className={`${styles.card} ${styles.row}`}>
            <span className={styles.muted}>Sale opens in</span>
            <span className={styles.countdown}><Countdown seconds={config.startTime - now} /></span>
          </div>
        )}

        {/* ── Carte d'achat ─────────────────────────────────────────────── */}
        <form onSubmit={handleBuy} className={styles.card}>
          <div className={styles.refs}>
            <div><div className={styles.small}>Starting price</div><div className={styles.strong}>${fmtUsd(config.basePrice, pd)}</div></div>
            <div>
              <div className={styles.small}>Last presale price</div>
              <div className={styles.strong}>${fmtUsd(endPrice, pd)}</div>
              {extensionsLeft > 0 && <div className={styles.small}>max ${fmtUsd(maxPrice, pd)} if extended</div>}
            </div>
            <div><div className={styles.small}>Planned listing</div><div className={styles.strong}>${PLANNED_LISTING_PRICE}</div></div>
            <div><div className={styles.small}>Sale cap</div><div className={styles.strong}>{fmtNum(Number(ethers.formatUnits(config.cap, td)) / 1e6, 1)}M JOOB</div></div>
          </div>
          <div className={styles.schedule}>
            +${fmtUsd((config.basePrice * config.priceIncreaseBps) / 10_000n, pd)} every {Number(config.priceIncreasePeriod) / 86400} days · {fmtDate(config.startTime)} → {fmtDate(global.endTime)}
          </div>

          <div className={styles.stats}>
            {[
              { l: 'Current price', v: `$${fmtUsd(currentPrice, pd)}`, accent: true },
              { l: 'Next price', v: isEnded ? '—' : `$${fmtUsd(nextPrice, pd)}` },
              { l: 'Raised so far', v: `$${fmtNum(Number(ethers.formatUnits(global.totalRaised, pd)), 0)}` },
              { l: 'Allocated', v: `${soldPct.toFixed(2)}%` },
            ].map((b) => (
              <div key={b.l} className={styles.stat}>
                <div className={styles.statLabel}>{b.l}</div>
                <div className={`${styles.statValue} ${b.accent ? styles.accent : ''}`}>{b.v}</div>
              </div>
            ))}
          </div>
          <div className={styles.progress}><div style={{ width: `${Math.min(100, soldPct)}%` }} /></div>

          <Feedback status={status} step={step} success={successMsg} error={txError} />

          <div className={styles.fieldHead}>
            <span>You pay</span>
            <span>
              Balance: {account ? fmtUsd(balance, pd, 2) : '—'}
              {account && (
                <button type="button" className={styles.max} onClick={() => {
                  const cap = maxPurchasable > 0n && maxPurchasable < balance ? maxPurchasable : balance;
                  setAmount(ethers.formatUnits(cap, pd));
                }}>Max</button>
              )}
            </span>
          </div>
          <div className={styles.field}>
            <select value={paymentToken} onChange={(e) => setPaymentToken(e.target.value)} aria-label="Payment token" className={styles.select}>
              <option value="USDT">USDT (BEP-20)</option>
              <option value="USDC">USDC (BEP-20)</option>
            </select>
            <input type="number" inputMode="decimal" min="0" step="any" placeholder="0.00" value={amount} aria-label="Amount to pay"
              onChange={(e) => { setAmount(e.target.value); if (status !== 'loading') { setStatus('idle'); setTxError(null); } }}
              className={styles.amount} />
          </div>

          <div className={styles.fieldHead}><span>You receive (vested)</span></div>
          <div className={styles.field}>
            <span className={styles.tokenTag}>JOOB</span>
            <div className={styles.receive}>
              <div className={styles.receiveValue}>{fmtToken(estimate.tokens + estimate.bonus, td)}</div>
              {estimate.bonus > 0n && <div className={styles.bonusNote}>incl. +{fmtToken(estimate.bonus, td)} volume bonus</div>}
            </div>
          </div>

          <div className={styles.tier}>
            <span className={styles.tierPill}>{Number(volumeTierBps(config, user.contribution + amountWei)) / 100}%</span>
            <div className={styles.tierBar}><div style={{ width: `${tierPct}%` }} /></div>
            <span className={`${styles.tierPill} ${styles.tierNext}`}>{nextTier ? `${Number(nextTier.bps) / 100}%` : 'MAX'}</span>
          </div>
          <div className={styles.small}>
            {nextTier
              ? <>Contribute another <b>${fmtUsd(nextTier.missing, pd, 0)}</b> (cumulative) to reach the <b>+{Number(nextTier.bps) / 100}%</b> volume bonus tier.</>
              : <>Highest volume bonus tier reached (+{Number(config.tierBps[config.tierBps.length - 1] ?? 0n) / 100}%).</>}
          </div>

          {isLive && maxPurchasable > 0n && <div className={styles.small}>Maximum currently purchasable: ~${fmtUsd(maxPurchasable, pd, 0)} (bonuses included).</div>}
          {amountError && <div className={styles.error}>{amountError}</div>}

          <label className={styles.terms}>
            <input type="checkbox" checked={termsAccepted} disabled={!account} onChange={(e) => onTerms(e.target.checked)} />
            <span>
              I have read and accept the <Link href="/presale-terms" className={styles.link}>Presale Terms</Link>. I confirm I am not a resident
              of a restricted jurisdiction, I understand that tokens are vested, that the price after the sale is set by the market and
              not guaranteed, and that I may lose all the funds I contribute.
            </span>
          </label>

          {!account ? (
            <button type="button" onClick={connectWallet} className={styles.cta}>Connect wallet</button>
          ) : !isCorrectNetwork ? (
            <button type="button" onClick={doSwitch} className={`${styles.cta} ${styles.ctaWarn}`}>Switch to BNB Smart Chain</button>
          ) : (
            <button type="submit" disabled={!canBuy} className={styles.cta}>{buyLabel}</button>
          )}

          <div className={styles.refRow}>
            <label htmlFor="ref-code" className={styles.muted}>Referral code</label>
            <input id="ref-code" value={refInput} onChange={(e) => { setRefInput(e.target.value); setRefError(null); }}
              onBlur={applyReferral} placeholder="0x… referrer address" className={styles.refInput} />
            <button type="button" onClick={applyReferral} className={styles.refBtn}>Apply</button>
          </div>
          {refError && <div className={styles.error}>{refError}</div>}
          {effectiveReferrer && (
            <div className={styles.small}>
              Referred by {effectiveReferrer.slice(0, 6)}…{effectiveReferrer.slice(-4)} — they receive {Number(config.referralBps) / 100}% in JOOB (same vesting).
            </div>
          )}

          <p className={styles.fine}>
            Vesting: {Number(config.tgeBps) / 100}% when the sale ends, the rest linearly over {Math.round(Number(config.vestingDuration) / 86400)} days.
            The {fmtNum(Number(ethers.formatUnits(config.cap, td)) / 1e6, 1)}M JOOB cap includes referral and volume bonuses; unsold tokens are
            returned to the JoobEscrow multisig and burned. Never send funds directly to the contract address: always buy with the button above.
          </p>
        </form>

        {/* ── Tableau de bord ───────────────────────────────────────────── */}
        {account && (
          <div className={styles.card}>
            <h2 className={styles.h2}>Your allocation</h2>
            <div className={styles.stats}>
              {[
                { l: 'Total JOOB', v: fmtToken(user.allocation, td), accent: true },
                { l: 'Bought', v: fmtToken(user.purchased, td) },
                { l: 'Volume bonus', v: fmtToken(user.volumeBonus, td) },
                { l: 'Contributed', v: `$${fmtUsd(user.contribution, pd, 2)}` },
                { l: 'Claimed', v: fmtToken(user.claimed, td) },
                { l: 'Claimable now', v: fmtToken(user.claimable, td), accent: true },
              ].map((b) => (
                <div key={b.l} className={styles.stat}>
                  <div className={styles.statLabel}>{b.l}</div>
                  <div className={`${styles.statValue} ${b.accent ? styles.accent : ''}`}>{b.v}</div>
                </div>
              ))}
            </div>
            {user.allocation > user.purchased + user.volumeBonus && (
              <p className={styles.small}>Includes {fmtToken(user.allocation - user.purchased - user.volumeBonus, td)} JOOB of referral rewards.</p>
            )}
            {isEnded ? (
              <button onClick={handleClaim} disabled={user.claimable === 0n || status === 'loading'} className={styles.cta}>
                {user.claimable > 0n ? `Claim ${fmtToken(user.claimable, td)} JOOB` : 'Nothing to claim yet'}
              </button>
            ) : (
              <p className={styles.small}>Claims open when the sale ends: {Number(config.tgeBps) / 100}% immediately, then linear vesting.</p>
            )}

            <div className={styles.divider} />
            <h3 className={styles.h3}>Your referral link</h3>
            <p className={styles.small}>Referrers receive {Number(config.referralBps) / 100}% of the JOOB bought through their link, with the same vesting.</p>
            <div className={styles.refRow}>
              <input readOnly value={referralLink} aria-label="Your referral link" className={styles.refInput} />
              <button type="button" onClick={copyLink} className={styles.refBtn}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
          </div>
        )}

        <p className={styles.fine}>
          Official links are only published on joobescrow.com and <a href="https://t.me/JoobEscrow_Official" target="_blank" rel="noopener noreferrer" className={styles.link}>t.me/JoobEscrow_Official</a>.
          Contract owner: <a href={`https://app.safe.global/home?safe=bnb:${PRESALE_ADDRESSES.SAFE}`} target="_blank" rel="noopener noreferrer" className={styles.link}>JoobEscrow Safe multisig</a>.
        </p>
      </div>
    </div>
  );
}

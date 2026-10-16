'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useAppKitNetwork, useAppKitProvider, useDisconnect } from '@reown/appkit/react';
import { bsc, mainnet, arbitrum, base, polygon, optimism, avalanche } from '@reown/appkit/networks';
import { useWeb3 } from '../../../context/Web3Context';
import {
  PRESALE_ADDRESSES, PRESALE_ABI, ERC20_ABI, PRESALE_STATE, PRESALE_CHAIN_ID, BSCSCAN, AUDITS,
  priceAt, nextStepAt, volumeTierBps, readableError, maxPurchasablePayment, isSoldOut, closingTime,
  PLANNED_LISTING_PRICE,
} from '../../../config/presale';
import styles from './presale.module.css';
import { BSCN_ARTICLE_URL } from '../../../config/links';
import TokenPicker, { TokenLogo } from '../../../components/TokenPicker';
import { useCatalog, NATIVE } from '../../../lib/crosschain/sources';
import { useRouteQuote, useSourceBalance } from '../../../lib/crosschain/hooks';
import { makeLifiClient, quote as lifiQuote, quoteCost, contractCalls, runRoute, progressOf } from '../../../lib/crosschain/lifi';

const SLIPPAGE_BPS = 50n;
// Paiement depuis un autre reseau : le prix peut monter pendant le bridge (1-3 min).
const CROSS_SLIPPAGE_BPS = 100n;
const NETWORKS_BY_ID = Object.fromEntries([bsc, mainnet, arbitrum, base, polygon, optimism, avalanche].map((n) => [n.id, n]));
const REFRESH_INTERVAL_MS = 15_000;
const shortAddr = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const REF_PARAM = 'referrer';
const REF_STORAGE_KEY = 'joob_presale_referrer';

function readStored(k) {
  try { return typeof window === 'undefined' ? null : localStorage.getItem(k); } catch { return null; }
}

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
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return (
    <span className={styles.countdownMono}>
      {String(days).padStart(2, '0')}d {String(hours).padStart(2, '0')}h {String(mins).padStart(2, '0')}m {String(secs).padStart(2, '0')}s
    </span>
  );
}

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

// Consultation d'une allocation sans connecter de wallet : lecture seule sur le contrat.
function AllocationLookup({ readProvider, td, pd }) {
  const [addr, setAddr] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (e) => {
    e.preventDefault();
    const v = addr.trim();
    setResult(null);
    if (!ethers.isAddress(v)) { setError('Paste a valid 0x… wallet address.'); return; }
    setError(null);
    setLoading(true);
    try {
      const c = new ethers.Contract(PRESALE_ADDRESSES.PRESALE, PRESALE_ABI, readProvider);
      const a = ethers.getAddress(v);
      const [allocation, purchased, volumeBonus, cUSDC, cUSDT, claimed] = await Promise.all([
        c.allocations(a), c.purchasedTokens(a), c.volumeBonusPaid(a), c.contributionsUSDC(a), c.contributionsUSDT(a), c.claimed(a),
      ]);
      setResult({ address: a, allocation, purchased, volumeBonus, referral: allocation - purchased - volumeBonus, contribution: cUSDC + cUSDT, claimed });
    } catch (err) {
      console.error('[Presale] lookup:', err);
      setError('Could not read the contract right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.lookup}>
      <div className={styles.lookupTitle}>Already bought? <span>Check your JOOB with your address, no need to connect your wallet.</span></div>
      <form onSubmit={lookup} className={styles.lookupForm}>
        <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Paste your 0x… address" className={styles.lookupInput} spellCheck={false} autoComplete="off" />
        <button type="submit" className={styles.lookupBtn} disabled={loading}>{loading ? '…' : 'Check'}</button>
      </form>
      {error && <p className={styles.lookupError}>{error}</p>}
      {result && (
        <div className={styles.lookupResult}>
          <a href={`${BSCSCAN}/address/${result.address}`} target="_blank" rel="noopener noreferrer" className={styles.walletAddr}>
            {result.address.slice(0, 6)}…{result.address.slice(-4)} ↗
          </a>
          {result.allocation === 0n ? (
            <p className={styles.lookupEmpty}>No JOOB allocated to this address yet.</p>
          ) : (
            <ul className={styles.lookupList}>
              <li><span>Total JOOB</span><b>{fmtToken(result.allocation, td)}</b></li>
              <li><span>Purchased</span><b>{fmtToken(result.purchased, td)}</b></li>
              <li><span>Volume bonus</span><b>{fmtToken(result.volumeBonus, td)}</b></li>
              <li><span>Referral rewards</span><b>{fmtToken(result.referral > 0n ? result.referral : 0n, td)}</b></li>
              <li><span>Contributed</span><b>${fmtUsd(result.contribution, pd, 2)}</b></li>
              <li><span>Claimed</span><b>{fmtToken(result.claimed, td)}</b></li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Feedback({ status, step, success, error }) {
  if (status === 'loading' && step) return <div className={`${styles.feedback} ${styles.feedbackInfo}`}>{step}</div>;
  if (status === 'success' && success) return <div className={`${styles.feedback} ${styles.feedbackOk}`}>{success}</div>;
  if (status === 'error' && error) return <div className={`${styles.feedback} ${styles.feedbackErr}`}>{error}</div>;
  return null;
}

export default function PresaleClient() {
  const { account, provider, readProvider, connectWallet } = useWeb3();
  const { disconnect } = useDisconnect();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');
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
  // Paiement depuis un autre token ou reseau (null = USDT/USDC sur BSC, achat direct).
  const [source, setSource] = useState(null);
  const [picking, setPicking] = useState(false);
  const [balanceTick, setBalanceTick] = useState(0);

  const isCorrectNetwork = Number(chainId) === PRESALE_CHAIN_ID;

  useEffect(() => {
    try { if (referrer) localStorage.setItem(REF_STORAGE_KEY, referrer); } catch { /* ignore */ }
  }, [referrer]);

  const applyReferral = useCallback(() => {
    const v = refInput.trim();
    if (!v) {
      setReferrer(null);
      try { localStorage.removeItem(REF_STORAGE_KEY); } catch { /* ignore */ }
      return;
    }
    if (!ethers.isAddress(v)) { setRefError('Invalid referral address: paste a valid 0x… wallet address.'); return; }
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

  const pd = config?.paymentDecimals ?? 18;
  const td = config?.tokenDecimals ?? 18;
  const state = global?.state ?? PRESALE_STATE.PENDING;
  const beforeStart = !!config && now < config.startTime;
  const isLive = state === PRESALE_STATE.ACTIVE && !!global && !global.paused && now <= global.endTime;
  const isEnded = state === PRESALE_STATE.ENDED;
  const awaitingFinalize = state === PRESALE_STATE.ACTIVE && !!global && now > global.endTime;

  const currentPrice = global?.currentPrice ?? config?.basePrice ?? 0n;
  const nextStep = config ? nextStepAt(config, now) : 0n;
  const nextPrice = config ? priceAt(config, nextStep) : 0n;
  // Vente close (fin passee ou finalisee) : on affiche le prix du dernier palier, pas un prix calcule sur l'horloge.
  const finalPrice = config && global ? priceAt(config, closingTime(global)) : 0n;
  const nextStepRemaining = config && nextStep > now ? nextStep - now : 0n;

  const balance = paymentToken === 'USDT' ? user.balanceUSDT : user.balanceUSDC;
  const allowance = paymentToken === 'USDT' ? user.allowanceUSDT : user.allowanceUSDC;

  const amountWei = useMemo(() => {
    try { return amount && Number(amount) > 0 ? ethers.parseUnits(amount, pd) : 0n; } catch { return 0n; }
  }, [amount, pd]);

  const estimate = useMemo(() => {
    if (!config || amountWei === 0n || currentPrice === 0n) return { tokens: 0n, bonus: 0n };
    const tokens = (amountWei * 10n ** BigInt(td)) / currentPrice;
    const bonusBps = volumeTierBps(config, user.contribution + amountWei);
    const owed = ((user.purchased + tokens) * bonusBps) / 10_000n;
    const bonus = owed > user.volumeBonus ? owed - user.volumeBonus : 0n;
    return { tokens, bonus };
  }, [config, amountWei, currentPrice, td, user]);

  const nextTier = useMemo(() => {
    if (!config) return null;
    const cumulative = user.contribution + amountWei;
    const idx = config.tierThresholds.findIndex((t) => cumulative < t);
    if (idx === -1) return null;
    return { threshold: config.tierThresholds[idx], bps: config.tierBps[idx], missing: config.tierThresholds[idx] - cumulative };
  }, [config, user.contribution, amountWei]);

  const maxPurchasable = useMemo(() => maxPurchasablePayment(config, global, currentPrice), [config, global, currentPrice]);

  const soldOut = isLive && currentPrice > 0n && isSoldOut(config, global, currentPrice);
  const vaultSealed = !!config && !!global && global.depositedTokens >= config.cap;
  const soldPct = soldOut ? 100 : config && global && config.cap > 0n ? Number((global.totalTokensOwed * 10_000n) / config.cap) / 100 : 0;
  const referralLink = account && typeof window !== 'undefined' ? `${window.location.origin}/presale?${REF_PARAM}=${account}` : '';

  const crossChain = !!source && !source.direct;
  const amountError = useMemo(() => {
    if (amountWei === 0n) return null;
    if (!crossChain && account && amountWei > balance) return `Insufficient ${paymentToken} balance.`;
    if (maxPurchasable > 0n && amountWei > maxPurchasable) return `Above maximum purchasable (~$${fmtUsd(maxPurchasable, pd, 2)}).`;
    return null;
  }, [amountWei, balance, account, paymentToken, maxPurchasable, pd, crossChain]);

  // ── Autre token / reseau : devis LI.FI en direct et solde du token choisi ──
  const catalog = useCatalog();
  const directRow = catalog?.rows.find((r) => r.direct === paymentToken);
  const crossParams = crossChain && isLive && !soldOut && amountWei > 0n && !amountError
    ? {
        fromChainId: source.chainId,
        fromToken: source.address,
        useUSDT: paymentToken === 'USDT',
        amountWei,
        minTokens: (estimate.tokens * (10_000n - CROSS_SLIPPAGE_BPS)) / 10_000n,
        buyer: account,
        referrer: effectiveReferrer ?? ethers.ZeroAddress,
      }
    : undefined;
  const route = useRouteQuote(crossParams);
  const cost = route.status === 'ok' ? quoteCost(route.step) : null;
  const sourceBalance = useSourceBalance(crossChain ? source : null, account, balanceTick);

  // MAX hors chemin direct : valeur en dollars du solde, moins une reserve. Token
  // natif (ETH, BNB...) : il paie aussi le gas et le wallet en reserve davantage ;
  // autres tokens : 3 % pour les frais de bridge.
  const maxCrossUsd = (bal, s) => {
    if (!s.priceUSD) return '';
    const usd = Number(ethers.formatUnits(bal, s.decimals)) * s.priceUSD;
    const reserve = s.address.toLowerCase() === NATIVE ? Math.max(usd * 0.08, 0.5) : usd * 0.03;
    const capped = Math.min(usd - reserve, maxPurchasable > 0n ? Number(ethers.formatUnits(maxPurchasable, pd)) : Infinity);
    return Math.max(0, Math.floor(capped * 100) / 100).toString();
  };

  const pickSource = (s) => {
    setPicking(false);
    if (s.direct) { setPaymentToken(s.direct); setSource(null); } else setSource(s);
    if (status !== 'loading') { setStatus('idle'); setTxError(null); }
  };

  const canBuy = isLive && !soldOut && (crossChain ? route.status === 'ok' : isCorrectNetwork) && amountWei > 0n && !amountError && status !== 'loading';

  const doSwitch = async () => { try { await switchNetwork(bsc); } catch { /* ignore */ } };
  const switchToChain = async (id) => {
    const network = NETWORKS_BY_ID[id];
    if (!network) throw new Error(`Unsupported network ${id}`);
    await switchNetwork(network);
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    setTxError(null); setSuccessMsg(null);
    if (crossChain) { await handleCrossBuy(); return; }
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
      setSuccessMsg(`Purchase confirmed! ~${fmtToken(expected + estimate.bonus, td)} JOOB added to your allocation.`);
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

  // ── Achat depuis un autre token / reseau ─────────────────────────────────
  // LI.FI convertit et appelle buyFor() sur BSC au nom de l'acheteur, sans aucun
  // ecran LI.FI : la progression s'affiche dans le bouton.
  const progressLabel = (p) => ({
    approve: `Approve ${source?.symbol ?? ''} in your wallet…`,
    confirm: 'Confirm in your wallet…',
    bridging: 'Bridging to BNB Smart Chain… (1–3 min)',
    finalizing: 'Finalizing your purchase…',
  })[p];

  const handleCrossBuy = async () => {
    if (!account || !walletProvider) { await connectWallet(); return; }
    if (!crossParams || !canBuy) return;
    setStatus('loading');
    try {
      if (Number(chainId) !== source.chainId) {
        setStep(`Switch to ${source.chainName} in your wallet…`);
        await switchToChain(source.chainId);
      }
      setStep('Getting the best route…');
      const params = { ...crossParams, buyer: account };
      const client = makeLifiClient(walletProvider, account, switchToChain);
      const quoted = await lifiQuote(client, params);
      setStep('Confirm in your wallet…');
      await runRoute(client, quoted, contractCalls(params), (r) => setStep(progressLabel(progressOf(r))));
      setStatus('success');
      setSuccessMsg(`Purchase confirmed! ~${fmtToken(estimate.tokens + estimate.bonus, td)} JOOB added to your allocation.`);
      setAmount('');
      setBalanceTick((n) => n + 1);
      await refreshAll();
    } catch (err) {
      console.error('[Presale] cross-chain buy:', err);
      setStatus('error');
      setTxError(readableError(err));
    } finally {
      setStep('');
    }
  };

  const handleFinalize = async () => {
    if (!provider || !account) return;
    if (!isCorrectNetwork) { await doSwitch(); return; }
    setTxError(null); setSuccessMsg(null); setStatus('loading'); setStep('Finalizing the sale…');
    try {
      const signer = await provider.getSigner();
      const presale = new ethers.Contract(PRESALE_ADDRESSES.PRESALE, PRESALE_ABI, signer);
      await (await presale.finalize()).wait();
      setStatus('success'); setSuccessMsg('Sale finalized: claims are open.');
      await refreshAll();
    } catch (err) {
      console.error('[Presale] finalize:', err);
      setStatus('error'); setTxError(readableError(err));
    } finally { setStep(''); }
  };

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

  if (loadError) return <div className={styles.center}><p className={styles.feedbackErr}>{loadError}</p></div>;
  if (!config || !global) return <div className={styles.center}><p style={{ color: '#94a3b8' }}>Loading presale data from BNB Smart Chain…</p></div>;

  const badge = isLive ? (soldOut ? ['Sold out', styles.badgeMuted] : ['Live', styles.badgeLive])
    : isEnded ? ['Sale ended', styles.badgeMuted]
      : awaitingFinalize ? ['Finalization pending', styles.badgeMuted]
      : beforeStart ? ['Opening Oct 15', styles.badgePending]
        : global.paused ? ['Paused', styles.badgePending]
          : ['Opening shortly', styles.badgePending];

  const buyLabel = status === 'loading' ? (step || 'Processing…')
    : !isLive ? (isEnded || awaitingFinalize ? 'Sale ended' : 'Sale not open yet')
      : soldOut ? 'Sold out'
        : amountWei === 0n ? 'Enter an amount'
          : crossChain && route.status === 'loading' ? 'Getting the best route…'
          : crossChain && route.status === 'error' ? 'Amount too low from this network'
          : !crossChain && allowance < amountWei ? `Approve & buy with ${paymentToken}` : 'Buy JOOB';

  const tierPct = nextTier ? Math.min(100, Number(((user.contribution + amountWei) * 10_000n) / nextTier.threshold) / 100) : 100;
  const capM = fmtNum(Number(ethers.formatUnits(config.cap, td)) / 1e6, 1);
  const totalRaisedFmt = fmtNum(Number(ethers.formatUnits(global.totalRaised, pd)), 0);

  return (
    <>
      {/* ── Sticky Quick Navigation ─────────────────────────────── */}
      <div className={styles.quickNavWrap}>
        <nav className={styles.quickNav} aria-label="Quick links">
          <Link href="/whitepaper" className={styles.quickPill}>Whitepaper</Link>
          <Link href="/tokenomics" className={styles.quickPill}>Tokenomics</Link>
          <Link href="/tokenomics#use-of-funds" className={styles.quickPill}>Use of funds</Link>
          <Link href="/ecosystem" className={styles.quickPill}>Ecosystem</Link>
          <Link href="/roadmap" className={styles.quickPill}>Roadmap</Link>
          <a href="#referral" className={styles.quickPill}>Referral</a>
          <a href="#faq" className={styles.quickPill}>FAQ</a>
          <Link href="/presale-terms" className={styles.quickPill}>Terms</Link>
        </nav>
      </div>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <header className={styles.hero}>
        <div className={styles.heroPill}>
          <span className={styles.pulseDot} />
          JOOB PRESALE · {badge[0]}
        </div>
        <h1 className={styles.heroTitle}>
          Join the <span className={styles.titleGradient}>JOOB Presale</span>
        </h1>
        <div className={styles.proofLine}>
          SEALED VAULT · AUDITED BY SPYWOLF · VESTING ON-CHAIN
        </div>

        <div className={styles.trustBadges}>
          <a href={`${BSCSCAN}/address/${PRESALE_ADDRESSES.PRESALE}#code`} target="_blank" rel="noopener noreferrer" className={styles.trustBadge}>
            <span className={styles.trustBadgeOk}>✓</span> Verified contract ↗
          </a>
          <a href={`${BSCSCAN}/token/${PRESALE_ADDRESSES.TOKEN}`} target="_blank" rel="noopener noreferrer" className={styles.trustBadge}>
            JOOB token ↗
          </a>
          <a href={`${BSCSCAN}/address/${PRESALE_ADDRESSES.PRESALE}#readContract`} target="_blank" rel="noopener noreferrer" className={styles.trustBadge}>
            <span className={styles.trustBadgeOk}>{vaultSealed ? '🔒 163.5M JOOB vault locked' : 'Vault funding'}</span> ↗
          </a>
          <a href={AUDITS.PRESALE} target="_blank" rel="noopener noreferrer" className={styles.trustBadge}>
            <span className={styles.trustBadgeOk}>🛡</span> SpyWolf audited ↗
          </a>
          <Link href="/security" className={styles.trustBadge}>
            3/5 Safe Multisig →
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
          <a href={BSCN_ARTICLE_URL} target="_blank" rel="noopener noreferrer" className="press-pill">
            <img src="/logos/bscnews.webp" alt="BSC News" width={30} height={30} style={{ borderRadius: 8, flexShrink: 0 }} />
            <span>Read our launch article on <strong>BSC News</strong></span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      {/* ── Presale Hero Grid (Buy Card + Side Column) ───────────── */}
      <div className={styles.presaleGrid}>
        {/* Left: Glass Buy Card */}
        <form onSubmit={handleBuy} className={styles.glassBuyCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardBrand}>
              <img src="/logo.svg" alt="" width={24} height={24} />
              <span>JOOB · Presale</span>
            </div>
            <span className={`${styles.stateBadge} ${badge[1]}`}>
              {badge[0]}
            </span>
          </div>

          <Feedback status={status} step={step} success={successMsg} error={txError} />

          {beforeStart ? (
            <div className={styles.raisedBox}>
              <div className={styles.raisedLabel}>Presale Opens In</div>
              <Countdown seconds={config.startTime - now} />
            </div>
          ) : (
            <div className={styles.raisedBox}>
              <div className={styles.raisedLabel}>Total Raised</div>
              <div className={styles.raisedValue}>${totalRaisedFmt}</div>
            </div>
          )}

          {/* Sub-cards: Price & Allocation */}
          {/* Prix : libelle a gauche, valeur a droite */}
          <div className={styles.metricsGrid}>
            <div className={styles.priceTile}>
              <span className={styles.priceTileLabel}>{isEnded || awaitingFinalize ? 'Final price' : 'Current price'}</span>
              <span className={`${styles.priceTileVal} ${styles.priceTileAccent}`}>{soldOut ? 'Sold out' : `$${fmtUsd(isEnded || awaitingFinalize ? finalPrice : currentPrice, pd)}`}</span>
            </div>
            <div className={styles.priceTile}>
              <span className={styles.priceTileLabel}>Next price</span>
              <span className={styles.priceTileVal}>{isEnded || awaitingFinalize || soldOut ? '—' : `$${fmtUsd(nextPrice, pd)}`}</span>
            </div>
          </div>

          {/* Cap Progress Bar with Glow Handle */}
          <div className={styles.capProgressWrap}>
            <div className={styles.capProgressHeader}>
              <span>JOOB allocated <b className={styles.capProgressStrong}>{fmtToken(global.totalTokensOwed, td, 0)}</b> / {capM}M</span>
              <span>{soldPct.toFixed(2)}%</span>
            </div>
            <div className={styles.capProgressBar}>
              <div className={styles.capProgressFill} style={{ width: `${Math.min(100, Math.max(3, soldPct))}%` }}>
                <span className={styles.capProgressHandle} />
              </div>
            </div>
          </div>

          {soldOut && (
            <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
              The cap is reached: less than 1 JOOB is left to sell. Claims open after the end date ({fmtDate(global.endTime)}).
            </div>
          )}

          {/* Next Price Bar */}
          {isLive && !soldOut && (
            <div className={styles.nextPriceBar}>
              <span>Next price increase in:</span>
              <span className={styles.nextPriceCountdown}>
                {nextStepRemaining > 0n ? `${Math.floor(Number(nextStepRemaining) / 3600)}h ${Math.floor((Number(nextStepRemaining) % 3600) / 60)}m` : 'imminent'}
              </span>
            </div>
          )}

          {/* Amount and Currency Selection */}
          <div className={styles.formSection}>
            <div className={styles.fieldLabelRow}>
              <span>{crossChain ? 'You pay ($)' : 'You pay'}</span>
              <span className={styles.balanceRow}>
                Balance: {!account ? '—'
                  : crossChain ? (sourceBalance !== undefined ? `${fmtNum(Number(ethers.formatUnits(sourceBalance, source.decimals)), 4)} ${source.symbol}` : '…')
                  : fmtUsd(balance, pd, 2)}
                {account && (!crossChain || sourceBalance !== undefined) && (
                  <button type="button" className={styles.maxPillBtn} onClick={() => {
                    if (crossChain && sourceBalance !== undefined) { setAmount(maxCrossUsd(sourceBalance, source)); return; }
                    const cap = maxPurchasable > 0n && maxPurchasable < balance ? maxPurchasable : balance;
                    setAmount(ethers.formatUnits(cap, pd));
                  }}>MAX</button>
                )}
              </span>
            </div>

            {/* Le bouton du token ouvre le choix du token et du reseau */}
            <div className={styles.inputGroup}>
              <div className={styles.tokenBtnWrap}>
                <button type="button" onClick={() => setPicking(true)} aria-label="Change token or network" className={styles.tokenBtn}>
                  <TokenLogo src={crossChain ? source.logoURI : directRow?.logoURI ?? `/logos/${paymentToken.toLowerCase()}.svg`}
                    badge={crossChain ? source.chainLogoURI : directRow?.chainLogoURI} size={22} />
                  <span>{crossChain ? source.symbol : paymentToken}</span>
                  <span className={styles.tokenBtnChevron}>▾</span>
                </button>
                <span role="tooltip" className={styles.tokenTip}>Change token or network</span>
              </div>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0.00"
                value={amount}
                aria-label="Amount to pay"
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (status !== 'loading') { setStatus('idle'); setTxError(null); }
                }}
                className={`${styles.inputField} ${styles.inputRight}`}
              />
            </div>
            {crossChain && route.status === 'loading' && <div className={styles.quoteLine}>Getting the best route…</div>}
            {crossChain && cost && (
              <div className={styles.quoteLine}>
                ≈ {cost.fromAmount.toLocaleString('en-US', { maximumSignificantDigits: 4 })} {source.symbol} · ${cost.usd.toFixed(2)} incl. fees
              </div>
            )}
            {crossChain && route.status === 'error' && (
              <div className={`${styles.feedback} ${styles.feedbackErr}`}>Amount too low from this network: bridges need a minimum of about $2–3. Try a higher amount, or pay in USDT/USDC on BNB Smart Chain.</div>
            )}

            {/* "You Receive" Highlight */}
            <div className={styles.receiveBox}>
              <div className={styles.receiveHeader}>
                <span>You receive (vested)</span>
                <span>BNB Chain</span>
              </div>
              <div className={styles.receiveAmount}>
                {fmtToken(estimate.tokens + estimate.bonus, td)} JOOB
              </div>
              {estimate.bonus > 0n && (
                <div className={styles.receiveBonusNote}>
                  ✓ Includes +{fmtToken(estimate.bonus, td)} volume bonus
                </div>
              )}
            </div>

            {/* Volume Tier Progress */}
            {/* Barre du bonus de volume ; survol ou focus : tous les paliers */}
            <div className={styles.tierWrap}>
              <div className={styles.tierBarRow}>
                <span className={styles.tierPill}>{Number(volumeTierBps(config, user.contribution + amountWei)) / 100}%</span>
                <div className={styles.tierBar}>
                  <div className={styles.tierFill} style={{ width: `${tierPct}%` }} />
                </div>
                <span className={styles.tierPill}>{nextTier ? `+${Number(nextTier.bps) / 100}%` : 'MAX'}</span>
              </div>
              <div className={styles.tierHint}>
                {/* Bouton : ouvre aussi la liste des paliers au clavier et au toucher. */}
                <button type="button" aria-label="Show volume bonus tiers" aria-describedby="tiers-tip" className={styles.tierInfo}>i</button>
                {nextTier
                  ? <>Contribute another <b>${fmtUsd(nextTier.missing, pd, 0)}</b> to reach the <b>+{Number(nextTier.bps) / 100}%</b> volume bonus.</>
                  : <>Maximum volume bonus reached (+{Number(config.tierBps[config.tierBps.length - 1] ?? 0n) / 100}%).</>}
              </div>
              <div id="tiers-tip" role="tooltip" className={styles.tierTip}>
                <span className={styles.tierTipTitle}>Volume bonus tiers (cumulative purchases)</span>
                {config.tierThresholds.map((th, i) => {
                  const reached = user.contribution + amountWei >= th;
                  return (
                    <span key={i} className={`${styles.tierTipRow} ${reached ? styles.tierTipReached : ''}`}>
                      <span>{reached ? '✓ ' : ''}≥ ${fmtUsd(th, pd, 0)}</span>
                      <b>+{Number(config.tierBps[i]) / 100}%</b>
                    </span>
                  );
                })}
              </div>
            </div>

            {amountError && <div className={`${styles.feedback} ${styles.feedbackErr}`}>{amountError}</div>}

            {/* Action Button */}
            {!account ? (
              <>
                <button type="button" onClick={connectWallet} className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>
                  Connect Wallet
                </button>
                <div className={styles.poweredBy}>
                  <img src="/logos/reown.svg" alt="" width={18} height={12} />
                  Powered by Reown · 700+ wallets
                </div>
              </>
            ) : !isCorrectNetwork && !crossChain ? (
              <button type="button" onClick={doSwitch} className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>
                Switch to BNB Smart Chain
              </button>
            ) : awaitingFinalize ? (
              <button type="button" onClick={handleFinalize} disabled={status === 'loading'} className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>
                {status === 'loading' ? (step || 'Processing…') : 'Finalize the sale (open to anyone)'}
              </button>
            ) : (
              <button type="submit" disabled={!canBuy} className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>
                {buyLabel}
              </button>
            )}
            {account && isLive && !soldOut && (
              <p className={styles.termsNotice}>
                By buying, you accept the <Link href="/presale-terms">Presale Terms</Link>.
              </p>
            )}
            {picking && <TokenPicker onClose={() => setPicking(false)} onPick={pickSource} />}
          </div>
        </form>

        {/* Right Side Column */}
        <aside className={styles.sideColumn}>
          {/* Allocation de l'acheteur : toujours affichee (tirets avant connexion) pour que les
              deux cadres de droite remplissent la hauteur de la carte d'achat. */}
          {(
            <div className={styles.allocCard}>
              <div className={styles.sideCardTitle}>Your Allocation</div>
              {account && (
                <div className={styles.walletRow}>
                  <span className={styles.walletDot} />
                  <a href={`${BSCSCAN}/address/${account}`} target="_blank" rel="noopener noreferrer" className={styles.walletAddr} title={account}>
                    {account.slice(0, 6)}…{account.slice(-4)} ↗
                  </a>
                  <button type="button" onClick={() => disconnect()} className={styles.walletDisconnect} title="Disconnect" aria-label="Disconnect wallet">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className={styles.allocStatsGrid}>
                <div className={styles.allocStatItem}>
                  <div className={styles.allocStatLabel}>Total JOOB</div>
                  <div className={`${styles.allocStatVal} ${styles.allocHighlight}`}>{account ? fmtToken(user.allocation, td) : '—'}</div>
                </div>
                <div className={styles.allocStatItem}>
                  <div className={styles.allocStatLabel}>Purchased</div>
                  <div className={styles.allocStatVal}>{account ? fmtToken(user.purchased, td) : '—'}</div>
                </div>
                <div className={styles.allocStatItem}>
                  <div className={styles.allocStatLabel}>Volume Bonus</div>
                  <div className={styles.allocStatVal}>{account ? fmtToken(user.volumeBonus, td) : '—'}</div>
                </div>
                <div className={styles.allocStatItem}>
                  <div className={styles.allocStatLabel}>Contributed</div>
                  <div className={styles.allocStatVal}>{account ? `$${fmtUsd(user.contribution, pd, 2)}` : '—'}</div>
                </div>
              </div>

              {isEnded && account ? (
                <button onClick={handleClaim} disabled={user.claimable === 0n || status === 'loading'} className="btn btn-primary" style={{ width: '100%' }}>
                  {user.claimable > 0n ? `Claim ${fmtToken(user.claimable, td)} JOOB` : 'Nothing to claim yet'}
                </button>
              ) : awaitingFinalize && account ? (
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '8px' }}>The sale ended. Anyone can finalize it on-chain to open claims.</p>
                  <button onClick={handleFinalize} disabled={status === 'loading'} className="btn btn-primary" style={{ width: '100%' }}>
                    Finalize the sale
                  </button>
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                  Claims open at sale end ({fmtDate(global.endTime)}): {Number(config.tgeBps) / 100}% instantly, then 180-day linear vesting.
                </p>
              )}
              <AllocationLookup readProvider={readProvider} td={td} pd={pd} />
            </div>
          )}

          {/* Referral Card (id="referral") */}
          <div className={styles.referralCard} id="referral">
            <h3 className={styles.referralTitle}>Share &amp; Earn <span className={styles.referralAccent}>2%</span> On-Chain</h3>
            <p className={styles.referralSub}>
              Referrers receive <b className={styles.referralAccent}>2% of all JOOB</b> bought through their link, with the exact same linear vesting.
            </p>

            {account ? (
              <div className={styles.refInputRow}>
                <input readOnly value={referralLink} aria-label="Your referral link" className={styles.refInput} />
                <button type="button" onClick={copyLink} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : (
              <button type="button" onClick={connectWallet} className="btn btn-outline" style={{ width: '100%', fontSize: '0.82rem' }}>
                Connect wallet to generate referral link
              </button>
            )}

            {/* Manual referral entry */}
            <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '6px' }}>Have a referrer? Paste their address:</div>
              <div className={styles.refInputRow}>
                <input
                  value={refInput}
                  onChange={(e) => { setRefInput(e.target.value); setRefError(null); }}
                  onBlur={applyReferral}
                  placeholder="0x… referrer wallet"
                  className={styles.refInput}
                />
                <button type="button" onClick={applyReferral} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                  Apply
                </button>
              </div>
              {refError && <div style={{ color: '#f87171', fontSize: '0.76rem', marginTop: '4px' }}>{refError}</div>}
              {effectiveReferrer && (
                <div style={{ color: '#a3e635', fontSize: '0.76rem', marginTop: '4px' }}>
                  ✓ Referred by {effectiveReferrer.slice(0, 6)}…{effectiveReferrer.slice(-4)}
                </div>
              )}
            </div>
          </div>

        </aside>
      </div>

      {/* How to buy JOOB in 4 steps */}
      <section className={styles.buySteps} aria-label="How to buy JOOB">
        <div className={styles.buyStepsHead}>
          <span className={styles.buyStepsTag}>PRESALE PARTICIPATION</span>
          <h2 className={styles.buyStepsTitle}>How to buy $JOOB</h2>
          <p className={styles.buyStepsSub}>Pay with USDT, USDC, BNB, ETH, POL, AVAX, ARB or OP on BNB Smart Chain, Ethereum, Arbitrum, Base, Polygon, Optimism and Avalanche.</p>
        </div>
        <div className={styles.buyStepsGrid}>
          {[
            ['Connect wallet', 'Connect your EVM wallet (MetaMask, Trust Wallet, Rabby…). Any of the 7 supported networks works; 700+ wallets via Reown.'],
            ['Choose what you pay with', 'Click the token in "You pay" and pick what you hold, on BNB Smart Chain or another network. Keep a little of that network’s native coin for gas.'],
            ['Enter amount', 'Preview your JOOB allocation and your volume bonus tier. From another network, the total cost including fees is shown before you confirm.'],
            ['Approve & buy', 'Confirm in your wallet (approve first if asked; not needed with a native coin). Your allocation is recorded on-chain; from another network, allow 1–3 minutes.'],
          ].map(([t, d], i) => (
            <div key={t} className={styles.buyStepCard}>
              <span className={styles.buyStepNum}>STEP {String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.buyStepName}>{t}</h3>
              <p className={styles.buyStepText}>{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { useToast } from '../context/ToastContext';
import { isUserRejection } from '../lib/walletErrors';
import { ethers } from 'ethers';
import { ESCROW_ABI, TOKEN_ADDRESSES, ERC20_ABI } from '../config/contract';
import { buildCreateData, REF_MAX_LENGTH, REF_PATTERN } from '../lib/escrowReference';
import './CreateEscrowModal.css';

export default function CreateEscrowModal({ onClose, onSuccess, prefilledProvider = '', prefilledAmount = '' }) {
  const { account, signer, ensureCorrectChain, readProvider } = useWeb3();
  const niche = useNiche();
  const { showToast } = useToast();
  const [providerAddr, setProviderAddr] = useState(prefilledProvider);
  const [amount, setAmount] = useState(prefilledAmount);
  const [timeoutDays, setTimeoutDays] = useState(3);
  // Reference facultative gravee dans la transaction (lisible par tous, non modifiable).
  const [reference, setReference] = useState('');
  // Jetons de la niche (USDT par defaut ; USDT ou USDC pour la demo).
  const tokenChoices = niche.tokens || ['USDT'];
  const [tokenSym, setTokenSym] = useState(tokenChoices[0]);
  const tokenAddr = TOKEN_ADDRESSES[tokenSym];
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: input, 2: approve, 3: create
  const [allowanceSufficient, setAllowanceSufficient] = useState(false);

  const [shareableLink, setShareableLink] = useState(null);

  // Verification reactive de l'allowance ERC-20 existante pour cocher l'etape 1 si suffisante.
  useEffect(() => {
    let cancelled = false;
    const num = parseFloat(amount);
    const reader = readProvider || signer;
    if (!account || !reader || !tokenAddr || !niche?.contractAddress || !(num > 0)) {
      return () => { cancelled = true; };
    }
    (async () => {
      try {
        const erc20 = new ethers.Contract(tokenAddr, ERC20_ABI, reader);
        let decimals = 18;
        try {
          decimals = Number(await erc20.decimals());
        } catch {
          decimals = 18;
        }
        const parsedAmount = ethers.parseUnits(amount.toString(), decimals);
        const currentAllowance = await erc20.allowance(account, niche.contractAddress);
        if (!cancelled) {
          setAllowanceSufficient(currentAllowance >= parsedAmount);
        }
      } catch {
        if (!cancelled) setAllowanceSufficient(false);
      }
    })();
    return () => { cancelled = true; };
  }, [account, readProvider, signer, tokenAddr, niche?.contractAddress, amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!niche.contractAddress || !signer) return;

    if (!ethers.isAddress(providerAddr)) {
      showToast('error', "Invalid provider address format.");
      return;
    }
    if (parseFloat(amount) <= 0) {
      showToast('error', "Amount must be greater than 0.");
      return;
    }
    if (account && providerAddr.toLowerCase() === account.toLowerCase()) {
      showToast('error', niche.isDemo
        ? "Use your second wallet's address as provider: the contract refuses the same wallet on both sides."
        : "The provider must be a different wallet than yours.");
      return;
    }
    if (!REF_PATTERN.test(reference)) {
      showToast('error', "Reference: letters, numbers, spaces, '-', '_' and '.' only.");
      return;
    }
    if (niche.minAmount && (parseFloat(amount) < niche.minAmount || parseFloat(amount) > niche.maxAmount)) {
      showToast('error', `Demo amount must be between ${niche.minAmount} and ${niche.maxAmount} ${tokenSym}.`);
      return;
    }

    setLoading(true);
    try {
      await ensureCorrectChain();

      const usdtRead = new ethers.Contract(tokenAddr, ERC20_ABI, readProvider || signer);
      let decimals = 18;
      try {
        decimals = Number(await usdtRead.decimals());
      } catch (err) {
        console.warn("Could not read decimals, defaulting to 18", err);
      }
      
      const parsedAmount = ethers.parseUnits(amount.toString(), decimals);
      
      const usdt = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
      const currentAllowance = await usdt.allowance(account, niche.contractAddress);
      
      if (currentAllowance < parsedAmount) {
        setStep(2);
        const approveTx = await usdt.approve(niche.contractAddress, parsedAmount);
        await approveTx.wait();
        setAllowanceSufficient(true);
      }

      setStep(3);
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, signer);
      const data = buildCreateData(contract.interface, [providerAddr, tokenAddr, parsedAmount, parseInt(timeoutDays) || 7], reference);
      const tx = await signer.sendTransaction({ to: niche.contractAddress, data });
      const receipt = await tx.wait();
      
      let newEscrowId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
          if (parsed && parsed.name === 'EscrowCreated') {
            newEscrowId = parsed.args.escrowId.toString();
          }
        } catch(e) {}
      }

      if (newEscrowId) {
        // Build from the niche slug (always valid) rather than window.location.pathname,
        // which could be "/undefined" and produce a broken 404 link.
        // Page publique /deal : lisible sans wallet, avec un bouton pour ouvrir l'escrow dans l'app.
        const link = `${window.location.origin}/deal/${niche.slug}/${newEscrowId}`;
        setShareableLink(link);
      } else {
        showToast('success', "Escrow created successfully!");
        onSuccess();
        onClose();
      }

    } catch (err) {
      console.error(err);
      const reason = err.reason || err.data?.message || err.message || "Unknown error";
      if (!isUserRejection(err)) {
        showToast('error', `Transaction Failed: ${reason}`);
      }
    }
    setLoading(false);
    setStep(1);
  };

  const copyLinkAndClose = () => {
    navigator.clipboard.writeText(shareableLink);
    showToast('success', "Link copied!");
    onSuccess();
    onClose();
  };

  const numAmount = parseFloat(amount);
  const hasValidAmount = !Number.isNaN(numAmount) && numAmount > 0;
  const feePct = Number(String(niche.feeTier ?? 0).replace('%', '')) || 0;
  const feeAmount = hasValidAmount ? numAmount * (feePct / 100) : 0;
  const providerReceives = hasValidAmount ? Math.max(0, numAmount - feeAmount) : 0;

  const step1Done = (hasValidAmount && allowanceSufficient) || step === 3;
  const step1Active = !step1Done && (step === 1 || step === 2);
  const step2Active = step === 3 || (step1Done && step === 1);

  if (shareableLink) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Escrow created and funded</h2>
          <p className="text-gray-400 my-4 text-sm">
            Your escrow is now locked on BNB Smart Chain. Send this link to the {niche.lexicon.provider.toLowerCase()} so they can review and accept the deal.
          </p>
          <div className="bg-black/50 border border-gray-700 p-3 rounded text-sm text-white mb-6 break-all" style={{ fontFamily: 'monospace' }}>
            {shareableLink}
          </div>
          <button className="btn btn-app-primary w-full" onClick={copyLinkAndClose}>
            Copy Link &amp; Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create {niche.lexicon.escrow}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{niche.lexicon.provider} Address</label>
            <input type="text" value={providerAddr} onChange={e=>setProviderAddr(e.target.value)} required placeholder="0x..." />
          </div>
          <div className="flex gap-4">
            <div className="form-group flex-1">
              <label>Amount ({tokenSym})</label>
              {tokenChoices.length > 1 && (
                <select value={tokenSym} onChange={e=>setTokenSym(e.target.value)} aria-label="Token" style={{ marginBottom: '8px', width: '100%' }}>
                  {tokenChoices.map(t => <option key={t} value={t}>{t} (BEP-20)</option>)}
                </select>
              )}
              <input type="number" step="0.01" min={niche.minAmount} max={niche.maxAmount} value={amount} onChange={e=>setAmount(e.target.value)} required placeholder={niche.isDemo ? '1.00' : '100.00'} />
              {niche.isDemo && (
                <p className="form-hint">Demo: {niche.minAmount} to {niche.maxAmount} {tokenSym}, 0% fee.</p>
              )}
            </div>
            <div className="form-group flex-1">
              <label>Delivery Deadline (Days)</label>
              <input type="number" min="3" max="365" step="1" value={timeoutDays} onChange={e=>setTimeoutDays(e.target.value)} required title="Minimum 3 days as per smart contract rules" />
              <p className="form-hint">
                Min. 3 days enforced by the smart contract to guarantee a fair dispute window.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>Reference (optional)</label>
            <input type="text" value={reference} onChange={e=>setReference(e.target.value)} maxLength={REF_MAX_LENGTH} placeholder="e.g. Escrow_Joob_Deal_01" />
            <p className="form-hint">
              Stored on-chain and public — do not include private data.
            </p>
          </div>

          {hasValidAmount && (
            <div className="create-summary-box">
              <div className="create-summary-row">
                <span>Amount to lock</span>
                <strong>{numAmount.toFixed(2)} {tokenSym}</strong>
              </div>
              {feePct > 0 && (
                <div className="create-summary-row">
                  <span>Provider fee ({feePct}%)</span>
                  <strong>-{feeAmount.toFixed(2)} {tokenSym}</strong>
                </div>
              )}
              <div className="create-summary-row is-net">
                <span>Provider receives (on standard release)</span>
                <strong>{providerReceives.toFixed(2)} {tokenSym}</strong>
              </div>
              <div className="create-summary-note">
                {feePct === 0
                  ? '0% fee for the client and the provider (demo)'
                  : `0% fee for the client. In case of a dispute, the ${feePct}% fee applies to the share awarded to the provider.`}
              </div>
            </div>
          )}

          <div className="create-stepper" aria-label="Transaction steps">
            <div className={`create-step ${step1Done ? 'is-done' : step1Active ? 'is-active' : ''}`}>
              <span className="create-step-badge" aria-hidden="true">
                {step1Done ? '✓' : '1'}
              </span>
              <span>
                1. Approve {tokenSym} (no funds leave your wallet yet)
                {step1Done ? ' — Approved' : ''}
              </span>
            </div>
            <div className={`create-step ${step2Active ? 'is-active' : ''}`}>
              <span className="create-step-badge" aria-hidden="true">2</span>
              <span>2. Lock funds in escrow</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-app-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-app-primary" disabled={loading}>
              {loading
                ? (step === 2 ? `1/2 Approving ${tokenSym}...` : '2/2 Locking funds...')
                : (step1Done ? 'Lock funds in escrow' : `Approve & Lock ${tokenSym}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

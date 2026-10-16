'use client';

import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { useToast } from '../context/ToastContext';
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

  const [shareableLink, setShareableLink] = useState(null);

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
      if (!reason.includes("user rejected") && !reason.includes("User denied")) {
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

  if (shareableLink) {
    return (
      <div className="modal-overlay">
        <div className="modal-content glass-panel" style={{ borderTop: `4px solid ${niche.theme.primary}`}}>
          <h2>Success! 🎉</h2>
          <p className="text-gray-400 my-4 text-center">Your escrow has been created and funded. Send this link to the {niche.lexicon.provider.toLowerCase()} so they can easily accept the deal.</p>
          <div className="bg-black/50 border border-gray-700 p-3 rounded text-sm text-white mb-6 break-all">
            {shareableLink}
          </div>
          <button className="btn btn-primary w-full" onClick={copyLinkAndClose} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
            Copy Link & Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ borderTop: `4px solid ${niche.theme.primary}`}}>
        <h2>Create {niche.lexicon.escrow}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{niche.lexicon.provider} Address:</label>
            <input type="text" value={providerAddr} onChange={e=>setProviderAddr(e.target.value)} required placeholder="0x..." />
          </div>
          <div className="flex gap-4">
            <div className="form-group flex-1">
              <label>Amount ({tokenSym}):</label>
              {tokenChoices.length > 1 && (
                <select value={tokenSym} onChange={e=>setTokenSym(e.target.value)} aria-label="Token" style={{ marginBottom: '8px', width: '100%' }}>
                  {tokenChoices.map(t => <option key={t} value={t}>{t} (BEP-20)</option>)}
                </select>
              )}
              <input type="number" step="0.01" min={niche.minAmount} max={niche.maxAmount} value={amount} onChange={e=>setAmount(e.target.value)} required placeholder={niche.isDemo ? '1.00' : '100.00'} />
              {niche.isDemo && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>Demo: {niche.minAmount} to {niche.maxAmount} {tokenSym}, 0% fee.</p>
              )}
            </div>
            <div className="form-group flex-1">
              <label>Delivery Deadline (Days):</label>
              <input type="number" min="3" max="365" step="1" value={timeoutDays} onChange={e=>setTimeoutDays(e.target.value)} required title="Minimum 3 days as per smart contract rules" />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.2' }}>
                *Min. 3 days enforced by the smart contract to guarantee a fair dispute window and prevent abuse.
              </p>
            </div>
          </div>
          <div className="form-group">
            <label>Reference (optional):</label>
            <input type="text" value={reference} onChange={e=>setReference(e.target.value)} maxLength={REF_MAX_LENGTH} placeholder="e.g. Escrow_Joob_BscNews_20261014" />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.2' }}>
              Saved on-chain with the transaction to track this deal. Public and permanent: no personal data.
            </p>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
              {loading ? (step === 2 ? `Approving ${tokenSym}...` : 'Creating Escrow...') : 'Create & Fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

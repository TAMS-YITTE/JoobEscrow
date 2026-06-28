'use client';

import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { useToast } from '../context/ToastContext';
import { ethers } from 'ethers';
import { ESCROW_ABI, USDT_ADDRESS, ERC20_ABI } from '../config/contract';
import './CreateEscrowModal.css';

export default function CreateEscrowModal({ onClose, onSuccess, prefilledProvider = '', prefilledAmount = '' }) {
  const { account, signer, ensureCorrectChain, readProvider } = useWeb3();
  const niche = useNiche();
  const { showToast } = useToast();
  const [providerAddr, setProviderAddr] = useState(prefilledProvider);
  const [amount, setAmount] = useState(prefilledAmount);
  const [timeoutDays, setTimeoutDays] = useState(3);
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

    setLoading(true);
    try {
      await ensureCorrectChain();

      const usdtRead = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, readProvider || signer);
      let decimals = 18;
      try {
        decimals = Number(await usdtRead.decimals());
      } catch (err) {
        console.warn("Could not read decimals, defaulting to 18", err);
      }
      
      const parsedAmount = ethers.parseUnits(amount.toString(), decimals);
      
      const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      const currentAllowance = await usdt.allowance(account, niche.contractAddress);
      
      if (currentAllowance < parsedAmount) {
        setStep(2);
        const approveTx = await usdt.approve(niche.contractAddress, parsedAmount);
        await approveTx.wait();
      }

      setStep(3);
      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, signer);
      const tx = await contract.createAndFundEscrow(providerAddr, USDT_ADDRESS, parsedAmount, parseInt(timeoutDays) || 7);
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
        const link = `${window.location.origin}/${niche.id}?escrow=${newEscrowId}`;
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
              <label>Amount (USDT):</label>
              <input type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required placeholder="100.00" />
            </div>
            <div className="form-group flex-1">
              <label>Delivery Deadline (Days):</label>
              <input type="number" min="3" max="365" step="1" value={timeoutDays} onChange={e=>setTimeoutDays(e.target.value)} required title="Minimum 3 days as per smart contract rules" />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.2' }}>
                *Min. 3 days enforced by the smart contract to guarantee a fair dispute window and prevent abuse.
              </p>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
              {loading ? (step === 2 ? 'Approving USDT...' : 'Creating Escrow...') : 'Create & Fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

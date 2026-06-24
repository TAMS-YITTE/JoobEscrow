'use client';

import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { ethers } from 'ethers';
import { ESCROW_ABI, USDT_ADDRESS, ERC20_ABI } from '../config/contract';
import './CreateEscrowModal.css';

export default function CreateEscrowModal({ onClose, onSuccess, prefilledProvider = '', prefilledAmount = '' }) {
  const { account, signer } = useWeb3();
  const niche = useNiche();
  const [providerAddr, setProviderAddr] = useState(prefilledProvider);
  const [amount, setAmount] = useState(prefilledAmount);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: input, 2: approve, 3: create

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!niche.contractAddress || !signer) return;
    setLoading(true);
    try {
      const parsedAmount = ethers.parseEther(amount);
      
      const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      const approveTx = await usdt.approve(niche.contractAddress, parsedAmount);
      await approveTx.wait();

      const contract = new ethers.Contract(niche.contractAddress, ESCROW_ABI, signer);
      const tx = await contract.createAndFundEscrow(providerAddr, USDT_ADDRESS, parsedAmount, 7);
      await tx.wait();
      
      alert("Escrow created successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error creating escrow");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ borderTop: `4px solid ${niche.theme.primary}`}}>
        <h2>Create {niche.lexicon.escrow}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{niche.lexicon.provider} Address:</label>
            <input type="text" value={providerAddr} onChange={e=>setProviderAddr(e.target.value)} required placeholder="0x..." />
          </div>
          <div className="form-group">
            <label>Amount (USDT):</label>
            <input type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required placeholder="100.00" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{backgroundColor: niche.theme.primary, borderColor: niche.theme.primary}}>
              {loading ? 'Creating...' : 'Create & Fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

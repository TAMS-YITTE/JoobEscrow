import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { ESCROW_ABI } from '../config/contract';

export function useEscrowContract() {
  const { signer } = useWeb3();
  const niche = useNiche();

  const contract = useMemo(() => {
    if (!signer || !niche?.contractAddress) return null;
    return new ethers.Contract(niche.contractAddress, ESCROW_ABI, signer);
  }, [signer, niche?.contractAddress]);

  return contract;
}

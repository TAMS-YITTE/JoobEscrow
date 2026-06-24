import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { ESCROW_ABI } from '../config/contract';

export function useEscrowContract() {
  const { signer } = useWeb3();
  const niche = useNiche();
  const contractAddress = niche?.contractAddress;

  const contract = useMemo(() => {
    if (!signer || !contractAddress) return null;
    return new ethers.Contract(contractAddress, ESCROW_ABI, signer);
  }, [signer, contractAddress]);

  return contract;
}

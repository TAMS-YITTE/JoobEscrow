'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [isTestnet, setIsTestnet] = useState(false);

  const readProvider = useMemo(() => 
    new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/')
  , []);

  const ensureCorrectChain = async () => {
    const expectedChainId = process.env.NEXT_PUBLIC_CHAIN_ID || '97';
    const currentChainId = (await new ethers.BrowserProvider(window.ethereum).getNetwork()).chainId.toString();
    
    if (currentChainId !== expectedChainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.toBeHex(BigInt(expectedChainId)) }],
        });
        return true;
      } catch (switchError) {
        if (switchError.code === 4902) {
          const chainParams = expectedChainId === '56' ? {
            chainId: '0x38',
            chainName: 'BNB Smart Chain',
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            blockExplorerUrls: ['https://bscscan.com']
          } : {
            chainId: '0x61',
            chainName: 'BNB Smart Chain Testnet',
            rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
            nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
            blockExplorerUrls: ['https://testnet.bscscan.com']
          };

          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [chainParams],
            });
            return true;
          } catch (addError) {
            if (addError.code === 4001) {
              throw new Error("You rejected adding the required network to your wallet.");
            }
            throw new Error("Failed to add the correct BSC chain to your wallet.");
          }
        }
        throw new Error("You must switch to the correct network to proceed.");
      }
    }
    return true;
  };

  const connectWallet = async () => {
    setError(null);
    if (typeof window.ethereum !== 'undefined') {
      try {
        const tempProvider = new ethers.BrowserProvider(window.ethereum);
        
        const network = await tempProvider.getNetwork();
        setIsTestnet(network.chainId.toString() === '97');

        const accounts = await tempProvider.send("eth_requestAccounts", []);
        const acc = accounts[0];
        
        const tempSigner = await tempProvider.getSigner();
        
        setProvider(tempProvider);
        setSigner(tempSigner);
        setAccount(acc);
        
        const bal = await tempProvider.getBalance(acc);
        setBalance(ethers.formatEther(bal));

        // Listen for account changes
        window.ethereum.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length > 0) {
            setAccount(newAccounts[0]);
            window.location.reload();
          } else {
            setAccount(null);
            setSigner(null);
          }
        });

        // Listen for network changes
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });

      } catch (err) {
        if (err.code === 4001) {
          setError("Connection rejected by user.");
        } else {
          setError("Connection error: " + (err.message || "Unknown error"));
        }
        console.error("Web3 Connection error:", err);
      }
    } else {
      setError("Please install MetaMask or a compatible Web3 wallet.");
    }
  };

  return (
    <Web3Context.Provider value={{ account, provider, signer, readProvider, balance, error, isTestnet, connectWallet, ensureCorrectChain }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}

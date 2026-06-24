'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const tempProvider = new ethers.BrowserProvider(window.ethereum);
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
            window.location.reload(); // simple way to reset state
          } else {
            setAccount(null);
            setSigner(null);
          }
        });

      } catch (error) {
        console.error("Connection error:", error);
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet.");
    }
  };

  return (
    <Web3Context.Provider value={{ account, provider, signer, balance, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}

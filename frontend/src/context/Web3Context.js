'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { createAppKit, useAppKit, useAppKitProvider, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { bsc, bscTestnet, hardhat } from '@reown/appkit/networks';

const projectId = 'f7c5b567dc730d97b126ba84ddc76278';

const networks = [bsc, bscTestnet, hardhat];

const metadata = {
  name: 'JoobEscrow',
  description: 'The universal non-custodial escrow platform',
  url: 'https://joobescrow.com', 
  icons: ['https://joobescrow.com/logo.png']
};

const ethersAdapter = new EthersAdapter();

createAppKit({
  adapters: [ethersAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true
  }
});

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [isTestnet, setIsTestnet] = useState(false);

  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const { chainId } = useAppKitNetwork();
  const { open } = useAppKit();

  const readProvider = useMemo(() => 
    new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org/')
  , []);

  useEffect(() => {
    async function syncConnection() {
      if (isConnected && walletProvider) {
        try {
          const ethersProvider = new ethers.BrowserProvider(walletProvider, 'any');
          setProvider(ethersProvider);
          const tempSigner = await ethersProvider.getSigner();
          setSigner(tempSigner);
          setAccount(address);
          
          if (chainId) {
            setIsTestnet(chainId === 97);
          }

          const bal = await ethersProvider.getBalance(address);
          setBalance(ethers.formatEther(bal));
          setError(null);
        } catch (err) {
          console.error("Error setting up provider from Reown:", err);
          setError("Failed to setup provider from Reown.");
        }
      } else {
        setProvider(null);
        setSigner(null);
        setAccount(null);
        setBalance(null);
      }
    }
    syncConnection();
  }, [isConnected, walletProvider, address, chainId]);

  const ensureCorrectChain = async () => {
    // Reown AppKit handles network selection. We simply return true here so existing
    // logic in the app doesn't break. If needed, users switch via the AppKit modal.
    return true;
  };

  const connectWallet = async () => {
    try {
      await open();
    } catch (err) {
      console.error("Failed to open Reown AppKit:", err);
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

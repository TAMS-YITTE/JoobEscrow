'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { createAppKit, useAppKit, useAppKitProvider, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { bsc, bscTestnet, hardhat, mainnet, arbitrum, base, polygon, optimism, avalanche } from '@reown/appkit/networks';

// Projet Reown dedie a JoobEscrow (cloud.reown.com, equipe JoobEscrow). ID public par nature.
const projectId = '63a257b332dae1f848b7dab85c8f0880';

// BSC par defaut ; les autres reseaux EVM servent au paiement de la presale depuis
// une autre chaine (LI.FI) : le wallet doit pouvoir y basculer, WalletConnect compris.
const networks = [bsc, mainnet, arbitrum, base, polygon, optimism, avalanche, bscTestnet, hardhat];

// RPC de lecture BSC, par ordre de priorite (le principal peut etre remplace via NEXT_PUBLIC_BSC_RPC_URL).
const READ_RPC_URLS = [
  process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bnb-mainnet.g.alchemy.com/v2/mxiTTJDhhn7xwK4cXUdE2',
  'https://bsc-rpc.publicnode.com',
  'https://bsc-dataseed.bnbchain.org',
];

const metadata = {
  name: 'JoobEscrow',
  description: 'The universal non-custodial escrow platform',
  url: 'https://www.joobescrow.com',
  icons: ['https://www.joobescrow.com/logo.png']
};

const ethersAdapter = new EthersAdapter();

createAppKit({
  adapters: [ethersAdapter],
  networks,
  defaultNetwork: bsc,
  projectId,
  metadata,
  features: {
    analytics: true,
    // Wallets uniquement : pas de wallet heberge cree par email ou reseau social.
    email: false,
    socials: false,
    // Pas d'achat par carte ni de swap/envoi/reception dans la modale du wallet.
    onramp: false,
    swaps: false,
    send: false,
    receive: false
  }
});

const Web3Context = createContext();

// Reseau de nos contrats (escrow, presale) : BNB Smart Chain.
const BSC_CHAIN_ID = 56;
const BSC_CHAIN_ID_HEX = '0x38';

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

  // Lecture blockchain : RPC principal puis relais publics si une requete echoue ou traine (> 1,5 s),
  // pour que le site reste lisible en cas d'afflux (limite de debit partagee par tous les visiteurs).
  const readProvider = useMemo(() => {
    const network = ethers.Network.from(56);
    return new ethers.FallbackProvider(
      READ_RPC_URLS.map((url, i) => ({
        provider: new ethers.JsonRpcProvider(url, network, { staticNetwork: network, batchMaxCount: 1 }),
        priority: i + 1,
        stallTimeout: 1500,
        weight: 1,
      })),
      network,
      { quorum: 1 },
    );
  }, []);

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

  // Avant toute ecriture sur l'escrow ou la presale : le wallet doit etre sur BNB Smart Chain.
  // Depuis l'ajout des reseaux LI.FI, un wallet reste souvent sur Arbitrum/Base apres un achat
  // cross-chain ; une transaction partirait alors sur ce reseau, ou nos contrats n'existent pas.
  const ensureCorrectChain = async () => {
    if (!walletProvider) throw new Error('Connect your wallet first.');
    const current = parseInt(await walletProvider.request({ method: 'eth_chainId' }), 16);
    if (current === BSC_CHAIN_ID) return true;
    try {
      await walletProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_CHAIN_ID_HEX }] });
    } catch (err) {
      console.error('Network switch failed:', err);
    }
    const after = parseInt(await walletProvider.request({ method: 'eth_chainId' }), 16);
    if (after !== BSC_CHAIN_ID) throw new Error('Please switch your wallet to BNB Smart Chain, then try again.');
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
    <Web3Context.Provider value={{ account, provider, signer, readProvider, balance, error, isTestnet, connectWallet, ensureCorrectChain, chainId: chainId ? Number(String(chainId).split(':').pop()) : null }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}

'use client';

import { useWeb3 } from '../context/Web3Context';
import './WalletConnect.css';

export default function WalletConnect() {
  const { account, balance, connectWallet } = useWeb3();

  const formatAddress = (addr) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="wallet-container">
      {account ? (
        <div className="wallet-info glass-panel">
          <div className="wallet-balance">
            {balance ? Number(balance).toFixed(4) : '0.0000'} ETH
          </div>
          <div className="wallet-address">
            {formatAddress(account)}
          </div>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}

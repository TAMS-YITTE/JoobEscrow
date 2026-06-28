import { ethers } from 'ethers';

const ESCROW_ABI = [
  "function escrowCounter() view returns (uint256)",
  "function getEscrowDetails(uint256) view returns (uint256 id, address client, address provider, address token, uint256 amount, uint256 feeBPS, uint8 status, bool accepted, uint256 createdAt, uint256 timeoutDate, uint256 disputeOpenedAt)",
  "function withdrawable(address user, address token) view returns (uint256)",
  "function owner() view returns (address)",
  "function feeRecipient() view returns (address)"
];

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const CONTRACT_ADDRESS = "0xa45f887b938a08B295A5b96b6559600632F09Ab0"; // 8%

async function main() {
  const provider = new ethers.JsonRpcProvider("https://binance.llamarpc.com"); // alternative RPC

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ESCROW_ABI, provider);
  const count = await contract.escrowCounter();
  console.log("Total Escrows on 8% contract:", count);

  for (let i = 1; i <= count; i++) {
    const e = await contract.getEscrowDetails(i);
    console.log(`Escrow #${i} | Status: ${e.status} | Amount: ${ethers.formatEther(e.amount)}`);
    if (e.status === 4n) { // RESOLVED
      const c = await contract.withdrawable(e.client, USDT_ADDRESS);
      const p = await contract.withdrawable(e.provider, USDT_ADDRESS);
      console.log(` -> RESOLVED! Client withdrawable: ${ethers.formatEther(c)} USDT, Provider withdrawable: ${ethers.formatEther(p)} USDT`);
      
      const feeRecipient = await contract.feeRecipient();
      const f = await contract.withdrawable(feeRecipient, USDT_ADDRESS);
      console.log(` -> Platform fees withdrawable: ${ethers.formatEther(f)} USDT`);
    }
  }
}

main().catch(console.error);

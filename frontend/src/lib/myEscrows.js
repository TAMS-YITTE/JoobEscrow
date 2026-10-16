// Escrows du wallet connecte sur un contrat, au format attendu par EscrowCard.
import { ethers } from 'ethers';
import { ESCROW_ABI } from '../config/contract';

const STATUS = ['FUNDED', 'RELEASED', 'DISPUTED', 'RESOLVED', 'CANCELLED'];

export async function loadMyEscrows(contractAddress, reader, account) {
  const contract = new ethers.Contract(contractAddress, ESCROW_ABI, reader);
  const count = Number(await contract.escrowCounter());
  const staleDisputeTimeout = Number(await contract.staleDisputeTimeout());
  const me = account.toLowerCase();
  const now = Date.now() / 1000;
  const found = [];
  for (let i = 1; i <= count; i++) {
    const e = await contract.getEscrowDetails(i);
    const isClient = e.client.toLowerCase() === me;
    const isProvider = e.provider.toLowerCase() === me;
    if (!isClient && !isProvider) continue;
    const statusEnum = Number(e.status);
    const accepted = Boolean(e.accepted);
    const timeoutDate = Number(e.timeoutDate);
    let actionRequired = null;
    if (statusEnum === 1) {
      if (!accepted && isProvider) actionRequired = 'Action Required: Accept Job';
      else if (accepted && isClient) actionRequired = 'Action Required: Release or Dispute';
      else if (accepted && isProvider && timeoutDate > 0 && now > timeoutDate) actionRequired = 'Action Required: Claim Timeout';
    }
    found.push({
      id: i.toString(),
      client: e.client,
      provider: e.provider,
      amount: ethers.formatEther(e.amount),
      status: STATUS[statusEnum - 1] || 'UNKNOWN',
      tokenSymbol: e.sym || 'USDT',
      actionRequired,
      role: isClient ? 'client' : 'provider',
      createdAt: Number(e.createdAt),
      timeoutDate,
      accepted,
      disputeOpenedAt: statusEnum === 3 ? Number(await contract.disputeOpenedAt(i)) : 0,
      staleDisputeTimeout,
    });
  }
  return found;
}

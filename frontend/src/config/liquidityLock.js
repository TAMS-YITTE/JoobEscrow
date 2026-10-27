// Lock de bonne foi pour la liquidite de lancement PancakeSwap (PinkLock V2, BNB Chain).
// Source unique : ajouter ici chaque nouveau lock (id PinkLock + montant), verifie on-chain
// (normalLocksForUser(Safe) sur le contrat PinkLock). Owner = Safe, meme date de deblocage pour tous.
import { PRESALE_ADDRESSES } from './presale';

export const LIQUIDITY_LOCK = {
  locker: '0x407993575c91ce7643a4d4cCACc9A98c36eE1BBE',
  owner: PRESALE_ADDRESSES.SAFE,
  token: 'USDT',
  // Deblocage on-chain : 13/01/2027 15:00:00 UTC (1799852400), une heure apres la cloture de la presale.
  unlockLabel: 'January 13, 2027',
  locks: [
    { id: 2085939, amount: 50 },
    { id: 2085950, amount: 51 },
    { id: 2085954, amount: 49 },
    { id: 2088197, amount: 638.314 },
    { id: 2088213, amount: 218.1 },
  ],
};

export const lockUrl = (id) => `https://www.pinksale.finance/pinklock/bsc/record/${id}`;

export const lockedTotal = () => LIQUIDITY_LOCK.locks.reduce((sum, l) => sum + l.amount, 0);

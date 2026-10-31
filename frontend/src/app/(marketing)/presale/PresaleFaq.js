'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './presale.module.css';

// Questions de levee d'objection seulement ; le detail est sur /tokenomics, /presale-terms et /risks.
const FAQS = [
  {
    q: 'How is the price set?',
    a: 'By the smart contract, from a public schedule: it started at $0.001 and rises by $0.0002 every 2 days. You pay the price at the moment your transaction executes.',
  },
  {
    q: 'When can I claim my tokens?',
    a: 'When the sale ends, 20% of your allocation becomes claimable on this page. The remaining 80% unlocks linearly over 180 days, and claims cannot be paused.',
  },
  {
    q: 'Is the presale safe?',
    a: 'The token and presale contracts are verified on BscScan and audited by SpyWolf, with no critical, high or medium issue. The full cap was locked in the contract before the sale opened, so every allocation is covered. An audit reduces risk but does not remove it.',
  },
  {
    q: 'What can I pay with?',
    a: 'USDT or USDC on BNB Smart Chain go straight to the contract. Other tokens (BNB, ETH, POL, AVAX, ARB, OP) from 7 EVM networks are converted by LI.FI, with fees shown before you confirm.',
  },
  {
    q: 'Will JOOB be tradable after the sale?',
    a: 'A JOOB/USDT pool on PancakeSwap is planned right after the sale, opened above every presale price. After that the market sets the price, which may be lower than what you paid: only contribute what you can afford to lose.',
  },
  {
    q: 'Who can participate?',
    a: 'Adults who are not residents of a restricted jurisdiction listed in the Presale Terms. There is no refund once you buy.',
  },
];

export default function PresaleFaq() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className={styles.faqWrap}>
      {FAQS.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={item.q}
            className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
            onClick={() => setOpenIdx(isOpen ? -1 : idx)}
          >
            <div className={styles.faqQuestion}>
              <span>{item.q}</span>
              <span className={styles.faqChevron} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▾
              </span>
            </div>
            {isOpen && <p className={styles.faqAnswer}>{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

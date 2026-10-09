'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './presale.module.css';

const FAQS = [
  {
    q: 'What is JOOB?',
    a: 'JOOB is the BEP-20 token of the JoobEscrow ecosystem on BNB Smart Chain (fixed supply of 1,000,000,000). It is designed to be the key to the protocol: governance (JOOB holders vote on protocol decisions such as new categories, fee tiers and ecosystem grants), fee reductions for holders who stake JOOB, by tier, up to a full fee waiver at the highest tier (with Escrow V5), JOOB staking (contract already deployed and audited by SpyWolf, opening after the TGE: stake JOOB, earn JOOB rewards, 7-day withdrawal delay, no guaranteed yield), 0% fees on PerShare (our audited collective-pool app) for holders above a threshold from the TGE, plus boosts and badges, affiliate rewards in JOOB and Early Escrow points. These features ship progressively and are not guaranteed by a given date. JOOB gives no ownership, profit or revenue right in JoobEscrow, and using JoobEscrow escrows never requires JOOB.',
  },
  {
    q: 'How is the price set during the presale?',
    a: 'The price is computed by the smart contract from a public schedule: it starts at $0.001 and increases by $0.0002 every 2 days. The price applied is the one at the moment your transaction is executed. If a price step happens between your confirmation and the execution, the transaction is cancelled and nothing is charged.',
  },
  {
    q: 'When can I claim my tokens?',
    a: 'Nothing is claimable before the sale ends. When it ends, 20% of your allocation (purchases and bonuses) becomes claimable, and the remaining 80% unlocks linearly, second by second, over 180 days. You claim from this page at any time; claims cannot be paused.',
  },
  {
    q: 'What is the "sealed vault"?',
    a: 'The contract cannot open the sale until the full 163.5M JOOB cap has been deposited in it. You can check the deposited amount on BscScan (depositedTokens). Each purchase is checked against the tokens still available in the contract, so buyer allocations are covered by tokens it already holds.',
  },
  {
    q: 'Are the contracts audited?',
    a: 'Yes. The JOOB token and the presale contract were audited by SpyWolf: no critical, high or medium issue, and every reported finding was fixed or acknowledged. Reports: spywolf.co/audits/StandardToken_Audit_JoobEscrow.pdf and spywolf.co/audits/VestingPresale_Airdrop_Audit_JoobEscrow.pdf. An audit reduces technical risk but does not remove it.',
  },
  {
    q: 'How do the volume bonus and referral work?',
    a: 'The volume bonus depends on your cumulative USDT + USDC contribution: 2% from $100, 3.5% from $250, 5% from $500 and 7% from $1,000, applied to all the tokens you bought (earlier purchases are topped up automatically). A referrer receives 2% of the tokens bought through their link. Bonuses follow the same vesting and count toward the cap.',
  },
  {
    q: 'What happens to unsold tokens and to the funds raised?',
    a: 'After the sale, unsold tokens are returned to the JoobEscrow Safe multisig and burned on-chain. The stablecoins raised are withdrawn by the same multisig. There is no soft cap and no refund.',
  },
  {
    q: 'Will JOOB be tradable after the sale?',
    a: 'A JOOB/USDT pool on PancakeSwap is planned right after the sale ends, opened by the JoobEscrow Safe at an initial price of $0.02 (50 JOOB per USDT), above every presale price. Once trading starts, the price is set by the market alone: it is not guaranteed and may be lower than the price you paid. Only contribute what you can afford to lose.',
  },
  {
    q: 'Who can participate?',
    a: 'Only adults who are not residents of a restricted jurisdiction listed in the Presale Terms. You are responsible for checking that participation is legal where you live.',
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

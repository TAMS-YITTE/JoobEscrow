'use client';

import { useState } from 'react';
import styles from './HomeFaq.module.css';

const FAQS = [
  {
    q: 'Is my money safe? Can JoobEscrow access it?',
    a: 'Your funds are locked in an audited non-custodial smart contract. We never have direct access to your tokens. The contract ensures that funds can only be released to the provider upon your approval, or refunded if canceled.',
  },
  {
    q: 'Who resolves disputes?',
    a: 'If a disagreement occurs, either party can open a dispute and submit proof. The JoobEscrow arbitration team reviews it and splits the funds between both parties (any split from 0% to 100%). If a dispute is abandoned for 30 days, either party can trigger an automatic 50/50 split in the contract so funds are never stuck forever.',
  },
  {
    q: 'What fees do I pay for an escrow?',
    a: 'Clients always pay 0% fees. Service providers pay between 2% and 10% depending on the niche and tier, deducted only upon successful release of funds. There are no hidden setup costs.',
  },
  {
    q: 'Are communications with the provider secure?',
    a: 'Yes. The in-app chat uses the XMTP protocol: end-to-end encrypted messaging from wallet to wallet. Messages travel encrypted over the XMTP network (not stored on JoobEscrow servers) and only the two counterparties can read them.',
  },
];

export default function HomeFaq() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {FAQS.map((f, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={f.q}
              className={`glass-panel ${styles.item} ${isOpen ? styles.itemOpen : ''}`}
              onClick={() => setOpenIdx(isOpen ? -1 : idx)}
            >
              <div className={styles.question}>
                <span>{f.q}</span>
                <span className={styles.toggleIcon}>{isOpen ? '−' : '+'}</span>
              </div>
              {isOpen && <p className={styles.answer}>{f.a}</p>}
            </div>
          );
        })}
      </div>

      <div className={`glass-panel ${styles.helpCard}`}>
        <h3 className={styles.helpTitle}>Need Direct Support?</h3>
        <p className={styles.helpDesc}>
          Our team is available on official communication channels.
        </p>
        <a href="mailto:contact@joobescrow.com" className="btn btn-outline" style={{ width: '100%', marginBottom: '12px' }}>
          contact@joobescrow.com
        </a>
        <a href="https://t.me/JoobEscrow_Official" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%' }}>
          Join Telegram Support →
        </a>
      </div>
    </div>
  );
}

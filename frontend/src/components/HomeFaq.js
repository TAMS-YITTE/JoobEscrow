'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HOME_FAQ } from '../config/faq';
import { TELEGRAM_URL } from '../config/links';
import styles from './HomeFaq.module.css';

export default function HomeFaq() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {HOME_FAQ.map((f, idx) => {
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
              {isOpen && (
                <p className={styles.answer}>
                  {f.summary}{' '}
                  <Link href={`/faq#${f.id}`} onClick={(e) => e.stopPropagation()} className="text-gradient font-bold hover:underline">Full answer →</Link>
                </p>
              )}
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
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%' }}>
          Join Telegram Support →
        </a>
      </div>
    </div>
  );
}

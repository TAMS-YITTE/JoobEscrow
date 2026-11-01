'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import styles from './airdrop.module.css';

const fmt = (n) => n.toLocaleString('en-US');
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

// Liste figee d'une campagne (config/airdrop/*.json) : recherche par adresse (pas de connexion wallet), tableau public.
export default function AirdropClient({ campaign }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);

  const byAddress = Object.fromEntries(campaign.entries.map((e) => [e.address, e]));
  const total = campaign.entries.reduce((a, e) => a + e.joob, 0);

  const check = (e) => {
    e.preventDefault();
    const a = query.trim();
    setResult(ethers.isAddress(a.toLowerCase()) ? { address: a, entry: byAddress[a.toLowerCase()] ?? null } : { address: a, invalid: true });
  };

  return (
    <div className={styles.wrap}>
      <div className={`glass-panel ${styles.card}`}>
        <h2 className={styles.cardTitle}>{campaign.campaign}</h2>
        <p className={styles.sub}>
          {campaign.joobPerXp} JOOB per Zealy XP, {campaign.entries.length} wallets, {fmt(total)} JOOB in total. List frozen on November 1, 2026.
        </p>
        <div className={styles.stats}>
          <div><span>Wallets</span><b>{campaign.entries.length}</b></div>
          <div><span>Per XP</span><b>{campaign.joobPerXp} JOOB</b></div>
          <div><span>Total</span><b>{fmt(total)} JOOB</b></div>
        </div>
      </div>

      <div className={`glass-panel ${styles.card}`}>
        <h2 className={styles.cardTitle}>Search by address</h2>
        <form onSubmit={check} className={styles.form} style={{ marginTop: 0 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="0x… wallet address" aria-label="Wallet address" className={styles.input} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        {result && (
          <p className={result.entry ? styles.ok : styles.muted}>
            {result.invalid
              ? 'Invalid address.'
              : result.entry
                ? `On the list: ${fmt(result.entry.joob)} JOOB (${fmt(result.entry.xp)} XP, ${result.entry.username}).`
                : 'This address is not on the list.'}
          </p>
        )}
      </div>

      <div className={`glass-panel ${styles.card}`}>
        <h2 className={styles.cardTitle}>Full list</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>#</th><th>Zealy</th><th>Wallet</th><th>XP</th><th>JOOB</th></tr>
            </thead>
            <tbody>
              {campaign.entries.map((e, i) => (
                <tr key={e.address}>
                  <td>{i + 1}</td>
                  <td>{e.username}</td>
                  <td className={styles.mono}>{short(e.address)}</td>
                  <td>{fmt(e.xp)}</td>
                  <td className={styles.amount}>{fmt(e.joob)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

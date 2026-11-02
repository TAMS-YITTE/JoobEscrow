'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import styles from './airdrop.module.css';

const fmt = (n) => n.toLocaleString('en-US');
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const dateLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// Listes figees des campagnes (config/airdrop/*.json) : une recherche par adresse sur toutes les campagnes
// (pas de connexion wallet), puis une liste publique par campagne, la plus recente en premier.
export default function AirdropClient({ campaigns }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState(campaigns[0].id);

  const check = (e) => {
    e.preventDefault();
    const a = query.trim();
    if (!ethers.isAddress(a.toLowerCase())) { setResult({ invalid: true }); return; }
    const hits = campaigns
      .map((c) => ({ c, entry: c.entries.find((x) => x.address === a.toLowerCase()) }))
      .filter((h) => h.entry);
    setResult({ hits, total: hits.reduce((s, h) => s + h.entry.joob, 0) });
  };

  const current = campaigns.find((c) => c.id === tab) ?? campaigns[0];
  const total = current.entries.reduce((a, e) => a + e.joob, 0);

  return (
    <div className={styles.wrap}>
      <div className={`glass-panel ${styles.card}`}>
        <h2 className={styles.cardTitle}>Search by address</h2>
        <form onSubmit={check} className={styles.form} style={{ marginTop: 0 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="0x… wallet address" aria-label="Wallet address" className={styles.input} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        {result && (result.invalid ? (
          <p className={styles.muted}>Invalid address.</p>
        ) : result.hits.length ? (
          <div className={styles.ok}>
            {result.hits.map(({ c, entry }) => (
              <p key={c.id} style={{ margin: '4px 0' }}>
                {c.campaign}: {fmt(entry.joob)} JOOB{entry.metric !== undefined ? ` (${fmt(entry.metric)} ${c.metricHeader})` : ''}{entry.label ? `, ${entry.label}` : ''}
              </p>
            ))}
            {result.hits.length > 1 && <p style={{ margin: '8px 0 0' }}>Total: {fmt(result.total)} JOOB</p>}
          </div>
        ) : (
          <p className={styles.muted}>This address is not on any list.</p>
        ))}
      </div>

      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.tabs} role="tablist">
          {campaigns.map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={c.id === current.id} onClick={() => setTab(c.id)} className={`${styles.tab} ${c.id === current.id ? styles.tabActive : ''}`}>
              {c.campaign}
            </button>
          ))}
        </div>
        <p className={styles.sub}>{current.rule}</p>
        <div className={styles.stats}>
          <div><span>Wallets</span><b>{current.entries.length}</b></div>
          <div><span>Total</span><b>{fmt(total)} JOOB</b></div>
          <div><span>List frozen</span><b>{dateLabel(current.snapshot)}</b></div>
        </div>
        <p className={styles.sub} style={{ marginTop: 14 }}>{current.delivery}</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>{current.labelHeader}</th>
                <th>Wallet</th>
                {current.metricHeader && <th>{current.metricHeader}</th>}
                <th>JOOB</th>
              </tr>
            </thead>
            <tbody>
              {current.entries.map((e, i) => (
                <tr key={e.address}>
                  <td>{i + 1}</td>
                  <td>{e.label}</td>
                  <td className={styles.mono}>{short(e.address)}</td>
                  {current.metricHeader && <td>{fmt(e.metric)}</td>}
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

'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import styles from './airdrop.module.css';
import { firstProvider, fairShare, BROWSER_RPCS } from '../../../lib/presaleLogs';

const fmt = (n) => n.toLocaleString('en-US');
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const dateLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// Listes figees des campagnes (config/airdrop/*.json) : une recherche par adresse sur toutes les campagnes
// (pas de connexion wallet), puis une liste publique par campagne, la plus recente en premier.
export default function AirdropClient({ campaigns: frozen }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState(frozen[0].id);
  const [live, setLive] = useState(null);

  // Campagne en cours, calculee on-chain par /api/sales-bonus (cache serveur de 10 minutes).
  useEffect(() => {
    let alive = true;
    // Repli dans le navigateur si le serveur n'a pas pu lire la blockchain.
    fetch('/api/sales-bonus')
      .then((r) => r.json())
      .then(async (d) => (d.error && d.started ? fairShare(await firstProvider(BROWSER_RPCS)) : d))
      .then((d) => {
        if (!alive || !d.started) return;
        const startLabel = new Date(d.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
        setLive({
          id: 'fair-share',
          live: true,
          campaign: d.campaign,
          entries: d.entries || [],
          labelHeader: 'Bought',
          rule: `${d.joobPerUsd} bonus JOOB for every $1 bought, from $1, from ${startLabel} until $${d.capRaisedUsd / 1000}K raised.${d.capReached ? ' Target reached, the list is final.' : ''}`,
          delivery: 'From the Airdrop allocation, delivered at TGE with the presale vesting: 20% at the end of the sale, then linear over 180 days.',
        });
        setTab('fair-share');
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const campaigns = live ? [live, ...frozen] : frozen;

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
          <div><span>{current.live ? 'Status' : 'List frozen'}</span><b>{current.live ? 'Live, updated every 10 min' : dateLabel(current.snapshot)}</b></div>
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

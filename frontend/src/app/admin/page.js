'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useToast } from '../../context/ToastContext';
import { instances } from '../../config/instances';

// NOTE: This is a client-side gate. The password is visible in the shipped
// bundle, so it is NOT real security — it only hides the page from casual
// visitors. That is acceptable here because this page has NO write access and
// cannot route any funds: it only GENERATES links and a JSON snippet that you
// still have to paste + deploy yourself. Do NOT reuse a sensitive password.
// When you move to a real datastore (Vercel KV), replace this with server auth.
const ADMIN_PASSWORD = 'joob-admin-2026';

const SITE = 'https://www.joobescrow.com';

export default function AdminGeneratorPage() {
  const { showToast } = useToast();

  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState('');

  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [followers, setFollowers] = useState('');
  const [engagement, setEngagement] = useState('');
  const [niche, setNiche] = useState('influence');
  const [services, setServices] = useState([
    { name: '', price: '', delivery: '', desc: '' },
  ]);

  const nicheKeys = Object.keys(instances);

  const addService = () => setServices((s) => [...s, { name: '', price: '', delivery: '', desc: '' }]);
  const removeService = (i) => setServices((s) => s.filter((_, idx) => idx !== i));
  const updateService = (i, field, value) =>
    setServices((s) => s.map((srv, idx) => (idx === i ? { ...srv, [field]: value } : srv)));

  const cleanHandle = handle.trim().replace(/\s+/g, '');
  const addressValid = address ? ethers.isAddress(address) : false;

  const quickLink = cleanHandle ? `${SITE}/app?ref=${encodeURIComponent(cleanHandle)}` : '';
  const brandedLink = cleanHandle ? `${SITE}/${niche}/kol/${encodeURIComponent(cleanHandle)}` : '';

  const buildSnippet = () => {
    if (!cleanHandle) return '';
    const entry = {
      name: name || cleanHandle,
      address: address,
      followers: followers || 'N/A',
      engagement: engagement || 'N/A',
      verified: true,
      services: services
        .filter((s) => s.name.trim())
        .map((s, idx) => ({
          id: idx + 1,
          name: s.name,
          price: s.price,
          delivery: s.delivery,
          desc: s.desc,
        })),
    };
    // Produce a paste-ready inner block: "Handle": { ... }
    const full = JSON.stringify({ [cleanHandle]: entry }, null, 2);
    return full.split('\n').slice(1, -1).join('\n');
  };

  const snippet = buildSnippet();

  const copy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('success', `${label} copied!`);
  };

  // --- Password gate ---
  if (!authed) {
    return (
      <div style={{ maxWidth: '380px', margin: '15vh auto', padding: '0 20px' }}>
        <div className="glass-panel p-6" style={{ background: '#0d0f17', border: '1px solid #333' }}>
          <h1 className="text-xl font-bold mb-4 text-white">🔒 JoobEscrow Admin</h1>
          <p className="text-gray-400 text-sm mb-4">Enter the admin password to access the KOL link generator.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pwd === ADMIN_PASSWORD) setAuthed(true);
              else showToast('error', 'Wrong password');
            }}
          >
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Password"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#161922', border: '1px solid #333', color: '#fff', marginBottom: '12px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  const labelStyle = { display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' };
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#161922', border: '1px solid #333', color: '#fff', marginBottom: '14px' };
  const boxStyle = { background: '#0d0f17', border: '1px solid #333', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#e5e7eb', whiteSpace: 'pre-wrap', wordBreak: 'break-all' };

  return (
    <div style={{ maxWidth: '760px', margin: '40px auto', padding: '0 20px' }}>
      <h1 className="text-2xl font-bold mb-1 text-white">KOL Link Generator</h1>
      <p className="text-gray-500 text-sm mb-6">
        Fill in a partner's details → get their affiliate links and the JSON block to paste into
        <code style={{ color: '#93c5fd' }}> src/config/kols.json</code>.
      </p>

      <div className="glass-panel p-6 mb-6" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div>
            <label style={labelStyle}>Handle (no spaces) *</label>
            <input style={inputStyle} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="JohnWeb3" />
          </div>
          <div>
            <label style={labelStyle}>Display name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="John Web3 Official" />
          </div>
        </div>

        <label style={labelStyle}>Payout wallet — USDT (BSC) *</label>
        <input style={{ ...inputStyle, borderColor: address ? (addressValid ? '#22c55e' : '#ef4444') : '#333', marginBottom: address && !addressValid ? '4px' : '14px' }} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." />
        {address && !addressValid && <p style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '14px' }}>⚠️ This is not a valid wallet address.</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
          <div>
            <label style={labelStyle}>Followers</label>
            <input style={inputStyle} value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="45K" />
          </div>
          <div>
            <label style={labelStyle}>Engagement</label>
            <input style={inputStyle} value={engagement} onChange={(e) => setEngagement(e.target.value)} placeholder="4%" />
          </div>
          <div>
            <label style={labelStyle}>Niche (for branded URL)</label>
            <select style={inputStyle} value={niche} onChange={(e) => setNiche(e.target.value)}>
              {nicheKeys.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '4px' }}>
          <label style={labelStyle}>Services (optional)</label>
          {services.map((srv, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input style={{ ...inputStyle, marginBottom: 0 }} value={srv.name} onChange={(e) => updateService(i, 'name', e.target.value)} placeholder="Service name" />
              <input style={{ ...inputStyle, marginBottom: 0 }} value={srv.price} onChange={(e) => updateService(i, 'price', e.target.value)} placeholder="Price (USDT)" />
              <input style={{ ...inputStyle, marginBottom: 0 }} value={srv.delivery} onChange={(e) => updateService(i, 'delivery', e.target.value)} placeholder="48h" />
              <button className="btn btn-outline" style={{ padding: '6px 10px', color: '#f87171', borderColor: '#f87171' }} onClick={() => removeService(i)} title="Remove">✕</button>
              <input style={{ ...inputStyle, marginBottom: 0, gridColumn: '1 / -1' }} value={srv.desc} onChange={(e) => updateService(i, 'desc', e.target.value)} placeholder="Short description" />
            </div>
          ))}
          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={addService}>+ Add service</button>
        </div>
      </div>

      {/* Output */}
      {cleanHandle && (
        <div className="glass-panel p-6" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <h2 className="text-lg font-bold mb-4 text-white">Generated</h2>

          <label style={labelStyle}>⚡ Quick affiliate link (works instantly, no deploy)</label>
          <div style={boxStyle}>{quickLink}</div>
          <button className="btn btn-primary" style={{ margin: '8px 0 20px', padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => copy(quickLink, 'Quick link')}>Copy quick link</button>

          <label style={labelStyle}>🌟 Branded profile link (live after you deploy the JSON below)</label>
          <div style={boxStyle}>{brandedLink}</div>
          <button className="btn btn-primary" style={{ margin: '8px 0 20px', padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => copy(brandedLink, 'Branded link')}>Copy branded link</button>

          <label style={labelStyle}>📋 JSON block — paste inside the {'{ }'} of src/config/kols.json (add a comma if other entries exist)</label>
          <div style={boxStyle}>{snippet}</div>
          <button
            className="btn btn-primary"
            style={{ marginTop: '8px', padding: '6px 14px', fontSize: '0.85rem', opacity: addressValid ? 1 : 0.5 }}
            disabled={!addressValid}
            onClick={() => copy(snippet, 'JSON block')}
          >
            {addressValid ? 'Copy JSON block' : 'Enter a valid wallet first'}
          </button>
        </div>
      )}
    </div>
  );
}

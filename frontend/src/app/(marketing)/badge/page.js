'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '../../../context/ToastContext';

export default function BadgeGenerator() {
  const { showToast } = useToast();
  const [handle, setHandle] = useState('CryptoInfluence');
  const [niche, setNiche] = useState('influence');

  const snippet = `<a href="https://joobescrow.com/${niche}/kol/${handle}" target="_blank" rel="noopener noreferrer">
  <img src="https://joobescrow.com/badge.svg" alt="Protected by JoobEscrow" width="200" height="60" />
</a>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet);
    showToast('success', 'Snippet copied to clipboard!');
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Trust <span className="text-gradient">Badge</span></h1>
        <p className="text-gray-400">Embed your JoobEscrow verified reputation directly on your website or link-in-bio.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold text-white mb-4">1. Configure your badge</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Select Niche</label>
              <select 
                className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              >
                <option value="influence">Influencer Marketing</option>
                <option value="talent">Freelance & Talent</option>
                <option value="pro">Pro Services</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Your Handle / Wallet</label>
              <input 
                type="text" 
                className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. CryptoInfluence"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 to-black">
          <h3 className="text-sm text-gray-400 mb-6 uppercase tracking-widest">Preview</h3>
          
          {/* Badge Preview */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-3 hover:bg-white/10 transition cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase leading-tight tracking-wider">Protected by</span>
              <span className="text-white font-bold leading-tight">JoobEscrow</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">
            Clicking the badge will redirect clients to your public verified profile.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 mt-8">
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-xl font-bold text-white">2. Copy Snippet (HTML)</h3>
          <button onClick={copyToClipboard} className="text-sm text-blue-400 hover:text-blue-300">Copy to Clipboard</button>
        </div>
        <pre className="bg-black/60 p-4 rounded text-sm text-gray-300 overflow-x-auto border border-gray-800">
          {snippet}
        </pre>
      </div>

      <div className="mt-8 text-center">
        <Link href="/app" className="text-gray-400 hover:text-white underline">Back to App</Link>
      </div>
    </div>
  );
}

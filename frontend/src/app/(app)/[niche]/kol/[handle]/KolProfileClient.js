'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../../../context/Web3Context';
import { useToast } from '../../../../../context/ToastContext';
import { useEscrowContract } from '../../../../../hooks/useEscrowContract';
import WalletConnect from '../../../../../components/WalletConnect';
import CreateEscrowModal from '../../../../../components/CreateEscrowModal';
import kolsConfig from '../../../../../config/kols.json';
import './kol.css';

export default function KolProfileClient({ handle }) {
  const { readProvider } = useWeb3();
  const { showToast } = useToast();
  const contract = useEscrowContract();

  const kolData = kolsConfig[handle];

  if (!kolData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">Partner Not Found</h1>
        <p className="text-gray-400">The JoobEscrow partner "{handle}" does not exist or is not active yet.</p>
      </div>
    );
  }

  const kolProfile = {
    handle: handle,
    name: kolData.name,
    address: kolData.address,
    followers: kolData.followers || "N/A",
    engagement: kolData.engagement || "N/A",
    verified: kolData.verified ?? true,
    services: kolData.services || []
  };

  const [onChainStats, setOnChainStats] = useState({
    completed: 0,
    active: 0,
    disputes: 0,
    totalVolume: 0,
    loading: true
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    // Inject KOL handle into LocalStorage for Vercel Analytics Tracking
    if (handle) {
      localStorage.setItem('joob_ref', handle);
    }

    let isMounted = true;

    async function fetchReputation() {
      if (!contract || !readProvider) return;

      try {
        // Query all EscrowCreated events where provider = kolProfile.address
        const filter = contract.filters.EscrowCreated(null, null, kolProfile.address);
        const events = await contract.queryFilter(filter, -100000); // look back ~100k blocks

        let completed = 0;
        let active = 0;
        let disputes = 0;
        let volume = 0n;

        // Fetch details for each to get current status
        const detailsPromises = events.map(e => contract.getEscrowDetails(e.args[0]));
        const escrows = await Promise.allSettled(detailsPromises);

        for (const res of escrows) {
          if (res.status === 'fulfilled') {
            const e = res.value;
            // Status: 0=NULL, 1=FUNDED, 2=RELEASED, 3=DISPUTED, 4=RESOLVED, 5=CANCELLED
            const statusInt = typeof e.status === 'bigint' ? Number(e.status) : e.status;
            
            if (statusInt === 1) active++; // FUNDED
            if (statusInt === 2 || statusInt === 4) {
              completed++; // RELEASED or RESOLVED
              volume += e.amount;
            }
            if (statusInt === 3) disputes++; // DISPUTED
          }
        }

        if (isMounted) {
          setOnChainStats({
            completed,
            active,
            disputes,
            totalVolume: ethers.formatUnits(volume, 18),
            loading: false
          });
        }
      } catch (err) {
        console.error("Failed to fetch KOL reputation:", err);
        if (isMounted) setOnChainStats(s => ({ ...s, loading: false }));
      }
    }

    fetchReputation();
    return () => { isMounted = false; };
  }, [contract, readProvider, kolProfile.address]);

  const handleOrder = (service) => {
    setSelectedService(service);
    setShowModal(true);
  };

  return (
    <div className="kol-page">
      <header className="dashboard-header kol-header">
        <div className="brand-logo">
          <h2>Joob <span className="badge-kol">KOLs</span></h2>
        </div>
        <WalletConnect />
      </header>

      <div className="kol-profile-container">
        {/* Header Profile */}
        <div className="profile-card glass-panel">
          <div className="profile-top">
            <div className="avatar">
               <div className="avatar-circle">{kolProfile.name.substring(0,2).toUpperCase()}</div>
            </div>
            <div className="profile-info">
              <h1>{kolProfile.name} {kolProfile.verified && <span className="verified-icon">✅</span>}</h1>
              <p className="handle">@{kolProfile.handle}</p>
              <div className="wallet-badge">
                {kolProfile.address.substring(0, 6)}...{kolProfile.address.substring(38)}
              </div>
            </div>
          </div>
          
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-value">{kolProfile.followers}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{kolProfile.engagement}</span>
              <span className="stat-label">Engagement</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{onChainStats.loading ? '...' : onChainStats.completed}</span>
              <span className="stat-label">Success</span>
            </div>
          </div>
        </div>

        {/* Services & History */}
        <div className="kol-content-split">
          <div className="services-section">
            <h3>Services & Pricing</h3>
            <div className="services-list">
              {kolProfile.services.map(srv => (
                <div key={srv.id} className="service-card glass-panel">
                  <div className="service-header">
                    <h4>{srv.name}</h4>
                    <span className="service-price">{srv.price} USDT</span>
                  </div>
                  <p className="service-desc">{srv.desc}</p>
                  <p className="service-delivery">⏱ Delivery in {srv.delivery}</p>
                  <button className="btn btn-primary w-100" onClick={() => handleOrder(srv)}>
                    Order this service
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="history-section">
            <h3>On-Chain History</h3>
            <div className="glass-panel history-panel">
              <div className="history-item">
                <span>✅ Completed campaigns</span>
                <strong>{onChainStats.loading ? '...' : onChainStats.completed}</strong>
              </div>
              <div className="history-item">
                <span>⏳ In progress</span>
                <strong>{onChainStats.loading ? '...' : onChainStats.active}</strong>
              </div>
              <div className="history-item dispute">
                <span>❌ Disputes</span>
                <strong>{onChainStats.loading ? '...' : onChainStats.disputes}</strong>
              </div>
              <div className="history-item">
                <span>💰 Total Volume</span>
                <strong>{onChainStats.loading ? '...' : `$${Number(onChainStats.totalVolume).toLocaleString()}`}</strong>
              </div>
              <div className="trust-badge mt-4">
                🛡 Tracked securely on BscScan
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateEscrowModal 
          onClose={() => setShowModal(false)} 
          onSuccess={() => showToast('success', 'Escrow Funded! Redirecting to dashboard...')}
          prefilledProvider={kolProfile.address}
          prefilledAmount={selectedService?.price}
        />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import WalletConnect from '../../../../components/WalletConnect';
import CreateEscrowModal from '../../../../components/CreateEscrowModal';
import './kol.css';

export default function KolProfileClient({ handle }) {
  // Mock Data pour le MVP Front-End
  const kolProfile = {
    handle: handle,
    name: "Crypto Influence",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat Account #1
    followers: "52K",
    engagement: "3.2%",
    verified: true,
    completedCampaigns: 43,
    activeCampaigns: 2,
    disputes: 0,
    services: [
      { id: 1, name: "Tweet Simple", price: "800", delivery: "48h", desc: "1 tweet promotionnel avec vos hashtags et un lien." },
      { id: 2, name: "Thread Sponsorisé", price: "2500", delivery: "72h", desc: "Un thread détaillé de 5 tweets avec vos visuels." }
    ]
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

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
               {/* Placeholder avatar */}
               <div className="avatar-circle">CI</div>
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
              <span className="stat-value">{kolProfile.completedCampaigns}</span>
              <span className="stat-label">Success</span>
            </div>
          </div>
        </div>

        {/* Services & History */}
        <div className="kol-content-split">
          <div className="services-section">
            <h3>Services & Tarifs</h3>
            <div className="services-list">
              {kolProfile.services.map(srv => (
                <div key={srv.id} className="service-card glass-panel">
                  <div className="service-header">
                    <h4>{srv.name}</h4>
                    <span className="service-price">{srv.price} USDT</span>
                  </div>
                  <p className="service-desc">{srv.desc}</p>
                  <p className="service-delivery">⏱ Livraison sous {srv.delivery}</p>
                  <button className="btn btn-primary w-100" onClick={() => handleOrder(srv)}>
                    Commander ce service
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="history-section">
            <h3>Historique Public</h3>
            <div className="glass-panel history-panel">
              <div className="history-item">
                <span>✅ Campagnes complétées</span>
                <strong>{kolProfile.completedCampaigns}</strong>
              </div>
              <div className="history-item">
                <span>⏳ En cours</span>
                <strong>{kolProfile.activeCampaigns}</strong>
              </div>
              <div className="history-item dispute">
                <span>❌ Litiges</span>
                <strong>{kolProfile.disputes}</strong>
              </div>
              <div className="trust-badge">
                🛡 Audité par Joob | 100% Delivery
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateEscrowModal 
          onClose={() => setShowModal(false)} 
          onSuccess={() => alert('Escrow Funded! Redirecting to dashboard...')} 
          prefilledProvider={kolProfile.address}
          prefilledAmount={selectedService?.price}
        />
      )}
    </div>
  );
}

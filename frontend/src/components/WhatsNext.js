import './WhatsNext.css';

// Etapes reprises de la roadmap publique (presale/page.js et whitepaper) : aucune date.
export const COMING = [
  { icon: '🔔', title: 'Telegram deal alerts', text: 'Get notified when an escrow is funded, accepted, released or disputed.', status: 'Next' },
  { icon: '🔎', title: 'Public deal pages', text: 'Anyone can verify a deal from a link, without connecting a wallet.', status: 'Next' },
  { icon: '🌱', title: 'JOOB staking', text: 'Stake JOOB, earn JOOB. Contract already deployed and audited by SpyWolf, no guaranteed yield.', status: 'After TGE' },
  { icon: '💸', title: 'Lower fees with JOOB', text: 'Stake JOOB to pay lower fees, by tier, up to a full fee waiver at the highest tier (Escrow V5).', status: 'Planned' },
  { icon: '🏅', title: 'Verified reputation profiles', text: 'A verified public profile for providers to show their track record (Escrow V5).', status: 'Planned' },
  { icon: '🧩', title: 'Milestone payments', text: 'Pay a deal in stages, with partial releases and amicable settlement (Escrow V5.1).', status: 'Planned' },
  { icon: '✉️', title: 'Email sign-in, no seed phrase', text: 'Start with an email or social account, network fees covered, card payments.', status: 'Planned' },
  { icon: '🤝', title: 'Co-funded escrow', text: 'Several sponsors pool funds on PerShare and open one escrow, paid only on delivery.', status: 'Planned' },
  { icon: '🌐', title: 'Multichain, API & widget', text: 'More networks, an API and a "Pay me with JoobEscrow" widget for any site.', status: 'Planned' },
  { icon: '🗳️', title: 'JOOB governance', text: 'JOOB holders vote on new categories, fee tiers and ecosystem grants.', status: 'Planned' },
];

export default function WhatsNextWidget({ title = "What's coming" }) {
  return (
    <div className="coming-widget">
      <div className="coming-widget-head">
        <h3>{title} <span aria-hidden="true">›</span></h3>
        <span className="coming-widget-note">Public roadmap · no dates</span>
      </div>
      <ol className="coming-list">
        {COMING.map((c, i) => (
          <li key={c.title} className="coming-row" title={c.text}>
            <span className="coming-rank">{i + 1}</span>
            <span className="coming-icon" aria-hidden="true">{c.icon}</span>
            <span className="coming-main">
              <span className="coming-title">{c.title}</span>
              <span className="coming-text">{c.text}</span>
            </span>
            <span className={`coming-status ${c.status !== 'Planned' ? 'is-now' : ''}`}>
              {c.status !== 'Planned' ? '▲ ' : ''}{c.status}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

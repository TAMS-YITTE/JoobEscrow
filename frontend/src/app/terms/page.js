import React from 'react';

export const metadata = {
  title: 'Terms of Service | Joob Escrow',
  description: 'Terms of Service and legal information for the Joob Escrow protocol.',
};

export default function TermsPage() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Terms of Service (TOS)</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Last updated: June 2026</p>

      <div className="glass-panel" style={{ padding: '40px', borderRadius: '16px' }}>
        
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#fff' }}>1. Nature of the Service (Non-Custodial)</h2>
          <div style={{ padding: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '4px', marginBottom: '15px' }}>
            <strong style={{ color: '#ef4444' }}>Important:</strong> Joob is not a bank, a payment institution, or a custodian of funds.
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Joob provides a software interface to interact with Smart Contracts deployed on the blockchain. At no point do Joob, its executives, or its employees have the ability to arbitrarily seize, move, or block funds outside the strict mathematical conditions defined in the open-source contract code.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#fff' }}>2. Role of Joob: Third-Party Arbitrator</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            The platform acts exclusively as a technology provider and, where applicable, as a Third-Party Arbitrator (Dispute Resolver).
            When a dispute is declared by either party, the Joob Arbitration team has the exclusive power to:
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginLeft: '20px', marginTop: '10px' }}>
            <li>Distribute funds to the Client (refund).</li>
            <li>Distribute funds to the Provider (payment).</li>
            <li>Split the funds equally (50/50).</li>
          </ul>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            Joob is committed to analyzing delivery evidence impartially. The arbitration decision of Joob is final and binding.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#fff' }}>3. Platform Fee</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            The use of the Smart Contract is subject to a service fee (Commission), automatically deducted by the smart contract upon the final resolution of the transaction. These fees vary depending on the vertical used. The exact percentage is displayed transparently before locking the funds.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#fff' }}>4. Inherent Risks of Cryptocurrencies</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            The use of the blockchain involves technical and financial risks, including but not limited to the loss of private keys, extreme volatility of crypto-assets, and network congestion. Joob declines all liability for the loss of funds due to a user manipulation error. Funds must be deposited exclusively in approved stablecoins (e.g., USDT).
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#fff' }}>5. Stale Disputes</h2>
          <div style={{ padding: '15px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', borderRadius: '4px', marginBottom: '15px' }}>
            <strong style={{ color: '#f59e0b' }}>Warning:</strong> To avoid paralyzing funds, if a dispute is opened and no solution is found within 30 days, the smart contract allows the automatic resolution of the dispute at 50/50 to unlock the funds.
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#fff' }}>6. Legality and Compliance</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            The Joob interface is a neutral tool. It is the strict responsibility of Users to ensure that the subject of their transaction is legal in their jurisdiction. Joob reserves the right to block access to its web interface to any IP address or wallet linked to illicit activities.
          </p>
        </section>

      </div>
    </div>
  );
}

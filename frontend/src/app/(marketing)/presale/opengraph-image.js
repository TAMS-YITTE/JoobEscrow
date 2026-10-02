import { ImageResponse } from 'next/og';

// Image d'apercu des liens /presale (Telegram, X...). Aucun prix de listing ni promesse de gain.
export const alt = 'JOOB Presale on JoobEscrow: opens October 15, 2026, 14:00 UTC';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const chip = { display: 'flex', alignItems: 'center', flexShrink: 0, whiteSpace: 'nowrap', padding: '12px 22px', borderRadius: 999, border: '2px solid rgba(255,255,255,0.18)', color: '#e2e8f0', fontSize: 26 };
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '70px 80px', background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1f1a 55%, #1a1405 100%)', color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 34, color: '#94a3b8' }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: '#f59e0b' }} />
          JoobEscrow
        </div>
        <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, marginTop: 24, letterSpacing: -2 }}>JOOB Presale</div>
        <div style={{ display: 'flex', fontSize: 44, marginTop: 12, color: '#fbbf24', fontWeight: 700 }}>
          Opens October 15, 2026 · 14:00 UTC
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 48 }}>
          <div style={chip}>Starts at $0.001</div>
          <div style={chip}>Sealed vault</div>
          <div style={chip}>Vesting on-chain</div>
          <div style={chip}>Audited by SpyWolf</div>
        </div>
        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 30, color: '#64748b' }}>joobescrow.com/presale</div>
      </div>
    ),
    size,
  );
}

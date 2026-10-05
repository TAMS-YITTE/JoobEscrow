// Schema public du co-funded escrow (prevu : PerShare V2 + JoobEscrow V5, audite avant lancement).
const W = 150, H = 60, ROW = 124;
const C1 = 100, C2 = 290, C3 = 480, C4 = 670;
const EDGE = '#64748b', ACCENT = '#84cc16', GOOD = '#10b981', INK = '#f8fafc', QUIET = '#94a3b8';

function Box({ cx, title, sub, color, fill }) {
  return (
    <g>
      <rect x={cx - W / 2} y={ROW - H / 2} width={W} height={H} rx="8" fill={fill || 'none'} fillOpacity={fill ? 0.14 : 1}
        stroke={color || EDGE} strokeWidth={color ? 2 : 1.25} />
      <text x={cx} y={ROW - 4} textAnchor="middle" fontSize="13" fontWeight="600" fill={INK}>{title}</text>
      <text x={cx} y={ROW + 14} textAnchor="middle" fontSize="11.5" fill={color ? INK : QUIET}>{sub}</text>
    </g>
  );
}

export default function CoFundedEscrowDiagram() {
  return (
    <svg viewBox="0 0 760 250" role="img" aria-label="Sponsors co-fund one deal and pay only on delivery"
      style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id="cofund-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill={EDGE} />
        </marker>
      </defs>
      <text x="24" y="30" fontSize="15" fontWeight="600" fill={INK}>Sponsors co-fund one deal and pay only on delivery</text>
      <text x="24" y="52" fontSize="11.5" fill={QUIET}>Planned: PerShare V2 + JoobEscrow V5, audited before launch</text>
      <g fill="none" stroke={EDGE} strokeWidth="1.25">
        <path d={`M${C1 + W / 2} ${ROW}H${C2 - W / 2 - 2}`} markerEnd="url(#cofund-arrow)" />
        <path d={`M${C2 + W / 2} ${ROW}H${C3 - W / 2 - 2}`} markerEnd="url(#cofund-arrow)" />
        <path d={`M${C3 + W / 2} ${ROW}H${C4 - W / 2 - 2}`} markerEnd="url(#cofund-arrow)" />
        <path d={`M${C3} ${ROW + H / 2}V214H${C1}V${ROW + H / 2 + 2}`} strokeDasharray="5 4" markerEnd="url(#cofund-arrow)" />
      </g>
      <Box cx={C1} title="Sponsors" sub="fund together" />
      <Box cx={C2} title="PerShare pool" sub="collects and votes" />
      <Box cx={C3} title="JoobEscrow" sub="locks the funds" color={ACCENT} fill={ACCENT} />
      <Box cx={C4} title="Provider" sub="paid on delivery" color={GOOD} fill={GOOD} />
      <text x={(C1 + C3) / 2} y="206" textAnchor="middle" fontSize="11.5" fill={QUIET}>cancelled or disputed: refunded pro-rata, same currency</text>
    </svg>
  );
}

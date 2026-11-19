export function NeonSign({ className = "" }: { className?: string }) {
  const f = { fontFamily: "var(--f-display), Impact, sans-serif" } as const;
  return (
    <svg viewBox="0 0 640 400" className={className} role="img" aria-label="LFZ BarberShop">
      <defs>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="34" /></filter>
      </defs>
      <path d="M150 0V70M490 0V70" stroke="#6b5d58" strokeWidth="3" />
      <rect x="70" y="70" width="500" height="300" rx="22" fill="#0a0707" stroke="#2a2220" strokeWidth="5" />
      <ellipse cx="320" cy="200" rx="260" ry="130" fill="#ff1f3a" opacity=".35" filter="url(#halo)" />
      <g textAnchor="middle" style={f}>
        <text x="320" y="258" fontSize="210" fill="#ff2a3d" stroke="#ff8f99" strokeWidth="3" strokeLinejoin="round" filter="url(#glow)">LFZ</text>
        <text x="320" y="330" fontSize="46" letterSpacing="14" fill="#fff" stroke="#ff2a3d" strokeWidth="1.5" filter="url(#glow)">BARBERSHOP</text>
      </g>
    </svg>
  );
}

'use client';

/**
 * IIoTFlowAnimation
 * Animated SVG illustration: Factory machines → PLC/Gateway → Cloud → Dashboard
 * Shows live data flowing from the shop floor to FactoryOS in real-time.
 */
export default function IIoTFlowAnimation() {
  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#0f2240] to-[#1a0a3c] overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      <svg
        viewBox="0 0 900 480"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="IIoT data flow from factory machines to FactoryOS dashboard"
      >
        <defs>
          {/* Gradient for connection lines */}
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="dashboardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#2e1065" />
          </linearGradient>
          <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="machineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="barGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softglow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Clip paths */}
          <clipPath id="dashClip">
            <rect x="615" y="80" width="240" height="320" rx="12" />
          </clipPath>
        </defs>

        {/* ══════════════════════════════════════════
            SECTION LABELS
        ══════════════════════════════════════════ */}
        <text x="90" y="32" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="system-ui" letterSpacing="2">SHOP FLOOR</text>
        <text x="340" y="32" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="system-ui" letterSpacing="2">IIoT GATEWAY</text>
        <text x="510" y="32" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="system-ui" letterSpacing="2">CLOUD</text>
        <text x="735" y="32" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="system-ui" letterSpacing="2">FACTORYOS</text>

        {/* ══════════════════════════════════════════
            MACHINES (left side) — 3 machines
        ══════════════════════════════════════════ */}
        {[
          { y: 100, label: 'CNC Machine', oee: '87%', color: '#22c55e' },
          { y: 210, label: 'Press Line',  oee: '72%', color: '#f59e0b' },
          { y: 320, label: 'Assembly',    oee: '91%', color: '#22c55e' },
        ].map((m, i) => (
          <g key={i}>
            {/* Machine body */}
            <rect x="20" y={m.y} width="140" height="80" rx="10" fill="url(#machineGrad)" stroke="#334155" strokeWidth="1.5" />
            {/* Top accent strip */}
            <rect x="20" y={m.y} width="140" height="8" rx="10" fill="#1d4ed8" opacity="0.5" />
            {/* Machine label */}
            <text x="90" y={m.y + 28} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui">{m.label}</text>
            {/* OEE value */}
            <text x="90" y={m.y + 48} textAnchor="middle" fill="#f8fafc" fontSize="16" fontWeight="bold" fontFamily="system-ui">{m.oee}</text>
            <text x="90" y={m.y + 62} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="system-ui">OEE</text>
            {/* Live status dot */}
            <circle cx="145" cy={m.y + 15} r="4" fill={m.color} filter="url(#glow)">
              <animate attributeName="opacity" values="1;0.3;1" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
            {/* Sensor data bars on machine */}
            {[0, 1, 2].map((b) => (
              <rect key={b} x={30 + b * 12} y={m.y + 55} width="8" height={6 + b * 3} rx="1" fill="#3b82f6" opacity="0.4">
                <animate attributeName="height" values={`${6 + b * 3};${10 + b * 4};${6 + b * 3}`} dur={`${1 + b * 0.3}s`} repeatCount="indefinite" />
              </rect>
            ))}
          </g>
        ))}

        {/* ══════════════════════════════════════════
            CONNECTION LINES: Machines → PLC Gateway
        ══════════════════════════════════════════ */}
        {[140, 250, 360].map((my, i) => (
          <g key={i}>
            <line x1="160" y1={my} x2="280" y2="240" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="5,4">
              <animate attributeName="strokeDashoffset" from="0" to="-18" dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite" />
            </line>
            {/* Travelling data packet */}
            <circle r="4" fill="#60a5fa" filter="url(#glow)" opacity="0.9">
              <animateMotion dur={`${2 + i * 0.5}s`} repeatCount="indefinite" begin={`${i * 0.6}s`}>
                <mpath href={`#machinePath${i}`} />
              </animateMotion>
            </circle>
            <path id={`machinePath${i}`} d={`M160,${my} L280,240`} fill="none" visibility="hidden" />
          </g>
        ))}

        {/* ══════════════════════════════════════════
            PLC / IIoT GATEWAY (center-left)
        ══════════════════════════════════════════ */}
        <g>
          {/* Gateway box */}
          <rect x="280" y="180" width="120" height="120" rx="14" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
          <rect x="280" y="180" width="120" height="120" rx="14" fill="#3b82f6" fillOpacity="0.08" />
          {/* Icon: circuit/chip symbol */}
          <rect x="318" y="218" width="44" height="44" rx="6" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
          <rect x="326" y="226" width="28" height="28" rx="3" fill="#1d4ed8" opacity="0.5" />
          {/* Chip legs */}
          {[4, 12, 20].map((o) => (
            <g key={o}>
              <line x1={318} y1={228 + o} x2={312} y2={228 + o} stroke="#3b82f6" strokeWidth="1.5" />
              <line x1={362} y1={228 + o} x2={368} y2={228 + o} stroke="#3b82f6" strokeWidth="1.5" />
            </g>
          ))}
          <text x="340" y="271" textAnchor="middle" fill="#93c5fd" fontSize="9" fontFamily="system-ui">PLC / IIoT</text>
          <text x="340" y="283" textAnchor="middle" fill="#93c5fd" fontSize="9" fontFamily="system-ui">GATEWAY</text>
          {/* Processing animation */}
          <circle cx="340" cy="200" r="5" fill="#3b82f6" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* ══════════════════════════════════════════
            WIFI WAVES: Gateway → Cloud
        ══════════════════════════════════════════ */}
        <g transform="translate(415, 230)">
          {[14, 26, 38].map((r, i) => (
            <circle key={i} cx="0" cy="0" r={r} fill="none" stroke="#8b5cf6" strokeWidth="1.2" opacity="0">
              <animate attributeName="opacity" values="0;0.6;0" dur="2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="r" values={`${r - 4};${r};${r + 4}`} dur="2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* WiFi icon */}
          <text x="0" y="5" textAnchor="middle" fill="#a78bfa" fontSize="16">📡</text>
        </g>

        {/* Line from Gateway to Cloud */}
        <line x1="400" y1="240" x2="460" y2="240" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="6,4">
          <animate attributeName="strokeDashoffset" from="0" to="-20" dur="0.8s" repeatCount="indefinite" />
        </line>
        <circle r="5" fill="#a78bfa" filter="url(#glow)">
          <animateMotion dur="1.2s" repeatCount="indefinite">
            <mpath href="#gwToCloud" />
          </animateMotion>
        </circle>
        <path id="gwToCloud" d="M400,240 L460,240" fill="none" visibility="hidden" />

        {/* ══════════════════════════════════════════
            CLOUD  
        ══════════════════════════════════════════ */}
        <g>
          {/* Cloud shape */}
          <ellipse cx="510" cy="220" rx="50" ry="35" fill="url(#cloudGrad)" opacity="0.9" />
          <circle cx="483" cy="232" r="22" fill="url(#cloudGrad)" opacity="0.9" />
          <circle cx="537" cy="232" r="22" fill="url(#cloudGrad)" opacity="0.9" />
          <rect x="483" y="232" width="55" height="24" fill="url(#cloudGrad)" opacity="0.9" />
          {/* Cloud label */}
          <text x="510" y="237" textAnchor="middle" fill="white" fontSize="10" fontFamily="system-ui" fontWeight="bold">☁ CLOUD</text>
          {/* Pulsing ring */}
          <ellipse cx="510" cy="225" rx="60" ry="42" fill="none" stroke="#818cf8" strokeWidth="1" opacity="0">
            <animate attributeName="opacity" values="0;0.4;0" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="rx" values="50;65;50" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="ry" values="35;48;35" dur="2.5s" repeatCount="indefinite" />
          </ellipse>
        </g>

        {/* ══════════════════════════════════════════
            Line from Cloud → Dashboard
        ══════════════════════════════════════════ */}
        <line x1="560" y1="240" x2="615" y2="240" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="6,4">
          <animate attributeName="strokeDashoffset" from="0" to="-20" dur="0.7s" repeatCount="indefinite" />
        </line>
        <circle r="5" fill="#22d3ee" filter="url(#glow)">
          <animateMotion dur="0.9s" repeatCount="indefinite">
            <mpath href="#cloudToDash" />
          </animateMotion>
        </circle>
        <path id="cloudToDash" d="M560,240 L615,240" fill="none" visibility="hidden" />

        {/* ══════════════════════════════════════════
            DASHBOARD / SCREEN
        ══════════════════════════════════════════ */}
        <g>
          {/* Monitor outer frame */}
          <rect x="605" y="70" width="260" height="330" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          {/* Screen bezel */}
          <rect x="613" y="80" width="244" height="310" rx="10" fill="url(#dashboardGrad)" />

          {/* ── Top bar ── */}
          <rect x="613" y="80" width="244" height="32" rx="10" fill="#1e3a8a" opacity="0.8" />
          <circle cx="628" cy="96" r="5" fill="#ef4444" opacity="0.7" />
          <circle cx="642" cy="96" r="5" fill="#f59e0b" opacity="0.7" />
          <circle cx="656" cy="96" r="5" fill="#22c55e" opacity="0.7" />
          <text x="735" y="100" textAnchor="middle" fill="#93c5fd" fontSize="9" fontFamily="system-ui, monospace">FactoryOS · Live Dashboard</text>

          {/* ── KPI cards row ── */}
          {[
            { label: 'OEE', val: '83%', color: '#22c55e', x: 620 },
            { label: 'Uptime', val: '97%', color: '#3b82f6', x: 700 },
            { label: 'Defects', val: '0.3%', color: '#f59e0b', x: 780 },
          ].map((k) => (
            <g key={k.label}>
              <rect x={k.x} y="120" width="72" height="50" rx="6" fill="#0f2040" stroke="#1e3a8a" strokeWidth="1" />
              <text x={k.x + 36} y="139" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui">{k.label}</text>
              <text x={k.x + 36} y="158" textAnchor="middle" fill={k.color} fontSize="14" fontWeight="bold" fontFamily="system-ui" filter="url(#glow)">{k.val}</text>
            </g>
          ))}

          {/* ── Live chart label ── */}
          <text x="625" y="188" fill="#64748b" fontSize="8" fontFamily="system-ui">PRODUCTION OUTPUT · LAST 7 SHIFTS</text>

          {/* ── Bar chart ── */}
          {[
            { h: 48, x: 622 }, { h: 62, x: 642 }, { h: 40, x: 662 },
            { h: 70, x: 682 }, { h: 55, x: 702 }, { h: 80, x: 722 }, { h: 68, x: 742 },
          ].map((bar, i) => (
            <g key={i}>
              <rect x={bar.x} y={250 - bar.h} width="14" height={bar.h} rx="3" fill="url(#barGrad)" opacity="0.8">
                <animate
                  attributeName="height"
                  values={`${bar.h};${bar.h + 8};${bar.h}`}
                  dur={`${2 + i * 0.2}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="y"
                  values={`${250 - bar.h};${250 - bar.h - 8};${250 - bar.h}`}
                  dur={`${2 + i * 0.2}s`}
                  repeatCount="indefinite"
                />
              </rect>
            </g>
          ))}

          {/* ── Live line sparkline ── */}
          <polyline
            points="622,310 642,295 662,302 682,285 702,292 722,270 742,278 762,260"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
          {/* End dot (live) */}
          <circle cx="762" cy="260" r="3.5" fill="#22d3ee" filter="url(#glow)">
            <animate attributeName="r" values="3.5;5;3.5" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <text x="768" y="263" fill="#22d3ee" fontSize="7" fontFamily="system-ui">LIVE</text>

          {/* ── Alert strip ── */}
          <rect x="613" y="330" width="244" height="28" rx="0" fill="#422006" opacity="0.8" />
          <circle cx="626" cy="344" r="4" fill="#f59e0b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x="635" y="348" fill="#fbbf24" fontSize="8" fontFamily="system-ui">⚠ Press Line — Downtime detected · 4m ago</text>

          {/* ── Machine status row ── */}
          <text x="620" y="374" fill="#64748b" fontSize="8" fontFamily="system-ui">MACHINE STATUS</text>
          {[
            { label: 'CNC', status: 'RUN', color: '#22c55e', x: 620 },
            { label: 'PRESS', status: 'DWN', color: '#ef4444', x: 672 },
            { label: 'ASSY', status: 'RUN', color: '#22c55e', x: 724 },
            { label: 'QC', status: 'IDL', color: '#f59e0b', x: 776 },
          ].map((s) => (
            <g key={s.label}>
              <rect x={s.x} y="378" width="44" height="18" rx="4" fill={s.color} fillOpacity="0.15" stroke={s.color} strokeWidth="0.8" />
              <circle cx={s.x + 8} cy="387" r="3" fill={s.color}>
                <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <text x={s.x + 14} y="390" fill={s.color} fontSize="7.5" fontFamily="system-ui" fontWeight="bold">{s.label} {s.status}</text>
            </g>
          ))}

          {/* Monitor stand */}
          <rect x="715" y="400" width="6" height="14" rx="2" fill="#334155" />
          <rect x="695" y="412" width="46" height="6" rx="3" fill="#334155" />
        </g>

        {/* ══════════════════════════════════════════
            FLOATING DATA LABELS
        ══════════════════════════════════════════ */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="4s" begin="0.5s" repeatCount="indefinite" />
          <rect x="175" y="88" width="70" height="20" rx="6" fill="#22c55e" opacity="0.15" stroke="#22c55e" strokeWidth="0.8" />
          <text x="210" y="102" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="system-ui">Temp: 78°C ▲</text>
        </g>
        <g opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="4s" begin="2s" repeatCount="indefinite" />
          <rect x="175" y="198" width="80" height="20" rx="6" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="215" y="212" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="system-ui">Vibration: HIGH</text>
        </g>
        <g opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="4s" begin="3.5s" repeatCount="indefinite" />
          <rect x="175" y="308" width="76" height="20" rx="6" fill="#3b82f6" opacity="0.15" stroke="#3b82f6" strokeWidth="0.8" />
          <text x="213" y="322" textAnchor="middle" fill="#3b82f6" fontSize="9" fontFamily="system-ui">Cycle: 42s ✓</text>
        </g>

        {/* ══════════════════════════════════════════
            BOTTOM LEGEND
        ══════════════════════════════════════════ */}
        <g>
          <line x1="340" y1="450" x2="360" y2="450" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,3" />
          <text x="367" y="454" fill="#64748b" fontSize="9" fontFamily="system-ui">Real-time data stream</text>
          <circle cx="500" cy="450" r="4" fill="#22c55e" />
          <text x="510" y="454" fill="#64748b" fontSize="9" fontFamily="system-ui">Machine running</text>
          <circle cx="600" cy="450" r="4" fill="#ef4444" />
          <text x="610" y="454" fill="#64748b" fontSize="9" fontFamily="system-ui">Downtime alert</text>
        </g>
      </svg>
    </div>
  );
}

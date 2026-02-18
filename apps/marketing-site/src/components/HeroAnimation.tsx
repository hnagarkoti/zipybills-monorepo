'use client';

import { useEffect, useState } from 'react';

const SCENE_DURATION = 4200; // ms per scene
const TOTAL_SCENES = 7;

export default function HeroAnimation() {
  const [scene, setScene] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setScene((s) => (s + 1) % TOTAL_SCENES);
        setFade(true);
      }, 350);
    }, SCENE_DURATION);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full select-none" aria-hidden="true">
      {/* Outer frame — browser / device chrome */}
      <div className="relative rounded-2xl bg-gradient-to-br from-gray-900 via-[#0f172a] to-[#1e1040] p-[3px] shadow-2xl shadow-brand-900/40">
        <div className="rounded-[14px] overflow-hidden bg-[#050d1a]" style={{ minHeight: 420 }}>

          {/* ── Top chrome bar ── */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1628] border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 mx-3 h-5 rounded-md bg-white/5 flex items-center px-3 gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-gray-500 font-mono">app.factoryos.zipybills.com</span>
            </div>
            <div className="text-[9px] text-gray-600 font-medium">LIVE</div>
          </div>

          {/* ── Scene container ── */}
          <div
            className="relative overflow-hidden"
            style={{
              opacity: fade ? 1 : 0,
              transition: 'opacity 0.35s ease',
              minHeight: 390,
            }}
          >
            {scene === 0 && <SceneFactory />}
            {scene === 1 && <SceneDataCollection />}
            {scene === 2 && <SceneCloud />}
            {scene === 3 && <SceneDashboard />}
            {scene === 4 && <SceneERP />}
            {scene === 5 && <SceneImpact />}
            {scene === 6 && <SceneFinal />}
          </div>
        </div>
      </div>

      {/* ── Scene dots indicator ── */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
        {Array.from({ length: TOTAL_SCENES }).map((_, i) => (
          <button
            key={i}
            onClick={() => { setFade(false); setTimeout(() => { setScene(i); setFade(true); }, 200); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === scene ? 'w-6 bg-brand-500' : 'w-1.5 bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SCENE 1 — Smart Factory Floor Overview
════════════════════════════════════════════ */
function SceneFactory() {
  return (
    <div className="relative w-full bg-[#050d1a]" style={{ height: 390 }}>
      <SceneLabel>Scene 1 · Smart Factory Overview</SceneLabel>
      <svg viewBox="0 0 620 390" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f2040" />
            <stop offset="100%" stopColor="#050d1a" />
          </linearGradient>
          <linearGradient id="machineGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0f1f38" />
          </linearGradient>
          <filter id="glow1">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Floor */}
        <rect width="620" height="390" fill="url(#floorGrad)" />

        {/* Perspective grid */}
        {[...Array(8)].map((_, i) => (
          <line key={i} x1={i * 80} y1="390" x2="310" y2="180" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.4" />
        ))}
        {[0, 0.15, 0.3, 0.5, 0.7, 1].map((t, i) => (
          <line key={i}
            x1={t * 620} y1={180 + t * 210}
            x2={(1 - t) * 620 + t * 0} y2={180 + t * 210}
            stroke="#1e3a5f" strokeWidth="0.5" opacity="0.3" />
        ))}

        {/* Machine 1 — CNC */}
        <g>
          <rect x="60" y="210" width="90" height="100" rx="6" fill="url(#machineGrad1)" stroke="#2563eb" strokeWidth="1" />
          <rect x="75" y="220" width="60" height="40" rx="3" fill="#0a1628" />
          <rect x="80" y="225" width="50" height="30" rx="2" fill="#0f2040" />
          {/* Screen glow */}
          <rect x="80" y="225" width="50" height="30" rx="2" fill="#1d4ed8" fillOpacity="0.2" />
          {/* Spindle */}
          <rect x="98" y="265" width="14" height="30" rx="2" fill="#1e3a5f" />
          <circle cx="105" cy="265" r="8" fill="#1d4ed8" fillOpacity="0.6" filter="url(#glow1)">
            <animate attributeName="r" values="8;10;8" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x="105" y="322" textAnchor="middle" fill="#60a5fa" fontSize="8" fontFamily="system-ui">CNC-01</text>
          {/* Status */}
          <circle cx="140" cy="218" r="4" fill="#22c55e" filter="url(#glow1)">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Machine 2 — Press */}
        <g>
          <rect x="200" y="185" width="100" height="130" rx="6" fill="url(#machineGrad1)" stroke="#2563eb" strokeWidth="1" />
          <rect x="215" y="195" width="70" height="60" rx="3" fill="#0a1628" />
          <rect x="220" y="200" width="60" height="50" rx="2" fill="#0f2040" />
          <rect x="220" y="200" width="60" height="50" rx="2" fill="#1d4ed8" fillOpacity="0.15" />
          <rect x="230" y="258" width="40" height="20" rx="2" fill="#1e3a5f" />
          <rect x="238" y="270" width="24" height="32" rx="1" fill="#0f2040" stroke="#2563eb" strokeWidth="0.8">
            <animate attributeName="height" values="32;18;32" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="y" values="270;284;270" dur="1.4s" repeatCount="indefinite" />
          </rect>
          <text x="250" y="328" textAnchor="middle" fill="#60a5fa" fontSize="8" fontFamily="system-ui">PRESS-03</text>
          <circle cx="290" cy="193" r="4" fill="#22c55e" filter="url(#glow1)">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Machine 3 — Assembly */}
        <g>
          <rect x="360" y="210" width="100" height="110" rx="6" fill="url(#machineGrad1)" stroke="#f97316" strokeWidth="1" />
          <rect x="375" y="220" width="70" height="50" rx="3" fill="#0a1628" />
          <rect x="380" y="225" width="60" height="40" rx="2" fill="#0f2040" />
          <rect x="380" y="225" width="60" height="40" rx="2" fill="#f97316" fillOpacity="0.1" />
          {/* Robot arm */}
          <line x1="410" y1="275" x2="395" y2="290" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
          <line x1="395" y1="290" x2="410" y2="302" stroke="#f97316" strokeWidth="2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 395 290" to="20 395 290" dur="0.8s" repeatCount="indefinite" additive="sum" />
          </line>
          <circle cx="410" cy="302" r="4" fill="#f97316" fillOpacity="0.8" />
          <text x="410" y="334" textAnchor="middle" fill="#fb923c" fontSize="8" fontFamily="system-ui">ASSY-07</text>
          <circle cx="450" cy="218" r="4" fill="#f59e0b" filter="url(#glow1)">
            <animate attributeName="opacity" values="1;0.3;1" dur="0.7s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Machine 4 — QC */}
        <g>
          <rect x="510" y="225" width="80" height="90" rx="6" fill="url(#machineGrad1)" stroke="#2563eb" strokeWidth="1" />
          <rect x="523" y="235" width="54" height="40" rx="3" fill="#0a1628" />
          <rect x="527" y="239" width="46" height="32" rx="2" fill="#0f2040" />
          <rect x="527" y="239" width="46" height="32" rx="2" fill="#7c3aed" fillOpacity="0.15" />
          <text x="550" y="258" textAnchor="middle" fill="#a78bfa" fontSize="7" fontFamily="system-ui">PASS</text>
          <text x="550" y="268" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold" fontFamily="system-ui">✓</text>
          <text x="550" y="328" textAnchor="middle" fill="#a78bfa" fontSize="8" fontFamily="system-ui">QC-02</text>
          <circle cx="580" cy="233" r="4" fill="#22c55e" filter="url(#glow1)">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Glowing data lines between machines */}
        {[
          { x1: 150, y1: 255, x2: 200, y2: 250 },
          { x1: 300, y1: 250, x2: 360, y2: 255 },
          { x1: 460, y1: 260, x2: 510, y2: 260 },
        ].map((l, i) => (
          <g key={i}>
            <line {...l} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5">
              <animate attributeName="strokeDashoffset" from="0" to="-14" dur={`${0.8 + i * 0.2}s`} repeatCount="indefinite" />
            </line>
            <circle r="4" fill="#60a5fa" filter="url(#glow1)" opacity="0.9">
              <animateMotion dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`}>
                <mpath href={`#factLine${i}`} />
              </animateMotion>
            </circle>
            <path id={`factLine${i}`} d={`M${l.x1},${l.y1} L${l.x2},${l.y2}`} fill="none" visibility="hidden" />
          </g>
        ))}

        {/* Operators */}
        {[{ x: 170, y: 310 }, { x: 320, y: 325 }, { x: 480, y: 318 }].map((op, i) => (
          <g key={i}>
            {/* Hard hat */}
            <ellipse cx={op.x} cy={op.y - 14} rx="7" ry="5" fill="#f59e0b" />
            <circle cx={op.x} cy={op.y - 8} r="6" fill="#d97706" />
            {/* Body */}
            <rect x={op.x - 5} y={op.y - 2} width="10" height="14" rx="2" fill="#1e40af" />
            {/* Legs */}
            <rect x={op.x - 5} y={op.y + 12} width="4" height="10" rx="1" fill="#1e3a5f" />
            <rect x={op.x + 1} y={op.y + 12} width="4" height="10" rx="1" fill="#1e3a5f" />
          </g>
        ))}

        {/* Scene label at bottom */}
        <rect x="0" y="360" width="620" height="30" fill="#050d1a" opacity="0.7" />
        <text x="310" y="380" textAnchor="middle" fill="#3b82f6" fontSize="11" fontFamily="system-ui" fontWeight="bold">
          Smart Factory Floor — All systems connected
        </text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════
   SCENE 2 — Data Collection / IIoT
════════════════════════════════════════════ */
function SceneDataCollection() {
  return (
    <div className="relative w-full bg-[#050d1a]" style={{ height: 390 }}>
      <SceneLabel>Scene 2 · IIoT Data Collection</SceneLabel>
      <svg viewBox="0 0 620 390" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="machFocus" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#050d1a" stopOpacity="0" />
          </radialGradient>
          <filter id="glow2"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="packetGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        <rect width="620" height="390" fill="#050d1a" />
        <ellipse cx="180" cy="220" rx="180" ry="140" fill="url(#machFocus)" />

        {/* Main Machine (zoomed) */}
        <rect x="60" y="100" width="200" height="200" rx="10" fill="#0f1f38" stroke="#2563eb" strokeWidth="2" />
        <rect x="80" y="120" width="160" height="100" rx="6" fill="#0a1628" />
        <rect x="86" y="126" width="148" height="88" rx="4" fill="#0f2040" />

        {/* Screen content */}
        <text x="160" y="148" textAnchor="middle" fill="#60a5fa" fontSize="9" fontFamily="monospace">CNC MACHINE #01</text>
        <text x="110" y="168" fill="#94a3b8" fontSize="8" fontFamily="monospace">Spindle RPM</text>
        <text x="220" y="168" fill="#22c55e" fontSize="10" fontFamily="monospace" textAnchor="end">1,450</text>
        <text x="110" y="182" fill="#94a3b8" fontSize="8" fontFamily="monospace">Feed Rate</text>
        <text x="220" y="182" fill="#22c55e" fontSize="10" fontFamily="monospace" textAnchor="end">320 mm/min</text>
        <text x="110" y="196" fill="#94a3b8" fontSize="8" fontFamily="monospace">Temperature</text>
        <text x="220" y="196" fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="end">78°C</text>
        <text x="110" y="210" fill="#94a3b8" fontSize="8" fontFamily="monospace">Vibration</text>
        <text x="220" y="210" fill="#22c55e" fontSize="10" fontFamily="monospace" textAnchor="end">Normal</text>

        {/* Machine bottom */}
        <rect x="120" y="225" width="80" height="50" rx="4" fill="#0a1628" />
        <rect x="148" y="228" width="24" height="44" rx="2" fill="#1e3a5f">
          <animate attributeName="height" values="44;30;44" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="y" values="228;242;228" dur="1.2s" repeatCount="indefinite" />
        </rect>
        <text x="160" y="295" textAnchor="middle" fill="#60a5fa" fontSize="9" fontFamily="system-ui">CNC-01 · RUNNING</text>
        <circle cx="250" cy="108" r="5" fill="#22c55e" filter="url(#glow2)">
          <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
        </circle>

        {/* IoT Sensors on machine */}
        {[{ x: 75, y: 160, label: 'TEMP' }, { x: 75, y: 195, label: 'VIB' }, { x: 75, y: 230, label: 'RPM' }].map((s) => (
          <g key={s.label}>
            <rect x={s.x - 18} y={s.y - 8} width="36" height="16" rx="4" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="0.8" />
            <text x={s.x} y={s.y + 4} textAnchor="middle" fill="#93c5fd" fontSize="7" fontFamily="monospace">{s.label}</text>
          </g>
        ))}

        {/* Gateway box */}
        <rect x="340" y="140" width="100" height="100" rx="10" fill="#0f1f38" stroke="#8b5cf6" strokeWidth="1.5" />
        <rect x="355" y="155" width="70" height="70" rx="6" fill="#0a1628" />
        <text x="390" y="182" textAnchor="middle" fill="#a78bfa" fontSize="8" fontFamily="system-ui">IIoT</text>
        <text x="390" y="194" textAnchor="middle" fill="#a78bfa" fontSize="8" fontFamily="system-ui">GATEWAY</text>
        {/* Chip grid */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <rect key={`${row}-${col}`} x={360 + col * 20} y={202 + row * 8} width="14" height="5" rx="1" fill="#4f46e5" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur={`${0.8 + (row + col) * 0.2}s`} repeatCount="indefinite" />
            </rect>
          ))
        )}

        {/* Cloud */}
        <ellipse cx="530" cy="185" rx="60" ry="40" fill="#1d4ed8" fillOpacity="0.25" />
        <ellipse cx="498" cy="200" rx="35" ry="28" fill="#1d4ed8" fillOpacity="0.25" />
        <ellipse cx="562" cy="200" rx="35" ry="28" fill="#1d4ed8" fillOpacity="0.25" />
        <rect x="498" y="200" width="65" height="28" fill="#1d4ed8" fillOpacity="0.25" />
        <text x="530" y="198" textAnchor="middle" fill="#93c5fd" fontSize="9" fontFamily="system-ui" fontWeight="bold">☁ CLOUD</text>
        <circle cx="530" cy="185" r="55" fill="none" stroke="#3b82f6" strokeWidth="0.8" opacity="0">
          <animate attributeName="opacity" values="0;0.4;0" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="r" values="50;70;50" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Data packets: Machine → Gateway */}
        {[155, 190, 225].map((y, i) => (
          <g key={i}>
            <circle r="5" fill="url(#packetGrad)" filter="url(#glow2)">
              <animateMotion dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.5}s`}>
                <mpath href={`#p2g${i}`} />
              </animateMotion>
            </circle>
            <path id={`p2g${i}`} d={`M260,${y} C295,${y} 310,190 340,190`} fill="none" />
            <path d={`M260,${y} C295,${y} 310,190 340,190`} fill="none" stroke="url(#packetGrad)" strokeWidth="1" strokeDasharray="4,3" opacity="0.4">
              <animate attributeName="strokeDashoffset" from="0" to="-14" dur="0.8s" repeatCount="indefinite" />
            </path>
          </g>
        ))}

        {/* Packets: Gateway → Cloud */}
        <circle r="5" fill="#a78bfa" filter="url(#glow2)">
          <animateMotion dur="1.2s" repeatCount="indefinite">
            <mpath href="#g2c" />
          </animateMotion>
        </circle>
        <path id="g2c" d="M440,190 C470,190 490,190 470,195" fill="none" />
        <line x1="440" y1="190" x2="490" y2="195" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5">
          <animate attributeName="strokeDashoffset" from="0" to="-16" dur="0.7s" repeatCount="indefinite" />
        </line>

        {/* Secure badge */}
        <rect x="458" y="228" width="60" height="18" rx="5" fill="#064e3b" stroke="#22c55e" strokeWidth="0.8" />
        <text x="488" y="240" textAnchor="middle" fill="#22c55e" fontSize="8" fontFamily="system-ui">🔒 Encrypted</text>

        <rect x="0" y="360" width="620" height="30" fill="#050d1a" opacity="0.7" />
        <text x="310" y="380" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontFamily="system-ui" fontWeight="bold">
          Real-time sensor data → IIoT Gateway → Secure Cloud
        </text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════
   SCENE 3 — Cloud Processing / Dashboards
════════════════════════════════════════════ */
function SceneCloud() {
  return (
    <div className="relative w-full bg-[#050d1a]" style={{ height: 390 }}>
      <SceneLabel>Scene 3 · Cloud Processing</SceneLabel>
      <svg viewBox="0 0 620 390" className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="glow3"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="barB" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#1d4ed8" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient>
        </defs>
        <rect width="620" height="390" fill="#050d1a" />

        {/* Central cloud glow */}
        <ellipse cx="310" cy="130" rx="220" ry="80" fill="#1d4ed8" fillOpacity="0.06" />

        {/* Cloud shape */}
        <ellipse cx="310" cy="100" rx="90" ry="50" fill="#0f2040" stroke="#3b82f6" strokeWidth="1.5" />
        <circle cx="248" cy="118" r="38" fill="#0f2040" stroke="#3b82f6" strokeWidth="1.5" />
        <circle cx="372" cy="118" r="38" fill="#0f2040" stroke="#3b82f6" strokeWidth="1.5" />
        <rect x="248" y="118" width="125" height="38" fill="#0f2040" />
        <text x="310" y="115" textAnchor="middle" fill="#60a5fa" fontSize="11" fontFamily="system-ui" fontWeight="bold">☁ FactoryOS Cloud</text>
        <text x="310" y="130" textAnchor="middle" fill="#3b82f6" fontSize="9" fontFamily="system-ui">Processing 1,842 data points / sec</text>

        {/* Pulse rings */}
        {[1, 2, 3].map((r) => (
          <ellipse key={r} cx="310" cy="115" rx={100 + r * 30} ry={60 + r * 18} fill="none" stroke="#3b82f6" strokeWidth="0.8" opacity="0">
            <animate attributeName="opacity" values="0;0.3;0" dur="3s" begin={`${r * 0.8}s`} repeatCount="indefinite" />
          </ellipse>
        ))}

        {/* Dashboard card 1 — OEE */}
        <g>
          <rect x="30" y="180" width="140" height="110" rx="10" fill="#0f1f38" stroke="#2563eb" strokeWidth="1.5" />
          <text x="100" y="200" textAnchor="middle" fill="#60a5fa" fontSize="9" fontFamily="system-ui">OEE</text>
          <text x="100" y="230" textAnchor="middle" fill="#22c55e" fontSize="28" fontWeight="bold" fontFamily="system-ui" filter="url(#glow3)">
            83%
            <animate attributeName="textContent" values="78%;81%;83%;82%;83%" dur="4s" repeatCount="indefinite" />
          </text>
          <text x="100" y="248" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui">Availability × Perf × Quality</text>
          {/* Mini sparkline */}
          <polyline points="42,275 62,268 82,272 102,260 122,265 142,255 158,258" fill="none" stroke="#22c55e" strokeWidth="1.5" />
          <circle cx="158" cy="258" r="3" fill="#22c55e" filter="url(#glow3)">
            <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Dashboard card 2 — Production */}
        <g>
          <rect x="190" y="180" width="140" height="110" rx="10" fill="#0f1f38" stroke="#7c3aed" strokeWidth="1.5" />
          <text x="260" y="200" textAnchor="middle" fill="#a78bfa" fontSize="9" fontFamily="system-ui">Production Count</text>
          <text x="260" y="228" textAnchor="middle" fill="#c4b5fd" fontSize="24" fontWeight="bold" fontFamily="system-ui">1,247</text>
          <text x="260" y="244" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui">Target: 1,400 units</text>
          {/* Progress bar */}
          <rect x="205" y="252" width="110" height="8" rx="4" fill="#1e1a38" />
          <rect x="205" y="252" width="89" height="8" rx="4" fill="#7c3aed" fillOpacity="0.8">
            <animate attributeName="width" values="80;89;80" dur="3s" repeatCount="indefinite" />
          </rect>
          <text x="260" y="276" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui">89% of target</text>
        </g>

        {/* Dashboard card 3 — Alert */}
        <g>
          <rect x="350" y="180" width="140" height="110" rx="10" fill="#0f1f38" stroke="#f97316" strokeWidth="1.5" />
          <text x="420" y="200" textAnchor="middle" fill="#fb923c" fontSize="9" fontFamily="system-ui">⚠ Active Alert</text>
          <rect x="362" y="208" width="116" height="32" rx="5" fill="#431407" />
          <text x="420" y="222" textAnchor="middle" fill="#f97316" fontSize="8" fontFamily="system-ui">PRESS-03 Downtime</text>
          <text x="420" y="234" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="system-ui">Duration: 00:12:34</text>
          <circle cx="420" cy="255" r="16" fill="#431407" stroke="#f97316" strokeWidth="1.5">
            <animate attributeName="stroke" values="#f97316;#ef4444;#f97316" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x="420" y="259" textAnchor="middle" fill="#f97316" fontSize="12" fontFamily="system-ui">!</text>
          <text x="420" y="278" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui">Notified: Manager + WhatsApp</text>
        </g>

        {/* Dashboard card 4 — Quality */}
        <g>
          <rect x="450" y="180" width="140" height="110" rx="10" fill="#0f1f38" stroke="#22c55e" strokeWidth="1.5" />
          <text x="520" y="200" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="system-ui">Quality Metrics</text>
          {[
            { label: 'Pass Rate', val: '99.2%', color: '#22c55e' },
            { label: 'Defects', val: '8 pcs', color: '#f59e0b' },
            { label: 'Rework', val: '0.3%', color: '#22c55e' },
          ].map((q, i) => (
            <g key={q.label}>
              <text x="465" y={218 + i * 16} fill="#64748b" fontSize="8" fontFamily="system-ui">{q.label}</text>
              <text x="580" y={218 + i * 16} textAnchor="end" fill={q.color} fontSize="9" fontFamily="system-ui" fontWeight="bold">{q.val}</text>
            </g>
          ))}
          <polyline points="462,262 478,258 494,264 510,252 526,256 542,248 558,250 574,245 580,243"
            fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.8" />
        </g>

        {/* Lines from cloud to cards */}
        {[100, 260, 420, 520].map((x, i) => (
          <line key={i} x1="310" y1="155" x2={x} y2="180" stroke="#1d4ed8" strokeWidth="1" strokeDasharray="4,3" opacity="0.4">
            <animate attributeName="strokeDashoffset" from="0" to="-14" dur="0.8s" repeatCount="indefinite" />
          </line>
        ))}

        <rect x="0" y="360" width="620" height="30" fill="#050d1a" opacity="0.7" />
        <text x="310" y="380" textAnchor="middle" fill="#60a5fa" fontSize="11" fontFamily="system-ui" fontWeight="bold">
          Cloud engine forming live dashboards — instant insights
        </text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════
   SCENE 4 — Live Dashboard View
════════════════════════════════════════════ */
function SceneDashboard() {
  return (
    <div className="relative w-full bg-[#0a0f1e]" style={{ height: 390 }}>
      <SceneLabel>Scene 4 · Live Dashboard View</SceneLabel>
      <svg viewBox="0 0 620 390" className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="glow4"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="tgtGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="actGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        <rect width="620" height="390" fill="#0a0f1e" />

        {/* Laptop frame */}
        <rect x="120" y="20" width="380" height="270" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        <rect x="130" y="30" width="360" height="250" rx="6" fill="#050d1a" />

        {/* Dashboard top bar */}
        <rect x="130" y="30" width="360" height="28" rx="6" fill="#0f2040" />
        <text x="200" y="48" fill="#60a5fa" fontSize="9" fontFamily="system-ui" fontWeight="bold">FactoryOS · Plant Dashboard</text>
        <circle cx="465" cy="44" r="5" fill="#22c55e" filter="url(#glow4)">
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        </circle>
        <text x="474" y="47" fill="#22c55e" fontSize="7" fontFamily="system-ui">LIVE</text>

        {/* KPI row */}
        {[
          { label: 'OEE', val: '83%', col: '#22c55e', x: 140 },
          { label: 'Running', val: '22/26', col: '#3b82f6', x: 230 },
          { label: 'Output', val: '1,247', col: '#a78bfa', x: 320 },
          { label: 'Alerts', val: '2', col: '#f97316', x: 410 },
        ].map((k) => (
          <g key={k.label}>
            <rect x={k.x} y="66" width="78" height="44" rx="5" fill="#0f1f38" stroke="#1e3a5f" strokeWidth="1" />
            <text x={k.x + 39} y="82" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui">{k.label}</text>
            <text x={k.x + 39} y="100" textAnchor="middle" fill={k.col} fontSize="14" fontWeight="bold" fontFamily="system-ui">{k.val}</text>
          </g>
        ))}

        {/* Machine status grid */}
        <text x="140" y="124" fill="#64748b" fontSize="8" fontFamily="system-ui">MACHINE STATUS</text>
        {[
          { id: 'CNC-01', col: '#22c55e', status: 'RUN', x: 140 },
          { id: 'CNC-02', col: '#22c55e', status: 'RUN', x: 200 },
          { id: 'PRESS-03', col: '#ef4444', status: 'DWN', x: 260 },
          { id: 'PRESS-04', col: '#22c55e', status: 'RUN', x: 330 },
          { id: 'ASSY-05', col: '#22c55e', status: 'RUN', x: 390 },
          { id: 'QC-06', col: '#f59e0b', status: 'IDL', x: 450 },
        ].map((m) => (
          <g key={m.id}>
            <rect x={m.x} y="130" width="52" height="24" rx="4" fill={m.col} fillOpacity="0.12" stroke={m.col} strokeWidth="0.8" />
            <circle cx={m.x + 8} cy="142" r="3.5" fill={m.col}>
              <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <text x={m.x + 12} y="146" fill={m.col} fontSize="7" fontFamily="system-ui">{m.id.length > 6 ? m.id.slice(0, 7) : m.id}</text>
          </g>
        ))}

        {/* Target vs Actual chart */}
        <text x="140" y="172" fill="#64748b" fontSize="8" fontFamily="system-ui">TARGET vs ACTUAL PRODUCTION</text>
        {[
          { t: 78, a: 65, label: 'S1' },
          { t: 80, a: 80, label: 'S2' },
          { t: 78, a: 72, label: 'S3' },
          { t: 80, a: 88, label: 'S4' },
          { t: 78, a: 75, label: 'S5' },
          { t: 80, a: 90, label: 'S6' },
          { t: 78, a: 84, label: 'S7' },
        ].map((bar, i) => (
          <g key={i}>
            {/* Target bar (behind) */}
            <rect x={140 + i * 48} y={248 - bar.t} width="18" height={bar.t} rx="2" fill="#3b82f6" opacity="0.3" />
            {/* Actual bar */}
            <rect x={162 + i * 48} y={248 - bar.a} width="18" height={bar.a} rx="2" fill="url(#actGrad)" opacity="0.8">
              <animate attributeName="height" values={`${bar.a};${bar.a + 4};${bar.a}`} dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
              <animate attributeName="y" values={`${248 - bar.a};${248 - bar.a - 4};${248 - bar.a}`} dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
            </rect>
            <text x={151 + i * 48} y="258" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="system-ui">{bar.label}</text>
          </g>
        ))}
        {/* Legend */}
        <rect x="380" y="230" width="10" height="8" rx="1" fill="#3b82f6" opacity="0.5" />
        <text x="394" y="238" fill="#64748b" fontSize="7" fontFamily="system-ui">Target</text>
        <rect x="430" y="230" width="10" height="8" rx="1" fill="#22c55e" opacity="0.8" />
        <text x="444" y="238" fill="#64748b" fontSize="7" fontFamily="system-ui">Actual</text>

        {/* Alert popup */}
        <g>
          <rect x="390" y="150" width="96" height="38" rx="6" fill="#431407" stroke="#f97316" strokeWidth="1.5">
            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
          </rect>
          <text x="438" y="166" textAnchor="middle" fill="#f97316" fontSize="8" fontFamily="system-ui">⚠ PRESS-03 DOWN</text>
          <text x="438" y="179" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="system-ui">00:12:34 · Notified ✓</text>
        </g>

        {/* Laptop base */}
        <rect x="80" y="290" width="460" height="16" rx="4" fill="#1e293b" />
        <rect x="220" y="306" width="180" height="8" rx="2" fill="#0f172a" />

        {/* Plant manager figure (simplified) */}
        <circle cx="560" cy="200" r="20" fill="#1e3a5f" />
        <text x="560" y="205" textAnchor="middle" fill="#60a5fa" fontSize="14">👤</text>
        <text x="560" y="230" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui">Plant Manager</text>
        <line x1="530" y1="205" x2="500" y2="180" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,2" opacity="0.5">
          <animate attributeName="strokeDashoffset" from="0" to="-10" dur="0.6s" repeatCount="indefinite" />
        </line>

        <rect x="0" y="360" width="620" height="30" fill="#050d1a" opacity="0.7" />
        <text x="310" y="380" textAnchor="middle" fill="#60a5fa" fontSize="11" fontFamily="system-ui" fontWeight="bold">
          One screen. Every machine. Every shift. Real-time.
        </text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════
   SCENE 5 — ERP Integration
════════════════════════════════════════════ */
function SceneERP() {
  return (
    <div className="relative w-full bg-[#050d1a]" style={{ height: 390 }}>
      <SceneLabel>Scene 5 · ERP Integration</SceneLabel>
      <svg viewBox="0 0 620 390" className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="glow5"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="620" height="390" fill="#050d1a" />

        {/* FactoryOS node */}
        <rect x="40" y="140" width="140" height="100" rx="12" fill="#0f2040" stroke="#3b82f6" strokeWidth="2" />
        <text x="110" y="168" textAnchor="middle" fill="#60a5fa" fontSize="10" fontFamily="system-ui" fontWeight="bold">FactoryOS</text>
        {[
          { l: 'OEE Data', v: '✓ Live' },
          { l: 'Prod Count', v: '✓ Live' },
          { l: 'Downtime', v: '✓ Live' },
          { l: 'Quality', v: '✓ Live' },
        ].map((r, i) => (
          <g key={r.l}>
            <text x="52" y={183 + i * 13} fill="#64748b" fontSize="7.5" fontFamily="system-ui">{r.l}</text>
            <text x="168" y={183 + i * 13} fill="#22c55e" fontSize="7.5" fontFamily="system-ui" textAnchor="end">{r.v}</text>
          </g>
        ))}

        {/* Central API gateway */}
        <rect x="240" y="155" width="140" height="80" rx="12" fill="#0f1f38" stroke="#8b5cf6" strokeWidth="2" />
        <text x="310" y="183" textAnchor="middle" fill="#a78bfa" fontSize="10" fontFamily="system-ui" fontWeight="bold">🔗 API Gateway</text>
        <text x="310" y="198" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui">Secure · REST / Webhooks</text>
        <rect x="258" y="207" width="104" height="14" rx="4" fill="#1e1040" />
        <text x="310" y="217" textAnchor="middle" fill="#6d28d9" fontSize="7" fontFamily="monospace">TLS 1.3 · OAuth 2.0</text>
        {/* Spinning shield */}
        <text x="310" y="238" textAnchor="middle" fill="#22c55e" fontSize="14">🔒</text>

        {/* ERP nodes — right side */}
        {[
          { name: 'SAP ERP', color: '#0070f3', y: 80 },
          { name: 'Tally', color: '#22c55e', y: 170 },
          { name: 'Oracle Netsuite', color: '#f97316', y: 260 },
        ].map((erp) => (
          <g key={erp.name}>
            <rect x="440" y={erp.y} width="130" height="60" rx="10" fill="#0f1f38" stroke={erp.color} strokeWidth="1.5" />
            <text x="505" y={erp.y + 28} textAnchor="middle" fill={erp.color} fontSize="10" fontFamily="system-ui" fontWeight="bold">{erp.name}</text>
            <text x="505" y={erp.y + 42} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui">Synced ✓</text>
          </g>
        ))}

        {/* Lines: FactoryOS → Gateway */}
        <line x1="180" y1="190" x2="240" y2="195" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,3">
          <animate attributeName="strokeDashoffset" from="0" to="-16" dur="0.7s" repeatCount="indefinite" />
        </line>
        <circle r="5" fill="#3b82f6" filter="url(#glow5)">
          <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#f2g" /></animateMotion>
        </circle>
        <path id="f2g" d="M180,190 L240,195" fill="none" visibility="hidden" />

        {/* Lines: Gateway → ERPs */}
        {[110, 200, 290].map((ty, i) => (
          <g key={i}>
            <line x1="380" y1="195" x2="440" y2={ty} stroke={['#0070f3', '#22c55e', '#f97316'][i]} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7">
              <animate attributeName="strokeDashoffset" from="0" to="-14" dur="0.9s" repeatCount="indefinite" />
            </line>
            <circle r="4" fill={['#0070f3', '#22c55e', '#f97316'][i]} filter="url(#glow5)">
              <animateMotion dur={`${1 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.3}s`}>
                <mpath href={`#g2erp${i}`} />
              </animateMotion>
            </circle>
            <path id={`g2erp${i}`} d={`M380,195 L440,${ty}`} fill="none" visibility="hidden" />
          </g>
        ))}

        {/* Data flow labels */}
        <rect x="185" y="130" width="50" height="16" rx="4" fill="#1e1040" />
        <text x="210" y="141" textAnchor="middle" fill="#60a5fa" fontSize="7" fontFamily="monospace">JSON / API</text>

        <rect x="0" y="360" width="620" height="30" fill="#050d1a" opacity="0.7" />
        <text x="310" y="380" textAnchor="middle" fill="#a78bfa" fontSize="11" fontFamily="system-ui" fontWeight="bold">
          FactoryOS connects seamlessly to your existing ERP ecosystem
        </text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════
   SCENE 6 — Business Impact
════════════════════════════════════════════ */
function SceneImpact() {
  return (
    <div className="relative w-full bg-[#050d1a]" style={{ height: 390 }}>
      <SceneLabel>Scene 6 · Business Impact</SceneLabel>
      <svg viewBox="0 0 620 390" className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="glow6"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="impGreen" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#15803d" /><stop offset="100%" stopColor="#22c55e" /></linearGradient>
          <linearGradient id="impBlue" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#1d4ed8" /><stop offset="100%" stopColor="#60a5fa" /></linearGradient>
          <linearGradient id="impRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#7f1d1d" /></linearGradient>
        </defs>
        <rect width="620" height="390" fill="#050d1a" />

        {/* Metric 1 — Downtime ↓ */}
        <g>
          <rect x="30" y="60" width="130" height="160" rx="10" fill="#0f1f38" stroke="#ef4444" strokeWidth="1.5" />
          <text x="95" y="82" textAnchor="middle" fill="#f87171" fontSize="9" fontFamily="system-ui">Downtime</text>
          <text x="95" y="100" textAnchor="middle" fill="#f87171" fontSize="22" fontWeight="bold" fontFamily="system-ui" filter="url(#glow6)">↓ 45%</text>
          {/* Decreasing bars */}
          {[90, 72, 58, 44, 30].map((h, i) => (
            <rect key={i} x={40 + i * 22} y={185 - h} width="16" height={h} rx="2" fill="url(#impRed)" opacity={1 - i * 0.12}>
              <animate attributeName="height" values={`${h};${h - 5};${h}`} dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
              <animate attributeName="y" values={`${185 - h};${190 - h};${185 - h}`} dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
            </rect>
          ))}
          <text x="95" y="208" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="system-ui">Before → After FactoryOS</text>
        </g>

        {/* Metric 2 — Productivity ↑ */}
        <g>
          <rect x="180" y="60" width="130" height="160" rx="10" fill="#0f1f38" stroke="#22c55e" strokeWidth="1.5" />
          <text x="245" y="82" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="system-ui">Productivity</text>
          <text x="245" y="100" textAnchor="middle" fill="#4ade80" fontSize="22" fontWeight="bold" fontFamily="system-ui" filter="url(#glow6)">↑ 30%</text>
          {[44, 56, 62, 74, 88].map((h, i) => (
            <rect key={i} x={190 + i * 22} y={185 - h} width="16" height={h} rx="2" fill="url(#impGreen)" opacity={0.6 + i * 0.1}>
              <animate attributeName="height" values={`${h};${h + 5};${h}`} dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
              <animate attributeName="y" values={`${185 - h};${185 - h - 5};${185 - h}`} dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
            </rect>
          ))}
          <text x="245" y="208" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="system-ui">Before → After FactoryOS</text>
        </g>

        {/* Metric 3 — Quality ↑ */}
        <g>
          <rect x="330" y="60" width="130" height="160" rx="10" fill="#0f1f38" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="395" y="82" textAnchor="middle" fill="#c4b5fd" fontSize="9" fontFamily="system-ui">Quality Rate</text>
          <text x="395" y="100" textAnchor="middle" fill="#c4b5fd" fontSize="22" fontWeight="bold" fontFamily="system-ui" filter="url(#glow6)">↑ 18%</text>
          <polyline points="340,178 358,168 376,172 394,156 412,160 430,148 448,142" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="448" cy="142" r="5" fill="#8b5cf6" filter="url(#glow6)">
            <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite" />
          </circle>
          <rect x="338" y="180" width="114" height="25" rx="4" fill="#1e1040" />
          <text x="395" y="196" textAnchor="middle" fill="#7c3aed" fontSize="8" fontFamily="system-ui">Defect PPM: 850 → 480</text>
        </g>

        {/* Metric 4 — Energy ↓ */}
        <g>
          <rect x="480" y="60" width="110" height="160" rx="10" fill="#0f1f38" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="535" y="82" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="system-ui">Energy</text>
          <text x="535" y="100" textAnchor="middle" fill="#fbbf24" fontSize="20" fontWeight="bold" fontFamily="system-ui" filter="url(#glow6)">↓ 22%</text>
          {/* Energy gauge */}
          <circle cx="535" cy="152" r="36" fill="none" stroke="#1e1a10" strokeWidth="8" />
          <circle cx="535" cy="152" r="36" fill="none" stroke="#f59e0b" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 36 * 0.78} ${2 * Math.PI * 36}`}
            strokeDashoffset={2 * Math.PI * 36 * 0.25}
            strokeLinecap="round" transform="rotate(-90 535 152)"
          />
          <text x="535" y="155" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="system-ui">78%</text>
          <text x="535" y="167" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="system-ui">of target</text>
          <text x="535" y="198" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="system-ui">kWh monitored live</text>
        </g>

        {/* ROI headline */}
        <rect x="30" y="240" width="560" height="50" rx="10" fill="#0f2040" stroke="#3b82f6" strokeWidth="1" />
        <text x="310" y="262" textAnchor="middle" fill="#60a5fa" fontSize="13" fontFamily="system-ui" fontWeight="bold">
          Average ROI within 90 days of deployment
        </text>
        <text x="310" y="280" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="system-ui">
          Measured across OEE improvement, scrap reduction, and machine uptime gains
        </text>

        <rect x="0" y="360" width="620" height="30" fill="#050d1a" opacity="0.7" />
        <text x="310" y="380" textAnchor="middle" fill="#4ade80" fontSize="11" fontFamily="system-ui" fontWeight="bold">
          Real results. Measurable savings. From day one.
        </text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════
   SCENE 7 — Final Frame
════════════════════════════════════════════ */
function SceneFinal() {
  return (
    <div className="relative w-full bg-[#050d1a]" style={{ height: 390 }}>
      <svg viewBox="0 0 620 390" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="finalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a8a" /><stop offset="50%" stopColor="#4f46e5" /><stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <filter id="glow7"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="620" height="390" fill="url(#finalGrad)" />

        {/* Particle grid */}
        {[...Array(8)].map((_, row) =>
          [...Array(12)].map((_, col) => (
            <circle key={`${row}-${col}`} cx={26 + col * 52} cy={24 + row * 50} r="1.5" fill="white" opacity="0.08">
              <animate attributeName="opacity" values="0.08;0.2;0.08" dur={`${2 + (row + col) * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))
        )}

        {/* Big headline */}
        <text x="310" y="120" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="system-ui" filter="url(#glow7)">
          Smarter Factory.
        </text>
        <text x="310" y="158" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="system-ui">
          Real-Time Decisions.
        </text>
        <text x="310" y="196" textAnchor="middle" fill="#fbbf24" fontSize="22" fontWeight="bold" fontFamily="system-ui" filter="url(#glow7)">
          Higher Productivity.
        </text>

        {/* Divider */}
        <line x1="180" y1="218" x2="440" y2="218" stroke="white" strokeWidth="0.5" opacity="0.3" />

        {/* Logo block */}
        <rect x="240" y="234" width="140" height="50" rx="10" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="0.8" strokeOpacity="0.3" />
        <text x="310" y="256" textAnchor="middle" fill="white" fontSize="16" fontWeight="black" fontFamily="system-ui">
          Factory<tspan fill="#fbbf24">OS</tspan>
        </text>
        <text x="310" y="272" textAnchor="middle" fill="white" fontSize="9" fontFamily="system-ui" opacity="0.7">by Zipybills</text>

        {/* Three highlights */}
        {[
          { icon: '⚡', text: 'IIoT Ready', x: 100 },
          { icon: '☁️', text: 'Cloud + On-Prem', x: 310 },
          { icon: '📊', text: '13 Modules', x: 520 },
        ].map((h) => (
          <g key={h.text}>
            <text x={h.x} y="316" textAnchor="middle" fontSize="18">{h.icon}</text>
            <text x={h.x} y="335" textAnchor="middle" fill="white" fontSize="9" fontFamily="system-ui" opacity="0.8">{h.text}</text>
          </g>
        ))}

        {/* CTA */}
        <rect x="210" y="350" width="200" height="26" rx="13" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="0.8" strokeOpacity="0.4" />
        <text x="310" y="367" textAnchor="middle" fill="white" fontSize="10" fontFamily="system-ui" fontWeight="bold">
          factoryos.zipybills.com →
        </text>
      </svg>
    </div>
  );
}

/* ── Shared scene label chip ── */
function SceneLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-3 right-3 z-10 text-[9px] font-mono text-blue-400 bg-blue-950/60 border border-blue-800/40 rounded px-2 py-0.5">
      {children}
    </div>
  );
}

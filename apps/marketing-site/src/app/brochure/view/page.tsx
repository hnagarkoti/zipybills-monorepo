'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function BrochureViewPage() {
  useEffect(() => {
    document.title = 'FactoryOS Product Brochure — Zipybills';
  }, []);

  return (
    <>
      {/* Site Navbar (hidden in print) */}
      <div className="no-print">
        <Navbar />
      </div>

      {/* ── Print / Download bar (hidden on print) ── */}
      <div className="no-print sticky top-0 z-40 flex items-center justify-between gap-4 bg-gray-900/95 backdrop-blur-md text-white px-4 sm:px-6 py-3 text-sm border-b border-white/10">
        <Link href="/brochure" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Back to Brochure</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <span className="font-medium hidden sm:block">FactoryOS Product Brochure</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 transition-colors font-semibold text-xs sm:text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* ── Brochure Body ── */}
      <div className="brochure-root print:pt-0 bg-white min-h-screen font-sans text-gray-800">

        {/* ════ PAGE 1 — COVER ════ */}
        <div className="page cover-page relative flex flex-col items-center justify-center text-center px-6 sm:px-10 py-12 print:py-0 print:min-h-[297mm] bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#4c1d95] text-white overflow-hidden">
          <div className="absolute top-[-80px] right-[-80px] w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-[-60px] left-[-60px] w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-black">Z</div>
              <span className="text-xl font-black tracking-tight">Zipybills</span>
            </div>
            <div className="inline-block text-[10px] font-semibold tracking-widest uppercase text-blue-200 bg-white/10 rounded-full px-4 py-1.5 mb-6">
              Product Brochure · 2025
            </div>
            <h1 className="text-5xl sm:text-7xl font-black leading-none mb-4">
              Factory<span className="text-blue-300">OS</span>
            </h1>
            <p className="text-lg text-white/70 mt-4 max-w-lg mx-auto leading-relaxed">
              Digitalise Your Factory Floor. Measure What Matters. Scale Without Limits.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4 text-center">
              {[
                { value: '13+', label: 'Solution Modules' },
                { value: '4+', label: 'Industries Served' },
                { value: 'IIoT', label: 'Hardware Ready' },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 rounded-2xl p-4">
                  <div className="text-2xl sm:text-3xl font-black text-white">{s.value}</div>
                  <div className="text-[10px] text-white/60 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-white/40">
              <span>factoryos.zipybills.com</span>
              <span>contact@factoryos.in</span>
              <span>+91 98912 41863</span>
            </div>
          </div>
        </div>

        {/* ════ PAGE 2 — ABOUT + INDUSTRIES ════ */}
        <div className="page py-10 print:py-8 flex flex-col justify-center items-center border-t-4 border-blue-700 print:break-before-page print:min-h-[297mm]">
          <div className="w-full max-w-5xl px-6 sm:px-10 print:px-12">
            {/* About */}
            <SectionTag>Who We Are</SectionTag>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 mb-3">Built for Indian Manufacturing</h2>
            <p className="text-sm text-gray-600 max-w-4xl leading-relaxed mb-5">
              <strong className="text-gray-900">Zipybills</strong> builds <strong className="text-gray-900">FactoryOS</strong> — a unified platform bringing real-time visibility, quality control, and digital operations to factory floors of all sizes. From automotive ancillaries to FMCG lines, we help manufacturers reduce waste, eliminate paper, and compete globally.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { icon: '🏭', title: 'Industry Focus', desc: 'Automotive, Electronics, FMCG, Pharma' },
                { icon: '🇮🇳', title: 'Made for India', desc: 'Designed for Indian workflows & scale' },
                { icon: '☁️', title: 'Cloud & On-Premise', desc: 'Zipybills cloud or your own servers' },
                { icon: '🔌', title: 'IIoT Ready', desc: 'Connects to PLCs, sensors, MES/ERP' },
              ].map((c) => (
                <div key={c.title} className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xl">{c.icon}</span>
                  <div className="font-bold text-gray-900 text-xs">{c.title}</div>
                  <div className="text-[11px] text-gray-500">{c.desc}</div>
                </div>
              ))}
            </div>

            {/* Industries */}
            <SectionTag>Industries Served</SectionTag>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 mb-4">Trusted Across Sectors</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { icon: '🚗', name: 'Automotive & Ancillary', desc: 'Traceability, CTQ, APQP quality checksheets' },
                { icon: '⚙️', name: 'Precision Engineering', desc: 'Tool management, downtime, dimension tracking' },
                { icon: '💊', name: 'Pharmaceuticals', desc: 'Batch traceability, GMP checksheets, audit trails' },
                { icon: '📱', name: 'Electronics Assembly', desc: 'Guided assembly, defect capture, work instructions' },
                { icon: '🍪', name: 'FMCG & Packaging', desc: 'Line speed monitoring, waste tracking, OEE' },
                { icon: '🔩', name: 'Metal Fabrication', desc: 'Energy monitoring, machine uptime, production logs' },
              ].map((ind) => (
                <div key={ind.name} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex gap-3 items-start">
                  <span className="text-xl shrink-0">{ind.icon}</span>
                  <div>
                    <div className="font-bold text-gray-900 text-xs">{ind.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{ind.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 p-4 text-white grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><div className="font-bold text-sm">☁️ Cloud (SaaS)</div><div className="text-xs text-white/80 mt-1">Start in minutes. Secure Indian cloud. Auto-updates, zero maintenance.</div></div>
              <div><div className="font-bold text-sm">🏢 On-Premise</div><div className="text-xs text-white/80 mt-1">Deploy on your own servers. Full data sovereignty, no external dependencies.</div></div>
            </div>
          </div>
        </div>

        {/* ════ PAGE 3 — 13 SOLUTIONS ════ */}
        <div className="page py-8 print:py-6 flex flex-col justify-center items-center border-t-4 border-violet-600 print:break-before-page print:min-h-[297mm]">
          <div className="w-full max-w-5xl px-6 sm:px-10 print:px-12">
            <SectionTag>Our Solutions</SectionTag>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 mb-5">13 Modules. One Platform.</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SOLUTIONS.map((s, i) => (
                <SolutionCard key={s.title} index={i + 1} {...s} />
              ))}
            </div>
          </div>
        </div>

        {/* ════ PAGE 4 — WHY FACTORYOS + PRICING ════ */}
        <div className="page py-8 print:py-6 flex flex-col justify-center items-center border-t-4 border-emerald-600 print:break-before-page print:min-h-[297mm]">
          <div className="w-full max-w-5xl px-6 sm:px-10 print:px-12">
            {/* Why FactoryOS */}
            <SectionTag>Why FactoryOS</SectionTag>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 mb-4">Results That Speak for Themselves</h2>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { value: '30%', color: 'text-blue-600', label: 'OEE Improvement', desc: 'Within 90 days of go-live' },
                { value: '60%', color: 'text-violet-600', label: 'Less Paper Reports', desc: 'Fully digital operations' },
                { value: '4×', color: 'text-emerald-600', label: 'Faster Defect Detection', desc: 'Real-time vs end-of-shift' },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                  <div className={`text-3xl sm:text-4xl font-black ${m.color}`}>{m.value}</div>
                  <div className="font-bold text-gray-900 text-xs mt-1">{m.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{m.desc}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-7">
              {[
                'No-code config — go live in days, not months',
                'Offline-first mobile app — works without internet',
                'Role-based access for operators, supervisors & management',
                'Real-time alerts via WhatsApp, email & in-app',
                'Full data ownership — export everything anytime',
                'SOC 2 aligned security, AES-256 encryption at rest',
              ].map((b) => (
                <div key={b} className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-gray-700">{b}</span>
                </div>
              ))}
            </div>

            {/* Free Pilot CTA */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 p-6 text-white text-center">
              <div className="text-xl sm:text-2xl font-black mb-2">🚀 Free to Get Started</div>
              <p className="text-sm text-blue-100 mb-4 max-w-xl mx-auto">No upfront cost. No per-seat surprises. We configure FactoryOS for your specific factory and workflows — you only commit when you&apos;re ready.</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['Free pilot deployment', 'No credit card required', 'Dedicated onboarding'].map((item) => (
                  <div key={item} className="bg-white/15 rounded-xl px-3 py-2 text-xs font-bold">✓ {item}</div>
                ))}
              </div>
              <p className="text-xs text-blue-200">Reach us at <span className="font-semibold">contact@factoryos.in</span> to begin your free pilot today</p>
            </div>
          </div>
        </div>

        {/* ════ PAGE 5 — CONTACT / BACK COVER ════ */}
        <div className="page relative flex flex-col items-center justify-center text-center px-6 sm:px-10 py-16 print:py-0 print:min-h-[297mm] bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#4c1d95] text-white overflow-hidden print:break-before-page">
          <div className="absolute top-[-80px] left-[-80px] w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-[-60px] right-[-60px] w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-black">Z</div>
              <span className="text-xl font-black tracking-tight">Zipybills</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Ready to Digitise Your Factory?</h2>
            <p className="text-white/70 text-base mb-10 leading-relaxed">
              Start your free 14-day trial or book a personalised demo. Our team will onboard your first factory in under 5 minutes.
            </p>
            <div className="grid grid-cols-1 gap-3 text-left max-w-xs mx-auto">
              {[
                { icon: '🌐', label: 'Website', value: 'factoryos.zipybills.com' },
                { icon: '📧', label: 'Email', value: 'contact@factoryos.in' },
                { icon: '📞', label: 'Phone / WhatsApp', value: '+91 98912 41863' },
                { icon: '📱', label: 'Alternate Phone', value: '+91 98115 64873' },
                { icon: '🇮🇳', label: 'Location', value: 'India' },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-4 bg-white/10 rounded-xl px-4 py-2.5">
                  <span className="text-lg">{c.icon}</span>
                  <div>
                    <div className="text-[10px] text-white/50">{c.label}</div>
                    <div className="text-xs font-semibold text-white">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-xs text-white/30">
              © 2025 Zipybills. All rights reserved. FactoryOS is a registered product of Zipybills.
            </div>
          </div>
        </div>

      </div>

      {/* Site Footer (hidden in print) */}
      <div className="no-print">
        <Footer />
      </div>

      {/* ── Print styles injected via style tag ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .brochure-root { padding-top: 0 !important; }
          .page { page-break-after: always; break-after: page; }
          .page:last-child { page-break-after: avoid; break-after: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { size: A4; margin: 0; }
      `}</style>
    </>
  );
}
/* ── Sub-components ── */

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-4 py-1">
      {children}
    </span>
  );
}

function SolutionCard({ index, title, desc, emoji }: { index: number; title: string; desc: string; emoji: string }) {
  return (
    <div className="flex gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100">
      <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
        {String(index).padStart(2, '0')}
      </div>
      <div>
        <div className="font-bold text-gray-900 text-sm">{emoji} {title}</div>
        <div className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

const SOLUTIONS = [
  {
    emoji: '🔍',
    title: 'Traceability',
    desc: 'End-to-end part and batch traceability — from raw material to finished goods. Instant recall and audit trail.',
  },
  {
    emoji: '📋',
    title: 'Digital Work Instructions',
    desc: 'Replace paper SOPs with interactive, multimedia work instructions delivered to operator touchscreens.',
  },
  {
    emoji: '🔧',
    title: 'Guided Assembly',
    desc: 'Step-by-step visual guidance with error-proofing — reduce operator errors and improve first-time quality.',
  },
  {
    emoji: '✅',
    title: 'Digital Checksheets',
    desc: 'Replace paper inspection sheets with dynamic digital forms. Auto-escalate failures to supervisors.',
  },
  {
    emoji: '📐',
    title: 'CTP Management',
    desc: 'Define and monitor Critical-to-Process parameters. Alert operators when values go out of control.',
  },
  {
    emoji: '🎯',
    title: 'CTQ Management',
    desc: 'Track Critical-to-Quality characteristics at every step. Statistical process control built-in.',
  },
  {
    emoji: '⚡',
    title: 'Energy Management',
    desc: 'Monitor machine-level energy consumption. Identify idle draw, reduce utility costs, hit sustainability targets.',
  },
  {
    emoji: '📉',
    title: 'Digital Downtime Log Books',
    desc: 'Capture downtime events in real time with category, duration, and root cause. Replace paper shift logs forever.',
  },
  {
    emoji: '📡',
    title: 'IIoT Solutions',
    desc: 'Connect legacy machines and new PLCs via our IIoT gateway. No hardware changes needed in most cases.',
  },
  {
    emoji: '☁️',
    title: 'Cloud & On-Premise Deployment',
    desc: 'Run FactoryOS on Zipybills cloud or inside your own network. Full flexibility, same features.',
  },
  {
    emoji: '🛠️',
    title: 'Dedicated Tailored Fit',
    desc: 'Our team configures FactoryOS specifically for your products, workflows, and reporting requirements.',
  },
  {
    emoji: '🔩',
    title: 'Tools Management',
    desc: 'Track tool life, calibration schedules, and maintenance due dates. Prevent unplanned breakdowns.',
  },
  {
    emoji: '🏷️',
    title: 'Traceability Implementation',
    desc: 'Barcode and QR-based traceability implementation service — hardware, software, and process setup included.',
  },
];

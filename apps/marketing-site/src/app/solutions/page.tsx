import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowRight, CheckCircle2, FileText, Wrench,
  Activity, Zap, Cpu, Shield, Clock, Search,
  Layers, BookOpen, Settings, Cloud, PenTool,
  BatteryCharging, CircuitBoard, Factory, Cog,
  BarChart3, TrendingUp,
} from 'lucide-react';

/* ─── 13 Detailed Solution Capabilities ──────── */
const SOLUTIONS = [
  {
    id: 'traceability',
    title: 'Traceability',
    subtitle: 'Full product genealogy',
    desc: 'Track the complete journey of every product and component — from raw material receipt through every process step to dispatch. Know exactly what went into every finished product, which machine processed it, which operator handled it, and when. Essential for recall management, customer complaints, and regulatory compliance.',
    icon: Search,
    accent: 'from-blue-500 to-cyan-500',
    accentBg: 'bg-blue-500',
    features: [
      'Barcode / QR code based tracking',
      'Raw material to finished goods genealogy',
      'Machine, operator & timestamp linkage',
      'Batch & serial number management',
      'Instant recall trace-back',
      'Customer complaint part history',
    ],
  },
  {
    id: 'digital-work-instructions',
    title: 'Digital Work Instructions',
    subtitle: 'Replace paper SOPs',
    desc: 'Interactive, multimedia work instructions displayed at operator stations. Replace outdated paper manuals with step-by-step visual guides that include photos, videos, and annotations. Ensure every operator follows the same process, reduce training time for new staff, and eliminate errors from reading outdated documents.',
    icon: FileText,
    accent: 'from-amber-500 to-orange-500',
    accentBg: 'bg-amber-500',
    features: [
      'Step-by-step visual instructions',
      'Photo, video & annotation support',
      'Version control & approval workflow',
      'Operator acknowledgment tracking',
      'Multi-language support',
      'Offline-capable (works without internet)',
    ],
  },
  {
    id: 'guided-assembly',
    title: 'Guided Assembly',
    subtitle: 'Error-proof complex builds',
    desc: 'Visual step-by-step guidance for complex assembly operations. Built-in poka-yoke prevents operators from skipping steps or using wrong components. Each step is validated before the system allows moving to the next — ensuring first-pass quality and eliminating assembly errors that lead to rework and warranty claims.',
    icon: Layers,
    accent: 'from-violet-500 to-purple-500',
    accentBg: 'bg-violet-500',
    features: [
      'Step-by-step guided assembly flow',
      'Poka-yoke integration & validation',
      'Torque verification at each step',
      'Component scanning & validation',
      'Per-step assembly time tracking',
      'First-pass yield monitoring',
    ],
  },
  {
    id: 'digital-checksheets',
    title: 'Digital Checksheets & Work Instructions',
    subtitle: 'Digitize quality checks',
    desc: 'Replace paper-based quality inspection forms with digital checksheets that auto-validate entries against specifications. Inspectors select parameters, enter readings, and the system instantly flags out-of-spec values. All data is stored digitally for trend analysis, audit trails, and compliance reporting — no more lost paper forms.',
    icon: BookOpen,
    accent: 'from-emerald-500 to-green-500',
    accentBg: 'bg-emerald-500',
    features: [
      'Digital inspection checksheets',
      'Auto-validation against specifications',
      'Photo attachment for defect evidence',
      'Real-time out-of-spec alerts',
      'Trend analysis on inspection data',
      'Audit-ready digital records',
    ],
  },
  {
    id: 'ctp-management',
    title: 'Online CTP Management System',
    subtitle: 'Critical-to-Process monitoring',
    desc: 'Monitor and control Critical-to-Process parameters in real-time. CTP parameters are process variables (temperature, pressure, speed, feed rate) that directly impact product quality. The system continuously tracks these parameters, alerts when they drift out of specification, and logs all data for process capability analysis.',
    icon: Settings,
    accent: 'from-rose-500 to-pink-500',
    accentBg: 'bg-rose-500',
    features: [
      'Real-time process parameter monitoring',
      'Temperature, pressure, speed tracking',
      'Automated drift & out-of-spec alerts',
      'Process capability studies (Cp/Cpk)',
      'Parameter trend visualization',
      'Compliance reporting for audits',
    ],
  },
  {
    id: 'ctq-management',
    title: 'Online CTQ Management System',
    subtitle: 'Critical-to-Quality tracking',
    desc: 'Critical-to-Quality parameters are product characteristics that must meet specifications for the customer. This system monitors CTQ parameters with Statistical Process Control (SPC) charts, calculates Cp/Cpk indices, and triggers automated alerts when quality drifts. Ensure zero-defect manufacturing with data-driven quality control.',
    icon: Shield,
    accent: 'from-teal-500 to-cyan-500',
    accentBg: 'bg-teal-500',
    features: [
      'SPC charts (X-bar, R, S charts)',
      'Cp/Cpk process capability indices',
      'Automated out-of-spec alerts',
      'Reject tracking & analysis',
      'CAPA (corrective action) integration',
      'Customer-wise quality reporting',
    ],
  },
  {
    id: 'energy-management',
    title: 'Online Energy Management System',
    subtitle: 'Optimize energy costs',
    desc: 'Monitor electricity, gas, water, and compressed air consumption across your entire factory in real-time. Identify energy waste, track consumption patterns by machine, line, or shift, and generate cost analytics. Supports sustainability reporting and helps reduce your factory\'s carbon footprint while cutting operational costs.',
    icon: BatteryCharging,
    accent: 'from-lime-500 to-green-500',
    accentBg: 'bg-lime-500',
    features: [
      'Real-time energy consumption monitoring',
      'Electricity, gas, water & air tracking',
      'Per-machine & per-line cost analysis',
      'Peak demand identification',
      'Sustainability & carbon reporting',
      'Energy-per-unit-produced KPI',
    ],
  },
  {
    id: 'downtime-logbooks',
    title: 'Digital Downtime Log Books',
    subtitle: 'Eliminate stoppage losses',
    desc: 'Automatically detect and capture every machine downtime event — no more relying on operators to remember and manually log stoppages. The system categorizes downtime by reason codes (breakdown, changeover, no material, etc.), calculates MTBF and MTTR, and generates Pareto charts to focus improvement efforts on the biggest losses.',
    icon: Clock,
    accent: 'from-red-500 to-rose-500',
    accentBg: 'bg-red-500',
    features: [
      'Automatic downtime detection via IoT',
      'Reason code categorization',
      'Planned vs unplanned separation',
      'Pareto analysis by reason & machine',
      'MTBF & MTTR calculations',
      'Maintenance request auto-trigger',
    ],
  },
  {
    id: 'iiot-solutions',
    title: 'IIoT Based Solutions',
    subtitle: 'Connect your machines',
    desc: 'Industrial Internet of Things integration that connects your existing PLCs, sensors, HMIs, and machines to our platform. We work with all major PLC brands (Siemens, Allen Bradley, Mitsubishi, Delta, etc.) and support protocols like Modbus, OPC-UA, and MQTT. No rip-and-replace required — we integrate with what you already have.',
    icon: CircuitBoard,
    accent: 'from-indigo-500 to-blue-500',
    accentBg: 'bg-indigo-500',
    features: [
      'PLC integration (Siemens, AB, Mitsubishi)',
      'Sensor & HMI data acquisition',
      'Modbus, OPC-UA, MQTT protocols',
      'Edge computing gateways',
      'Real-time data from shop floor',
      'Works with existing equipment',
    ],
  },
  {
    id: 'cloud-onpremise',
    title: 'Optional Cloud / On-Premise',
    subtitle: 'Your infrastructure, your choice',
    desc: 'Deploy FactoryOS wherever your organization feels comfortable. Choose cloud for easy access from anywhere with zero infrastructure maintenance, or on-premise for complete data sovereignty and compliance with internal IT policies. Both options deliver the same powerful feature set — you choose the deployment model that fits your needs.',
    icon: Cloud,
    accent: 'from-sky-500 to-blue-500',
    accentBg: 'bg-sky-500',
    features: [
      'Cloud deployment (AWS / Azure)',
      'On-premise server installation',
      'Hybrid mode available',
      'Same features on both platforms',
      'Data sovereignty guaranteed',
      'Zero infrastructure maintenance (cloud)',
    ],
  },
  {
    id: 'tailored-fit',
    title: 'Dedicated Tailored Fit',
    subtitle: 'Built around your process',
    desc: 'We don\'t force your manufacturing processes into a rigid software structure. Instead, we tailor every deployment to match your specific workflows, terminology, reporting formats, and approval hierarchies. Whether you\'re a die-casting plant, an automotive Tier-1, or an appliance assembly line — we customize the platform to fit like a glove.',
    icon: PenTool,
    accent: 'from-fuchsia-500 to-purple-500',
    accentBg: 'bg-fuchsia-500',
    features: [
      'Custom workflow configuration',
      'Industry-specific terminology',
      'Custom report templates',
      'Role-based approval hierarchies',
      'Process-specific dashboards',
      'Integration with your ERP/MES',
    ],
  },
  {
    id: 'tools-management',
    title: 'Tools Management System',
    subtitle: 'Full tool lifecycle control',
    desc: 'Track every tool in your factory from procurement to disposal. Monitor tool usage, schedule calibrations, track maintenance history, and plan replacements proactively. Know exactly which tools are on which machines, their remaining life, and when they need service — preventing both unexpected breakdowns and unnecessary early replacements.',
    icon: Wrench,
    accent: 'from-orange-500 to-red-500',
    accentBg: 'bg-orange-500',
    features: [
      'Complete tool inventory management',
      'Usage tracking per machine & job',
      'Calibration scheduling & alerts',
      'Maintenance history log',
      'Tool life prediction',
      'Replacement planning & procurement',
    ],
  },
  {
    id: 'traceability-implementation',
    title: 'Traceability Implementation',
    subtitle: 'Managed deployment service',
    desc: 'Don\'t just get software — get a complete traceability implementation managed by our expert team. We handle everything from initial assessment, barcode/RFID strategy, label design, scanner selection, station layout planning, software configuration, operator training, and go-live support. A turnkey solution that gets you compliant and operational quickly.',
    icon: Activity,
    accent: 'from-purple-500 to-indigo-500',
    accentBg: 'bg-purple-500',
    features: [
      'Factory assessment & gap analysis',
      'Barcode / RFID strategy planning',
      'Hardware selection & procurement',
      'Software configuration & testing',
      'Operator & supervisor training',
      'Go-live support & handover',
    ],
  },
];

const WHY_CHOOSE = [
  { icon: Zap, title: 'Quick ROI', desc: 'See results within weeks. Most customers report 15-30% OEE improvement in the first quarter.' },
  { icon: Cog, title: 'Deeply Customizable', desc: 'Tailored to your manufacturing process. We adapt to your workflows, not the other way around.' },
  { icon: Cpu, title: 'Easy to Adopt', desc: 'Intuitive interface designed for operators. Minimal training. Works on tablets, phones & desktops.' },
  { icon: TrendingUp, title: 'Scalable', desc: 'Start with 2 machines, scale to 2,000. Our architecture grows alongside your factory.' },
];

export default function SolutionsPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden mesh-gradient">
        <div className="absolute top-20 right-[5%] w-80 h-80 rounded-full bg-accent-100/30 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-brand-100 shadow-sm text-sm font-medium text-brand-700 mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            13 Solution Capabilities
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 text-balance">
            Complete <span className="gradient-text">Manufacturing Digitization</span> Suite
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
            From traceability and quality management to IIoT integration and energy monitoring —
            everything you need to bring Industry 4.0 to your shop floor.
          </p>
        </div>
      </section>

      {/* Solutions List */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {SOLUTIONS.map((sol, idx) => (
            <div
              key={sol.id}
              id={sol.id}
              className="scroll-mt-24"
            >
              <div className={`grid lg:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? '' : ''}`}>
                {/* Content side */}
                <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${sol.accent}`}>
                      <sol.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-300 tabular-nums">
                      {String(idx + 1).padStart(2, '0')} / 13
                    </span>
                  </div>
                  <span className="text-sm font-medium text-brand-600">{sol.subtitle}</span>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">{sol.title}</h2>
                  <p className="mt-4 text-gray-600 leading-relaxed">{sol.desc}</p>
                  <div className="mt-6 grid sm:grid-cols-2 gap-3">
                    {sol.features.map((f) => (
                      <div key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-600">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual card */}
                <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className={`rounded-2xl bg-gradient-to-br ${sol.accent} p-[2px]`}>
                    <div className="rounded-[14px] bg-gray-950 p-8 min-h-[320px] flex flex-col items-center justify-center text-center relative overflow-hidden">
                      {/* Background decoration */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${sol.accent} opacity-5`} />
                      <div className="relative z-10">
                        <sol.icon className="w-16 h-16 text-white/15 mb-4 mx-auto" />
                        <div className="text-white/70 text-sm font-semibold mb-1">{sol.title}</div>
                        <div className="text-white/40 text-xs mb-6">{sol.subtitle}</div>
                        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mx-auto">
                          {sol.features.slice(0, 4).map((f, i) => (
                            <div key={i} className="rounded-lg bg-white/5 border border-white/5 px-3 py-2.5">
                              <div className="text-[11px] text-white/50 leading-tight">{f}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              {idx < SOLUTIONS.length - 1 && (
                <div className="mt-20 border-b border-gray-100" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Why Choose <span className="gradient-text">FactoryOS?</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_CHOOSE.map((w) => (
              <div key={w.title} className="card-hover text-center rounded-2xl border border-gray-100 bg-white p-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 mb-5">
                  <w.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{w.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-8">Jump to a Solution</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {SOLUTIONS.map((sol, i) => (
              <a
                key={sol.id}
                href={`#${sol.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              >
                <span className="text-[10px] font-bold text-gray-300">{String(i + 1).padStart(2, '0')}</span>
                {sol.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animated-gradient rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/3" />
            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold mb-4">
                Ready to See It in Action?
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Start your free trial today or talk to our team for a personalized demo
                tailored to your specific manufacturing processes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold hover:bg-gray-50 transition-colors shadow-xl"
                >
                  Start Free Trial <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  Request Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

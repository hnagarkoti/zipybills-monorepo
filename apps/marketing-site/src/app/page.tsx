import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import IIoTFlowAnimation from '@/components/IIoTFlowAnimation';

// Dynamic import keeps the heavy SVG animation out of the initial JS bundle
// — improves LCP and Core Web Vitals score on Indian mobile connections
const HeroAnimation = dynamic(() => import('@/components/HeroAnimation'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl bg-[#050d1a] animate-pulse" style={{ minHeight: 420 }} />
  ),
});
import {
  Factory, BarChart3, Shield, Clock, Zap, Users, CheckCircle2,
  ArrowRight, Monitor, Cog, TrendingUp, Globe, Award, Cpu,
  ChevronRight, Sparkles, Star, FileText, Layers, Gauge,
  Activity, Wrench, Cloud, Settings, Search, BookOpen,
  BatteryCharging, Radio, CircuitBoard, PenTool,
} from 'lucide-react';

/* ─── Stats ─────────────────────────────────── */
const STATS = [
  { value: '13', label: 'Solution Modules', icon: Cpu },
  { value: '4+', label: 'Industries Served', icon: Factory },
  { value: '99.9%', label: 'Uptime SLA', icon: Shield },
  { value: '30%', label: 'Avg. OEE Improvement', icon: TrendingUp },
];

/* ─── 13 Solution Capabilities ──────────────── */
const SOLUTIONS = [
  {
    icon: Search,
    title: 'Traceability',
    desc: 'Track origin, process, and destination of every product and component end-to-end — from raw material receipt through production to dispatch.',
    accent: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: FileText,
    title: 'Digital Work Instructions',
    desc: 'Interactive multimedia work instructions at operator stations. Replace paper SOPs with step-by-step visual guides and video tutorials.',
    accent: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    icon: Layers,
    title: 'Guided Assembly',
    desc: 'Visual step-by-step guidance for complex assembly operations with poka-yoke integration to prevent errors and ensure consistency.',
    accent: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    icon: BookOpen,
    title: 'Digital Checksheets',
    desc: 'Replace manual paper inspection forms with digital quality checksheets. Capture data in real-time with auto-validation and alerts.',
    accent: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Settings,
    title: 'CTP Management System',
    desc: 'Online Critical-to-Process parameter monitoring. Ensure every process parameter stays within specification with real-time alerts.',
    accent: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    icon: Shield,
    title: 'CTQ Management System',
    desc: 'Online Critical-to-Quality tracking with SPC charts, Cp/Cpk analysis, automated out-of-spec alerts and compliance reporting.',
    accent: 'from-teal-500 to-cyan-500',
    bg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    icon: BatteryCharging,
    title: 'Energy Management System',
    desc: 'Monitor and optimize energy consumption across your entire factory. Real-time energy data, cost analysis and sustainability reporting.',
    accent: 'from-lime-500 to-green-500',
    bg: 'bg-lime-50',
    iconColor: 'text-lime-600',
  },
  {
    icon: Clock,
    title: 'Digital Downtime Log Books',
    desc: 'Automatic digital capture and categorization of every downtime event. Pareto analysis and MTBF/MTTR calculations for root cause elimination.',
    accent: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  {
    icon: CircuitBoard,
    title: 'IIoT Based Solutions',
    desc: 'Industrial IoT integration with PLCs, sensors, HMIs and machines. Real-time data acquisition directly from your shop floor equipment.',
    accent: 'from-indigo-500 to-blue-500',
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  {
    icon: Cloud,
    title: 'Cloud / On-Premise',
    desc: 'Deploy wherever you prefer — cloud for accessibility or on-premise for full data control. Same powerful features, your choice of infrastructure.',
    accent: 'from-sky-500 to-blue-500',
    bg: 'bg-sky-50',
    iconColor: 'text-sky-600',
  },
  {
    icon: PenTool,
    title: 'Dedicated Tailored Fit',
    desc: 'No one-size-fits-all. We customize every deployment to your specific manufacturing processes, workflows and reporting requirements.',
    accent: 'from-fuchsia-500 to-purple-500',
    bg: 'bg-fuchsia-50',
    iconColor: 'text-fuchsia-600',
  },
  {
    icon: Wrench,
    title: 'Tools Management System',
    desc: 'Full tool lifecycle management — track usage, calibration schedules, maintenance history and replacement planning across all your lines.',
    accent: 'from-orange-500 to-red-500',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  {
    icon: Activity,
    title: 'Traceability Implementation',
    desc: 'End-to-end traceability implementation as a managed service. From assessment and planning to barcode/RFID deployment and go-live support.',
    accent: 'from-purple-500 to-indigo-500',
    bg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
];

/* ─── Industries ────────────────────────────── */
const INDUSTRIES = [
  { name: 'Automotive', icon: Cog, desc: 'Tier-1 & Tier-2 suppliers' },
  { name: 'Appliances', icon: Cpu, desc: 'Consumer electronics' },
  { name: 'FMCG', icon: Globe, desc: 'Fast-moving goods' },
  { name: 'Electronics', icon: Zap, desc: 'PCB & Assembly' },
  { name: 'Pharma', icon: Shield, desc: 'GMP compliant' },
  { name: 'Die Casting', icon: Factory, desc: 'Metal fabrication' },
];

/* ─── Testimonials ──────────────────────────── */
const TESTIMONIALS = [
  {
    quote: 'With FactoryOS, I can quickly take the right decisions with automated data and reports. I can keep an eye on what is happening even from home. A big thumbs up!',
    title: 'Welding Shop Production Head',
    company: 'Tier-1 Supplier, Maruti',
    initials: 'WS',
  },
  {
    quote: 'FactoryOS is a game changer. It reduced our unnecessary paperwork and managed our time & efforts on analysis and CAPA rather than data collection.',
    title: 'Senior Manager Production',
    company: 'Die-Casting Industry',
    initials: 'SM',
  },
  {
    quote: 'Going from spreadsheets to real-time dashboards improved our OEE by 22% in the first quarter. The ROI was immediate.',
    title: 'Plant Manager',
    company: 'Appliance Manufacturer',
    initials: 'PM',
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ─── Hero Section ─────────────────────── */}
      <section className="relative pt-24 pb-20 overflow-hidden mesh-gradient min-h-[90vh] flex items-center">
        {/* Decorative orbs */}
        <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full bg-brand-200/30 blur-3xl animate-float" />
        <div className="absolute bottom-10 left-[5%] w-64 h-64 rounded-full bg-accent-200/20 blur-3xl animate-float-delay" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-brand-100 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
                </span>
                <span className="text-sm font-medium text-brand-700">Industry 4.0 Manufacturing Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-balance">
                Your Complete{' '}
                <span className="gradient-text">Digital Factory</span>
                {' '}Operating System
              </h1>

              <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
                13 powerful solutions to digitize your shop floor — from traceability and
                quality management to IIoT and energy monitoring.
                Built for Indian manufacturers who demand flexibility.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-semibold text-base hover:shadow-xl hover:shadow-brand-500/25 transition-all"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/solutions"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold text-base hover:border-brand-300 hover:text-brand-600 transition-colors shadow-sm"
                >
                  Explore 13 Solutions
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                {['14-day free trial', 'No credit card', 'Setup in 5 min', 'Cloud + On-Prem'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-gray-500">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero visual — Animated factory journey */}
            <div className="relative hidden lg:block pb-8">
              <HeroAnimation />
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-xl animate-float-slow z-10">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-3 px-4 py-2 rounded-xl bg-white shadow-lg border border-gray-100 flex items-center gap-2 animate-float-delay z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">OEE Improved</div>
                  <div className="text-sm font-bold text-emerald-600">+22%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────── */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <stat.icon className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 13 Solutions Showcase ─────────────── */}
      <section id="solutions" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Complete Solution Suite</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center text-balance mb-4">
            13 Powerful Solutions for Your{' '}
            <span className="gradient-text">Digital Factory</span>
          </h2>
          <p className="text-lg text-gray-500 text-center max-w-3xl mx-auto mb-16">
            From the shop floor to the board room — everything you need to digitize,
            monitor, and continuously improve your manufacturing operations.
          </p>

          {/* Solution Cards — staggered grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SOLUTIONS.map((sol, i) => (
              <div
                key={sol.title}
                className="group card-hover rounded-2xl border border-gray-100 bg-white p-7 relative overflow-hidden"
              >
                {/* Number badge */}
                <div className="absolute top-5 right-5 text-[11px] font-bold text-gray-200 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </div>

                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${sol.bg} mb-5`}>
                  <sol.icon className={`w-6 h-6 ${sol.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{sol.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{sol.desc}</p>

                {/* Bottom accent bar on hover */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${sol.accent} scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500`} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/solutions"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-brand-200 text-brand-600 font-semibold hover:bg-brand-50 transition-colors"
            >
              View Detailed Solutions
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How It Works — IIoT Animation ───── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">How It Works</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
              Factory Floor to Dashboard —{' '}
              <span className="gradient-text">In Under a Second</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
              No manual data entry. No shift-end reports. FactoryOS captures machine data in real time
              via our IIoT gateway and shows it live on any screen across your organisation.
            </p>
          </div>

          {/* Animated IIoT Illustration */}
          <IIoTFlowAnimation />

          {/* 4-step cards */}
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: '🔌',
                title: 'Connect Machines',
                desc: 'Our IIoT gateway plugs into any PLC, sensor, or legacy machine. No rewiring, no downtime during setup.',
                color: 'from-blue-500 to-blue-600',
              },
              {
                step: '02',
                icon: '📡',
                title: 'Data Streams Live',
                desc: 'Cycle times, temperatures, vibration, energy — all captured and transmitted in under a second.',
                color: 'from-violet-500 to-violet-600',
              },
              {
                step: '03',
                icon: '☁️',
                title: 'Secure Cloud Processing',
                desc: 'Data lands on enterprise-grade infrastructure. Validated, stored, and available anywhere, instantly.',
                color: 'from-cyan-500 to-cyan-600',
              },
              {
                step: '04',
                icon: '📊',
                title: 'Act on Real-Time Insights',
                desc: 'Operators see it on the floor. Managers see it on their phones. Everyone acts faster.',
                color: 'from-emerald-500 to-emerald-600',
              },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl bg-gray-50 border border-gray-100 p-7 card-hover-subtle group overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-gradient-to-b ${s.color}`} />
                <div className="text-xs font-black text-gray-300 mb-3 tracking-widest">{s.step}</div>
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why FactoryOS — Differentiators ──── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Content */}
            <div>
              <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Why FactoryOS</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900 text-balance">
                Not just software.{' '}
                <span className="gradient-text">A manufacturing partner.</span>
              </h2>
              <p className="mt-6 text-gray-600 leading-relaxed">
                We don&apos;t force your processes into our software. We tailor our platform to fit
                your specific workflows — because every factory is different.
              </p>

              <div className="mt-10 space-y-6">
                {[
                  {
                    icon: PenTool,
                    title: 'Tailored to Your Process',
                    desc: 'Custom workflows, parameters, and reports built around how your factory actually operates.',
                  },
                  {
                    icon: Cloud,
                    title: 'Cloud or On-Premise — You Choose',
                    desc: 'Full flexibility. Same powerful features whether deployed on cloud or inside your own data center.',
                  },
                  {
                    icon: CircuitBoard,
                    title: 'Works with Your Equipment',
                    desc: 'Integrates with existing PLCs, sensors, HMIs and machines. No rip-and-replace required.',
                  },
                  {
                    icon: Zap,
                    title: 'ROI in Weeks, Not Months',
                    desc: 'Customers report 15-30% OEE improvement within the first quarter of deployment.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Visual metrics */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm card-hover-subtle">
                    <div className="text-3xl font-extrabold text-brand-600">30%</div>
                    <div className="text-sm text-gray-500 mt-1">Average OEE improvement</div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 p-6 text-white shadow-lg">
                    <div className="text-3xl font-extrabold">IIoT</div>
                    <div className="text-sm text-white/70 mt-1">Ready — any PLC or sensor</div>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm card-hover-subtle">
                    <div className="text-3xl font-extrabold text-emerald-600">99.9%</div>
                    <div className="text-sm text-gray-500 mt-1">Platform uptime SLA</div>
                  </div>
                  <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm card-hover-subtle">
                    <div className="text-3xl font-extrabold text-gray-900">14</div>
                    <div className="text-sm text-gray-500 mt-1">Day free trial, no card needed</div>
                  </div>
                </div>
              </div>
              {/* Decorative */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-brand-50 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Industries ───────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Trusted Across <span className="gradient-text">Industries</span>
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              From automotive OEMs to FMCG plants, FactoryOS adapts to your specific
              manufacturing processes and compliance requirements.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.name}
                className="card-hover-subtle flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <ind.icon className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">{ind.name}</span>
                  <p className="text-[11px] text-gray-400 mt-0.5">{ind.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Testimonials</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
              Valued by Manufacturing Leaders
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card-hover rounded-2xl bg-white border border-gray-100 p-8 flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-8 flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{t.initials}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                    <div className="text-xs text-gray-500">{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ───────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animated-gradient rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/3" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-balance">
                Ready to Digitize Your Manufacturing?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Start with a 14-day free trial. No credit card required.
                Experience the power of Industry 4.0 on your shop floor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold text-base hover:bg-gray-50 transition-colors shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-colors"
                >
                  Talk to Sales
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

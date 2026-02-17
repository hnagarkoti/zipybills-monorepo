import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Factory, BarChart3, Shield, Clock, Zap, Users, CheckCircle2,
  ArrowRight, Monitor, Cog, TrendingUp, Globe, Award, Cpu,
  ChevronRight, Sparkles, Star,
} from 'lucide-react';

/* ─── Stats ─────────────────────────────────── */
const STATS = [
  { value: '5,000+', label: 'Machines Managed' },
  { value: '50+', label: 'Factories Digitized' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '30%', label: 'Avg. OEE Improvement' },
];

/* ─── Features ──────────────────────────────── */
const FEATURES = [
  {
    icon: Monitor,
    title: 'Real-Time Production Monitoring',
    desc: 'Monitor your entire shop floor from a single dashboard. Track machine status, production counts, and cycle times in real-time.',
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'OEE Tracking & Analytics',
    desc: 'Automatically calculate OEE with availability, performance, and quality metrics. Identify bottlenecks with actionable insights.',
    accent: 'from-purple-500 to-pink-500',
  },
  {
    icon: Shield,
    title: 'Quality Management (CTQ/CTP)',
    desc: 'Critical-to-Quality and Critical-to-Process management with automated alerts, SPC charts, and traceability.',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Cog,
    title: 'Digital Work Instructions',
    desc: 'Replace paper SOPs with interactive, step-by-step digital work instructions. Ensure consistency across all operators.',
    accent: 'from-orange-500 to-amber-500',
  },
  {
    icon: Clock,
    title: 'Downtime Analysis',
    desc: 'Automatically capture and categorize downtime events. Pareto analysis helps you focus on the biggest losses first.',
    accent: 'from-red-500 to-rose-500',
  },
  {
    icon: TrendingUp,
    title: 'Production Planning & Scheduling',
    desc: 'Create production plans, assign operators, track targets vs actuals, and manage shift schedules efficiently.',
    accent: 'from-indigo-500 to-violet-500',
  },
];

/* ─── Industries ────────────────────────────── */
const INDUSTRIES = [
  { name: 'Automotive', icon: Cog },
  { name: 'Appliances', icon: Cpu },
  { name: 'FMCG', icon: Globe },
  { name: 'Electronics', icon: Zap },
  { name: 'Pharma', icon: Shield },
  { name: 'Metal & Die Casting', icon: Factory },
];

/* ─── Testimonials ──────────────────────────── */
const TESTIMONIALS = [
  {
    quote:
      'With FactoryOS, I can quickly take the right decisions with automated data and reports. I can keep an eye on what is happening even from home. A big thumbs up!',
    title: 'Welding Shop Production Head',
    company: 'Tier-1 Supplier, Maruti',
  },
  {
    quote:
      'FactoryOS is a game changer. It reduced our unnecessary paperwork and managed our time & efforts on analysis and CAPA rather than data collection.',
    title: 'Senior Manager Production',
    company: 'Die-Casting Industry',
  },
  {
    quote:
      'Going from spreadsheets to real-time dashboards improved our OEE by 22% in the first quarter. The ROI was immediate.',
    title: 'Plant Manager',
    company: 'Appliance Manufacturer',
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ─── Hero Section ─────────────────────── */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-100/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent-100/30 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-medium text-brand-700">Smart Manufacturing Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                Digitize Your{' '}
                <span className="gradient-text">Shop Floor.</span>
                <br />
                Maximize{' '}
                <span className="gradient-text">Efficiency.</span>
              </h1>

              <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
                FactoryOS brings Industry 4.0 to your manufacturing floor with real-time
                production monitoring, OEE tracking, quality management, and lean manufacturing
                tools — all in one platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-semibold text-base hover:shadow-xl hover:shadow-brand-500/25 transition-all"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/solutions"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-base hover:border-brand-300 hover:text-brand-600 transition-colors"
                >
                  Explore Solutions
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-500">14-day free trial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-500">No credit card</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-500">Setup in 5 min</span>
                </div>
              </div>
            </div>

            {/* Hero visual — Dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-1 shadow-2xl">
                <div className="rounded-xl bg-gray-950 overflow-hidden">
                  {/* Fake browser bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 mx-4 h-6 rounded bg-gray-800 flex items-center px-3">
                      <span className="text-[11px] text-gray-500">app.factoryos.in/dashboard</span>
                    </div>
                  </div>
                  {/* Fake dashboard */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'OEE', value: '87.3%', color: 'text-emerald-400' },
                        { label: 'Machines Running', value: '24/28', color: 'text-blue-400' },
                        { label: 'Today Output', value: '1,247', color: 'text-purple-400' },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-gray-800/50 p-3">
                          <div className="text-[11px] text-gray-500">{stat.label}</div>
                          <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                    {/* Fake chart bars */}
                    <div className="rounded-lg bg-gray-800/50 p-4">
                      <div className="text-[11px] text-gray-500 mb-3">Production Output — Last 7 Days</div>
                      <div className="flex items-end gap-2 h-24">
                        {[65, 80, 55, 90, 75, 95, 88].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-gradient-to-t from-brand-600 to-accent-500 opacity-80"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Fake machine list */}
                    <div className="space-y-2">
                      {[
                        { name: 'CNC-01', status: 'Running', color: 'bg-emerald-500' },
                        { name: 'Press-03', status: 'Idle', color: 'bg-yellow-500' },
                        { name: 'Weld-07', status: 'Running', color: 'bg-emerald-500' },
                      ].map((m) => (
                        <div key={m.name} className="flex items-center justify-between rounded bg-gray-800/30 px-3 py-2">
                          <span className="text-xs text-gray-400">{m.name}</span>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${m.color}`} />
                            <span className="text-[11px] text-gray-500">{m.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-xl">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────── */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold gradient-text">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Modern Solutions</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
              Manufacturing Shop Floor Information —<br />
              <span className="gradient-text">Anytime, Anywhere, At Will</span>
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Everything you need to digitize, monitor, and optimize your production floor.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card-hover rounded-2xl border border-gray-100 bg-white p-8 relative overflow-hidden group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${f.accent} mb-5`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                {/* Hover accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Industries ───────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Trusted Across <span className="gradient-text">Industries</span>
            </h2>
            <p className="mt-3 text-gray-500">
              From automotive to FMCG, FactoryOS adapts to your manufacturing process.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.name}
                className="card-hover flex flex-col items-center gap-3 p-6 rounded-xl bg-white border border-gray-100"
              >
                <ind.icon className="w-8 h-8 text-brand-600" />
                <span className="text-sm font-medium text-gray-700">{ind.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Testimonials</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
              They Acknowledged the Value of <span className="gradient-text">Our Services</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card-hover rounded-2xl border border-gray-100 bg-white p-8">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                  <div className="text-sm text-gray-500">{t.company}</div>
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
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Ready to Digitize Your Manufacturing?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Start with a 14-day free trial. No credit card required.
                Experience the power of Industry 4.0 on your shop floor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold text-base hover:bg-gray-50 transition-colors shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
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

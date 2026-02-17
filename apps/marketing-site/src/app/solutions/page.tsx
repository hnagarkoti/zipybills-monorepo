import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Monitor, BarChart3, Shield, Cog, Clock, TrendingUp,
  ArrowRight, CheckCircle2, Layers, FileText, Wrench,
  Activity, ClipboardList, Bug, Gauge, Cpu, Zap,
} from 'lucide-react';

const SOLUTIONS = [
  {
    id: 'proefficient',
    title: 'Proefficient — Production Monitoring System',
    subtitle: 'Our flagship solution',
    desc: 'A comprehensive production monitoring system that enables remote monitoring and control of your shop floor. Get real-time visibility into production processes, equipment status, and employee activity. Make the right decisions with automated data and reports.',
    icon: Monitor,
    accent: 'from-brand-500 to-brand-700',
    features: [
      'Real-time machine status monitoring',
      'Automatic production counting',
      'Cycle time analysis',
      'Shift-wise performance tracking',
      'Automated email & SMS alerts',
      'Customizable dashboards',
    ],
  },
  {
    id: 'oee',
    title: 'OEE Tracking & Analytics',
    subtitle: 'Maximize equipment effectiveness',
    desc: 'Track Overall Equipment Effectiveness by monitoring availability, performance, and quality in real time. Identify and eliminate the six big losses with Pareto analysis and drill-down reports.',
    icon: Gauge,
    accent: 'from-purple-500 to-pink-500',
    features: [
      'Automatic OEE calculation',
      'Availability, Performance & Quality breakdown',
      'Loss categorization (6 big losses)',
      'Pareto analysis & trend charts',
      'Benchmarking across machines & lines',
      'Shift-wise & daily/weekly/monthly views',
    ],
  },
  {
    id: 'quality',
    title: 'Product Quality Tracker (CTQ/CTP)',
    subtitle: 'Zero-defect manufacturing',
    desc: 'Critical-to-Quality and Critical-to-Process management that ensures tracking and recording of product origins, processes, and destinations — enhancing accountability and quality control at every step.',
    icon: Shield,
    accent: 'from-emerald-500 to-teal-500',
    features: [
      'Critical parameter monitoring (CTQ/CTP)',
      'SPC charts (X-bar, R, Cp, Cpk)',
      'Automated out-of-spec alerts',
      'Full product traceability',
      'Rejection tracking & analysis',
      'CAPA management integration',
    ],
  },
  {
    id: 'work-instructions',
    title: 'Digital Work Instructions',
    subtitle: 'Replace paper SOPs',
    desc: 'Interactive, step-by-step digital work instructions displayed at the operator station. Ensure consistency, reduce training time, and eliminate errors from outdated paper documents.',
    icon: FileText,
    accent: 'from-orange-500 to-amber-500',
    features: [
      'Visual step-by-step instructions',
      'Photo & video-enabled SOPs',
      'Version control & approval workflow',
      'Operator acknowledgment tracking',
      'Multi-language support',
      'Offline-capable (works without internet)',
    ],
  },
  {
    id: 'downtime',
    title: 'Downtime Analysis',
    subtitle: 'Reduce unplanned stoppages',
    desc: 'Automatically capture machine downtime events, categorize reasons, and analyze patterns. Focus improvement efforts on the biggest losses with data-driven Pareto analysis.',
    icon: Clock,
    accent: 'from-red-500 to-rose-500',
    features: [
      'Automatic downtime detection',
      'Reason code categorization',
      'Planned vs unplanned separation',
      'Pareto charts by reason, machine, shift',
      'MTBF & MTTR calculations',
      'Maintenance request triggers',
    ],
  },
  {
    id: 'guided-assembly',
    title: 'Guided Assembly',
    subtitle: 'Error-proof complex assemblies',
    desc: 'Step-by-step visual guidance for complex assembly operations. Poka-yoke integration ensures every step is completed correctly before moving to the next.',
    icon: Layers,
    accent: 'from-indigo-500 to-violet-500',
    features: [
      'Step-by-step visual guidance',
      'Poka-yoke integration',
      'Torque verification tracking',
      'Component scanning & validation',
      'Assembly time tracking per step',
      'First-pass yield monitoring',
    ],
  },
];

const WHY_CHOOSE = [
  { icon: Zap, title: 'Quick ROI', desc: 'See results within weeks, not months. Most customers report 15-30% OEE improvement in the first quarter.' },
  { icon: Cog, title: 'Customizable', desc: 'Tailored to your specific manufacturing process. We accommodate custom workflows, not the other way around.' },
  { icon: Cpu, title: 'Easy to Adopt', desc: 'Intuitive interface designed for operators. Minimal training required. Works on tablets, phones & desktops.' },
  { icon: Activity, title: 'Scalable', desc: 'Start with 2 machines, scale to 2000. Our platform grows with your factory." ' },
];

export default function SolutionsPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent-50 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Our Solutions</span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-gray-900">
            Complete <span className="gradient-text">Manufacturing Digitization</span> Suite
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
            From production monitoring to quality management — everything you need to
            bring Industry 4.0 to your shop floor.
          </p>
        </div>
      </section>

      {/* Solutions List */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {SOLUTIONS.map((sol, idx) => (
            <div
              key={sol.id}
              id={sol.id}
              className={`grid lg:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? 'lg:direction-rtl' : ''}`}
            >
              <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${sol.accent} mb-6`}>
                  <sol.icon className="w-7 h-7 text-white" />
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
                <div className={`rounded-2xl bg-gradient-to-br ${sol.accent} p-1`}>
                  <div className="rounded-xl bg-gray-950 p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
                    <sol.icon className="w-16 h-16 text-white/20 mb-4" />
                    <div className="text-white/60 text-sm font-medium">{sol.title}</div>
                    <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-xs">
                      {sol.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="rounded-lg bg-white/5 px-3 py-2">
                          <div className="text-[11px] text-white/50">{f}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Ready to See It in Action?
          </h2>
          <p className="text-gray-600 mb-8">
            Start your free trial today or talk to our team for a personalized demo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-semibold hover:shadow-xl hover:shadow-brand-500/25 transition-all"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-brand-300 hover:text-brand-600 transition-colors"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

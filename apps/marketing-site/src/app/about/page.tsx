import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import IIoTFlowAnimation from '@/components/IIoTFlowAnimation';
import {
  Target, Heart, Users, Award, Lightbulb, Shield,
  Factory, Rocket, BookOpen, Globe, Handshake,
} from 'lucide-react';

const MILESTONES = [
  {
    year: '2023',
    title: 'The Idea',
    desc: 'Identified a critical gap — Indian factory floors running on paper, Excel, and WhatsApp. Started research into a better way.',
  },
  {
    year: 'Early 2024',
    title: 'Research & Architecture',
    desc: 'Deep-dived into factory workflows across automotive, FMCG, and precision engineering to design FactoryOS from the ground up.',
  },
  {
    year: 'Mid 2024',
    title: 'First Pilots',
    desc: 'Ran pilot deployments with early manufacturing partners. Refined the product based on real operator and supervisor feedback.',
  },
  {
    year: 'Late 2024',
    title: 'FactoryOS v1.0 Launched',
    desc: 'Officially launched FactoryOS — 13 modules covering traceability, OEE, quality, downtime, IIoT, and more.',
  },
  {
    year: '2025',
    title: 'Strategic Partnerships',
    desc: 'Partnered with Sai Spark Automation to strengthen our IIoT and hardware deployment capabilities on factory floors.',
  },
  {
    year: '2026',
    title: 'Scaling Across India',
    desc: 'Expanding into new industries and geographies. Building the most factory-ready manufacturing OS in India.',
  },
];

const VALUES = [
  { icon: Lightbulb, title: 'Innovation', desc: 'Cutting-edge technology with quick ROI. We bring Industry 4.0 to every factory.' },
  { icon: Heart, title: 'Flexibility', desc: 'Tailored solutions that accommodate custom processes crucial for manufacturing.' },
  { icon: Users, title: 'Empowerment', desc: 'We empower manufacturers, customers, and employees to achieve prosperity.' },
  { icon: Shield, title: 'Reliability', desc: '99.9% uptime with enterprise-grade security and data protection.' },
];

const LEADERSHIP = [
  {
    name: 'Hemant Singh Nagarkoti',
    role: 'Founder & CEO',
    desc: 'Spearheading the vision to digitalise manufacturing processes. Building FactoryOS to give every Indian factory access to world-class digital tools.',
    initials: 'HN',
  },
];

const PARTNERS = [
  {
    name: 'Sai Spark Automation',
    type: 'Strategic Technology Partner',
    desc: 'Sai Spark Automation brings deep expertise in industrial automation, PLC programming, and hardware deployment. Together we deliver end-to-end IIoT solutions — FactoryOS provides the software layer while Sai Spark handles on-floor automation engineering.',
    areas: ['IIoT Hardware Deployment', 'PLC & Sensor Integration', 'Factory Automation Engineering', 'On-site Installation & Support'],
    initials: 'SS',
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-brand-50 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">About Us</span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-gray-900">
            Pioneering <span className="gradient-text">Digital Manufacturing</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Zipybills is building FactoryOS — India&apos;s most comprehensive factory operations platform.
            We started with a simple belief: every Indian factory deserves world-class digital tools,
            regardless of size.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl bg-white border border-gray-100 p-8 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-100">
                <Target className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To empower manufacturing sectors to achieve efficiency and prosperity —
                benefiting manufacturers, customers, and employees alike. We pave the way for
                lean manufacturing and wealth creation through the transformative power of technology.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-gray-100 p-8 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-100">
                <Rocket className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To be the leading Industry 4.0 platform for manufacturing, enabling every
                factory — from small workshops to large plants — to access world-class
                digital tools that drive productivity, quality, and profitability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Our <span className="gradient-text">Core Values</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="card-hover text-center rounded-2xl border border-gray-100 bg-white p-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-5">
                  <v.icon className="w-7 h-7 text-brand-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Our <span className="gradient-text">Journey</span>
            </h2>
          </div>
          <div className="relative">
            {/* Vertical line — aligned to center of the wider badge */}
            <div className="absolute left-[52px] top-0 bottom-0 w-0.5 bg-brand-200 hidden sm:block" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="shrink-0 min-w-[104px] rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-lg relative z-10 py-5 px-3 text-center leading-tight">
                    {m.year}
                  </div>
                  <div className="flex-1 rounded-xl border border-gray-100 bg-white p-5">
                    <h3 className="font-bold text-gray-900">{m.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IIoT Flow — Live Data Illustration */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">How It Works</span>
            <h2 className="mt-3 text-3xl font-extrabold text-gray-900">
              From Shop Floor to <span className="gradient-text">Dashboard — In Real Time</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              FactoryOS connects directly to your PLCs, sensors, and machines via our IIoT gateway.
              Data flows from the factory floor to secure cloud infrastructure and appears live on any device — phone, tablet, or monitor.
            </p>
          </div>
          <IIoTFlowAnimation />
          <div className="mt-10 grid sm:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '🔌', title: 'Connect Machines', desc: 'Plug in our IIoT gateway — works with any PLC, sensor, or legacy machine. No rewiring needed.' },
              { step: '02', icon: '📡', title: 'Data Streams Live', desc: 'Sensor readings, cycle times, and alerts are captured and sent to the cloud in under a second.' },
              { step: '03', icon: '☁️', title: 'Secure Cloud Processing', desc: 'Data is validated, stored, and processed on enterprise-grade infrastructure with 99.9% uptime.' },
              { step: '04', icon: '📊', title: 'Act on Insights', desc: 'Operators and managers see live dashboards. Downtime alerts hit your phone the moment they happen.' },
            ].map((s) => (
              <div key={s.step} className="relative p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-xs font-black text-brand-300 mb-3">{s.step}</div>
                <div className="text-2xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">
              <span className="gradient-text">Leadership</span>
            </h2>
          </div>
          <div className="max-w-lg mx-auto">
            {LEADERSHIP.map((l) => (
              <div key={l.name} className="text-center rounded-2xl border border-gray-100 bg-white p-10 card-hover">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{l.initials}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{l.name}</h3>
                <p className="text-brand-600 font-medium text-sm mb-4">{l.role}</p>
                <p className="text-gray-500 leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Strategic <span className="gradient-text">Partners</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              We partner with best-in-class specialists to deliver complete, end-to-end factory digitalisation.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            {PARTNERS.map((p) => (
              <div key={p.name} className="rounded-2xl border-2 border-brand-100 bg-white p-8 card-hover">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shrink-0">
                    <span className="text-xl font-black text-white">{p.initials}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                      <span className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-3 py-0.5">
                        {p.type}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed mt-2 mb-5">{p.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {p.areas.map((a) => (
                        <span key={a} className="text-xs bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badge */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
            <Award className="w-10 h-10 text-brand-600" />
            <div className="text-left">
              <div className="font-bold text-gray-900">Early-Stage. Serious Ambition.</div>
              <div className="text-sm text-gray-500">Building India&apos;s most factory-ready manufacturing OS — one floor at a time</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

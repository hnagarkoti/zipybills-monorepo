import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Target, Heart, Users, Award, Lightbulb, Shield,
  Factory, Rocket, BookOpen, Globe,
} from 'lucide-react';

const MILESTONES = [
  { year: '2020', title: 'Founded', desc: 'Zipybills established with a vision to digitalize manufacturing.' },
  { year: '2021', title: 'First 500 Machines', desc: 'Deployed to first major automotive Tier-1 suppliers with Proefficient solution.' },
  { year: '2022', title: '2,000+ Machines', desc: 'Expanded into appliances and FMCG sectors with customized solutions.' },
  { year: '2023', title: '5,000+ Machines', desc: 'Crossed 5,000 machines across automotive, appliances, and FMCG industries.' },
  { year: '2024', title: 'FactoryOS Launch', desc: 'Launched FactoryOS — our comprehensive SaaS manufacturing operations platform.' },
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
    desc: 'Spearheading the vision to digitalize manufacturing processes. Leading Zipybills from inception to serving 5000+ machines across industries.',
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
            Zipybills is at the forefront of digitalizing manufacturing processes since 2020.
            We stand out with our commitment to flexibility — tailoring solutions to
            accommodate custom processes crucial for manufacturing industries.
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
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-brand-200 hidden sm:block" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-lg relative z-10">
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
                  <span className="text-3xl font-bold text-white">
                    {l.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{l.name}</h3>
                <p className="text-brand-600 font-medium text-sm mb-4">{l.role}</p>
                <p className="text-gray-500 leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badge */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <Award className="w-10 h-10 text-brand-600" />
            <div className="text-left">
              <div className="font-bold text-gray-900">Trusted by 50+ Factories</div>
              <div className="text-sm text-gray-500">Recognised for innovation in manufacturing technology</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

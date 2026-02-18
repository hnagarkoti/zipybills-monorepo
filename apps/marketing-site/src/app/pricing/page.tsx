import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2, X, ArrowRight, Sparkles, Zap, Crown, Building2, Gift, Star, Clock, Users, Shield } from 'lucide-react';

interface PlanFeature {
  name: string;
  founder: boolean | string;
  growth: boolean | string;
  scale: boolean | string;
  enterprise: boolean | string;
}

/* ─────────────────────────────────────────────────────────────
   PRICING STRATEGY: Customer-acquisition first.
   Goal → get the first 30 factories using FactoryOS daily,
   build the habit, then convert to paid after 1 year.
───────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'FOUNDER',
    name: "Founder's Access",
    badge: 'Limited — 30 Spots',
    price: '0',
    originalPrice: null,
    period: 'FREE for 12 months',
    thenPrice: '1,499/mo after year 1',
    desc: 'Be one of our first 30 partner factories. Get everything free for a full year. We grow together.',
    icon: Gift,
    accent: 'border-emerald-300 ring-2 ring-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    cta: 'Claim Free Access',
    ctaHref: '/contact',
    ctaStyle: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25',
    machines: 'Up to 20 machines',
    users: 'Unlimited users',
    highlight: true,
    popular: false,
    spotsLeft: 30,
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    badge: 'Most Chosen',
    price: '999',
    originalPrice: '3,999',
    period: '/month',
    thenPrice: null,
    desc: 'For factories ready to go fully digital. Affordable enough to start today.',
    icon: Zap,
    accent: 'border-brand-300 ring-2 ring-brand-200',
    badgeBg: 'bg-brand-100 text-brand-700',
    cta: 'Start for ₹999/mo',
    ctaHref: '/contact',
    ctaStyle: 'bg-brand-600 text-white hover:bg-brand-700',
    machines: 'Up to 25 machines',
    users: 'Unlimited users',
    highlight: false,
    popular: true,
    spotsLeft: null,
  },
  {
    id: 'SCALE',
    name: 'Scale',
    badge: 'Best Value',
    price: '2,499',
    originalPrice: '9,999',
    period: '/month',
    thenPrice: null,
    desc: 'Full platform access for larger plants. All 13 modules. IIoT + ERP integration included.',
    icon: Crown,
    accent: 'border-accent-200',
    badgeBg: 'bg-accent-100 text-accent-700',
    cta: 'Get Scale Plan',
    ctaHref: '/contact',
    ctaStyle: 'bg-gradient-to-r from-brand-600 to-accent-600 text-white hover:shadow-lg',
    machines: 'Up to 75 machines',
    users: 'Unlimited users',
    highlight: false,
    popular: false,
    spotsLeft: null,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    badge: 'Custom',
    price: 'Talk to us',
    originalPrice: null,
    period: '',
    thenPrice: null,
    desc: 'Multi-plant, custom integrations, on-premise deployment, dedicated support. We build what you need.',
    icon: Building2,
    accent: 'border-gray-200',
    badgeBg: 'bg-gray-800 text-white',
    cta: 'Schedule a Call',
    ctaHref: '/contact',
    ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
    machines: 'Unlimited plants',
    users: 'Unlimited users',
    highlight: false,
    popular: false,
    spotsLeft: null,
  },
];

const FEATURES: PlanFeature[] = [
  { name: 'Real-time Production Monitoring', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'Machine Status Dashboard', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'OEE Tracking (Availability × Performance × Quality)', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'Shift Management & Shift Reports', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'Downtime Tracking & Root Cause Analysis', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'Quality Management & Rejection Tracking', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'Production Planning & Scheduling', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'Reports & Analytics Dashboards', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'WhatsApp & Email Alerts', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'Mobile App (iOS & Android)', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'Data Export (CSV / Excel)', founder: true, growth: true, scale: true, enterprise: true },
  { name: 'IIoT Sensor Integration', founder: '5 sensors', growth: '20 sensors', scale: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'ERP Integration (Tally/SAP/Oracle)', founder: false, growth: false, scale: true, enterprise: true },
  { name: 'Energy Monitoring Module', founder: false, growth: true, scale: true, enterprise: true },
  { name: 'Inventory & Stores Module', founder: false, growth: true, scale: true, enterprise: true },
  { name: 'Admin Panel & Role Management', founder: false, growth: true, scale: true, enterprise: true },
  { name: 'Audit Trail & Compliance Logs', founder: false, growth: false, scale: true, enterprise: true },
  { name: 'On-premise Deployment', founder: false, growth: false, scale: false, enterprise: true },
  { name: 'Dedicated Success Manager', founder: false, growth: false, scale: false, enterprise: true },
  { name: 'Custom Integrations & API Access', founder: false, growth: false, scale: true, enterprise: true },
  { name: 'SLA Guarantee', founder: false, growth: false, scale: false, enterprise: true },
];

const FAQ = [
  {
    q: "What exactly is the Founder's Access plan?",
    a: "We're at an early stage and want real factories using FactoryOS before we worry about revenue. So we're giving our first 30 partner factories a full 12 months completely free — every feature included, no hidden charges. After 12 months, you can continue at ₹1,499/month (locked-in founder rate, never increases). No obligation to continue — but we think you won't want to stop.",
  },
  {
    q: 'Why is your pricing so much lower than competitors?',
    a: 'We built FactoryOS specifically for Indian MSMEs because existing software is either too expensive (SAP/Oracle) or too generic. Our goal right now is to help as many Indian factories digitize — not to maximize revenue. As you grow and see results, we grow with you.',
  },
  {
    q: 'Is there a setup fee or hidden charges?',
    a: 'Zero. No setup fees, no onboarding fees, no per-user charges. What you see is what you pay. We even help you set up the system and train your team at no cost.',
  },
  {
    q: 'What happens to my data if I stop using FactoryOS?',
    a: "Your data belongs to you. You can export everything as Excel/CSV at any time. We don't hold your data hostage.",
  },
  {
    q: 'Do you support on-premise installation?',
    a: 'Yes, for Enterprise customers. Some Indian factories prefer keeping data on their own servers — we fully support that.',
  },
  {
    q: 'Can I upgrade from Founder plan to Growth/Scale?',
    a: "Yes, anytime. But honestly it rarely makes sense to — the Founder plan already includes more features than the Growth plan. It's our way of saying thank you for trusting us early.",
  },
];

function FeatureCheck({ val }: { val: boolean | string }) {
  if (typeof val === 'string') return <span className="text-sm text-gray-600 font-medium">{val}</span>;
  return val ? (
    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
  ) : (
    <X className="w-5 h-5 text-gray-200 mx-auto" />
  );
}

export default function PricingPage() {
  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-28 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-emerald-50/60 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold mb-6">
            <Gift className="w-4 h-4" />
            Early Adopter Launch Pricing — Limited Time
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Start Free. <span className="gradient-text">Stay Affordable.</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            We are giving our first 30 partner factories a{' '}
            <strong className="text-emerald-700">full year completely free</strong> — every feature included.
            After that, the most affordable manufacturing software in India. Prices in INR.
          </p>
        </div>
      </section>

      {/* ── Founder's Offer Banner ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-white shadow-xl shadow-emerald-500/20">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-200 mb-1">Founder&apos;s Partner Programme</div>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-1">First 30 Factories — 1 Full Year Free</h2>
            <p className="text-sm text-emerald-100 leading-relaxed">
              We want 30 real Indian factories as our early partners. You get FactoryOS completely free for 12 months.
              We get real feedback to make the product better. After year 1, locked-in at just ₹1,499/month — forever.
            </p>
          </div>
          <div className="flex-shrink-0 text-center">
            <div className="text-3xl font-black">30</div>
            <div className="text-xs text-emerald-200 font-semibold">spots total</div>
            <Link
              href="/contact"
              className="mt-3 inline-block px-5 py-2.5 rounded-xl bg-white text-emerald-700 font-bold text-sm hover:shadow-lg transition-all"
            >
              Claim Your Spot →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Plan Cards ── */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative card-hover rounded-2xl border bg-white p-7 flex flex-col ${plan.accent} ${plan.highlight ? 'shadow-2xl shadow-emerald-100' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 text-white text-xs font-bold whitespace-nowrap">
                    Most Chosen
                  </div>
                )}
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold whitespace-nowrap flex items-center gap-1">
                    <Star className="w-3 h-3" /> Founder&apos;s Access
                  </div>
                )}

                {/* Badge */}
                <div className={`inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${plan.badgeBg} mb-5`}>
                  <plan.icon className="w-3.5 h-3.5" />
                  {plan.badge}
                </div>

                {/* Price */}
                <div className="mb-1">
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-400 line-through mb-0.5">
                      ₹{plan.originalPrice}/mo
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    {plan.price !== 'Talk to us' && plan.price !== '0' && (
                      <span className="text-base text-gray-500">₹</span>
                    )}
                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-gray-500">{plan.period}</span>
                    )}
                  </div>
                  {plan.thenPrice && (
                    <div className="text-xs text-gray-400 mt-1">then ₹{plan.thenPrice} (locked)</div>
                  )}
                  {plan.originalPrice && (
                    <div className="inline-block mt-1.5 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-md">
                      {Math.round((1 - parseInt(plan.price.replace(',', '')) / parseInt(plan.originalPrice.replace(',', ''))) * 100)}% OFF launch price
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-5 mt-3 leading-relaxed flex-1">{plan.desc}</p>

                {/* Machines / Users */}
                <div className="space-y-2 mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{plan.machines}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{plan.users}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">Free setup & onboarding</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">WhatsApp support</span>
                  </div>
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`block text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>

                {plan.id === 'FOUNDER' && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    No credit card · No commitment
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Reassurance row */}
          <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Shield, title: 'No Lock-in', desc: 'Cancel or pause anytime. Your data is always yours.' },
              { icon: Users, title: 'Free Onboarding', desc: 'We train your team. You are live in under a week.' },
              { icon: Clock, title: 'WhatsApp Support', desc: 'Real humans. Reply within 2 hours on working days.' },
            ].map((r) => (
              <div key={r.title} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <r.icon className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{r.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Honest Promise ── */}
      <section className="py-14 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Why Are We Doing This?</h2>
          <p className="text-gray-600 leading-relaxed text-base">
            We built FactoryOS because Indian MSME factories deserve the same visibility into their operations
            that large corporations have — without paying ₹10–50 lakh for SAP implementation.
          </p>
          <p className="text-gray-600 leading-relaxed text-base mt-4">
            We are a small, passionate team. We need factories to use FactoryOS, tell us what works, and help us
            improve. In exchange, we give you a full year free. It is a fair deal for both sides.
            After 12 months, if FactoryOS hasn&apos;t saved you more than ₹1,499/month — we don&apos;t deserve your money.
          </p>
          <p className="text-sm text-gray-400 mt-4 italic">— Hemant, Founder · FactoryOS by Zipybills</p>
        </div>
      </section>

      {/* ── Feature Comparison Table ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              What&apos;s Included in <span className="gradient-text">Every Plan</span>
            </h2>
            <p className="text-gray-500 mt-3 text-sm">All plans include free onboarding, WhatsApp support, and mobile app access.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-left bg-white">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-5 text-sm font-semibold text-gray-900 w-2/5">Feature</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-emerald-700 bg-emerald-50/60">
                    <div>Founder</div>
                    <div className="text-xs font-normal text-emerald-600">FREE / 12 mo</div>
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-brand-700">
                    <div>Growth</div>
                    <div className="text-xs font-normal text-gray-400">₹999/mo</div>
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-accent-700 bg-accent-50/40">
                    <div>Scale</div>
                    <div className="text-xs font-normal text-gray-400">₹2,499/mo</div>
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-600">
                    <div>Enterprise</div>
                    <div className="text-xs font-normal text-gray-400">Custom</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr key={f.name} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}>
                    <td className="py-3 px-5 text-sm text-gray-700">{f.name}</td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30"><FeatureCheck val={f.founder} /></td>
                    <td className="py-3 px-4 text-center"><FeatureCheck val={f.growth} /></td>
                    <td className="py-3 px-4 text-center bg-accent-50/20"><FeatureCheck val={f.scale} /></td>
                    <td className="py-3 px-4 text-center"><FeatureCheck val={f.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Common <span className="gradient-text">Questions</span>
            </h2>
          </div>
          <div className="space-y-4">
            {FAQ.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 sm:p-12 text-center text-white">
            <div className="text-3xl font-extrabold mb-3">
              Still thinking about it?
            </div>
            <p className="text-gray-400 mb-8 leading-relaxed">
              There is zero risk. No credit card. No commitment. Just call us on WhatsApp,
              we will set it up in your factory within a week — for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25"
              >
                <Gift className="w-4 h-4" />
                Claim Free 1-Year Access
              </Link>
              <a
                href="https://wa.me/918791992976?text=Hi%2C%20I%20want%20to%20know%20more%20about%20FactoryOS%20pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

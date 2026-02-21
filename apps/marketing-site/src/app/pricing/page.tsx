import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  CheckCircle2, ArrowRight, Factory, Shield, Zap,
  HardDrive, Headphones, Star, Crown, Sparkles,
} from 'lucide-react';

/* ─── Plan Data ─────────────────────────────── */

const PLANS = [
  {
    name: 'Starter',
    tagline: 'For small factories getting started',
    price: 'Free',
    priceSuffix: 'forever',
    highlight: false,
    cta: 'Start Free',
    ctaHref: '/signup',
    icon: Factory,
    gradient: 'from-gray-600 to-gray-800',
    features: [
      'Up to 5 users',
      'Up to 10 machines',
      'Dashboard & real-time monitoring',
      'Shift management',
      'Basic downtime tracking',
      'Production planning (basic)',
      'Reports & analytics',
      'Community support',
    ],
  },
  {
    name: 'Professional',
    tagline: 'For growing manufacturing teams',
    price: '₹4,999',
    priceSuffix: '/month',
    highlight: true,
    cta: 'Start 30-Day Trial',
    ctaHref: '/signup',
    icon: Star,
    gradient: 'from-brand-600 to-accent-600',
    features: [
      'Up to 25 users',
      'Up to 50 machines',
      'Everything in Starter, plus:',
      'Advanced downtime analytics',
      'Multi-shift scheduling',
      'Compliance mode & audit trail',
      'Custom reports & export',
      'Data backup & restore',
      'Email support (24h response)',
    ],
  },
  {
    name: 'Enterprise',
    tagline: 'For large-scale operations',
    price: 'Custom',
    priceSuffix: 'contact us',
    highlight: false,
    cta: 'Contact Sales',
    ctaHref: '/contact',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-600',
    features: [
      'Unlimited users',
      'Unlimited machines',
      'Everything in Professional, plus:',
      'On-premise deployment option',
      'SSO / LDAP integration',
      'Multi-factory support',
      'Custom integrations & API',
      'Dedicated account manager',
      'SLA-backed priority support',
      'White-label branding',
    ],
  },
];

/* ─── FAQ Data ──────────────────────────────── */

const FAQS = [
  {
    q: 'Can I start without a credit card?',
    a: 'Yes! The Starter plan is completely free with no credit card required. Sign up and start using FactoryOS in minutes.',
  },
  {
    q: 'What happens after the 30-day trial on Professional?',
    a: 'After your trial ends, you can continue on the free Starter plan or upgrade to Professional to keep the advanced features.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Absolutely. You can upgrade, downgrade, or cancel at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'Do you offer discounts for annual billing?',
    a: 'Yes — annual plans get 2 months free. Contact us for annual pricing on Professional and Enterprise plans.',
  },
  {
    q: 'Is on-premise deployment available?',
    a: 'On-premise and hybrid deployments are available on the Enterprise plan. We support Docker-based installation on your own infrastructure.',
  },
  {
    q: 'What kind of support do you offer?',
    a: 'Starter includes community support. Professional gets email support with 24h response. Enterprise includes a dedicated account manager and SLA-backed priority support.',
  },
];

/* ─── Page ──────────────────────────────────── */

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ═══ Hero ═══ */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            Plans that grow with your{' '}
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              factory
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Start free, scale when you&apos;re ready. No hidden fees, no long-term contracts.
            Built for Indian manufacturing.
          </p>
        </div>
      </section>

      {/* ═══ Pricing Cards ═══ */}
      <section className="pb-20 -mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border ${
                  plan.highlight
                    ? 'border-brand-400 shadow-xl shadow-brand-500/10 ring-2 ring-brand-400/20 scale-[1.02]'
                    : 'border-gray-200 shadow-lg'
                } bg-white flex flex-col`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 text-white text-xs font-semibold uppercase tracking-wider shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8 pb-6">
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                      <plan.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-sm text-gray-500">{plan.priceSuffix}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    className={`block w-full text-center px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white hover:shadow-lg hover:shadow-brand-500/25'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="inline w-4 h-4 ml-1 -mt-0.5" />
                  </Link>
                </div>

                {/* Features */}
                <div className="px-8 pb-8 pt-4 border-t border-gray-100 flex-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">What&apos;s included</p>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-brand-500' : 'text-emerald-500'}`} />
                        <span className="text-sm text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Comparison Highlights ═══ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Why factories choose FactoryOS</h2>
            <p className="mt-3 text-gray-600 max-w-xl mx-auto">
              Every plan includes the core platform that makes manufacturing teams more productive.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: 'Real-time Monitoring', desc: 'Live production dashboards across all machines and lines.' },
              { icon: Shield, title: 'Compliance Built-in', desc: 'Audit trails, validation rules, and ISO-ready reports.' },
              { icon: HardDrive, title: 'On-prem Ready', desc: 'Your data on your infrastructure. No cloud lock-in.' },
              { icon: Headphones, title: 'Indian Support', desc: 'Local team. IST business hours. Hindi & English.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Bottom CTA ═══ */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-accent-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to digitalize your factory?
          </h2>
          <p className="text-brand-100 text-lg mb-8 max-w-2xl mx-auto">
            Start with the free Starter plan — no credit card, no commitment.
            Upgrade when your factory needs grow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3 rounded-xl bg-white text-brand-700 font-semibold hover:shadow-lg transition-all"
            >
              Start Free
              <ArrowRight className="inline w-4 h-4 ml-1 -mt-0.5" />
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

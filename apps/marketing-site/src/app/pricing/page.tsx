import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  CheckCircle2, ArrowRight, Factory, Shield, Zap,
  HardDrive, Headphones, Star, Crown, Sparkles, Rocket,
} from 'lucide-react';

/* ─── Env helpers (server component — read at build/render) ── */

function envInt(key: string, fallback: number): number {
  const v = process.env[key] ?? process.env[`NEXT_PUBLIC_${key}`];
  return v !== undefined ? parseInt(v, 10) : fallback;
}

function formatPrice(paise: number): string {
  if (paise === 0) return 'Free';
  // Prices are stored in paise (e.g. 5999 = ₹5,999)
  return `₹${paise.toLocaleString('en-IN')}`;
}

/* ─── Plan config — driven by env vars, same keys as backend .env ─ */

function getPlans() {
  const freeUsers     = envInt('PLAN_FREE_MAX_USERS', 5);
  const freeMachines  = envInt('PLAN_FREE_MAX_MACHINES', 3);
  const trialDays     = envInt('TRIAL_DAYS', 14);

  const starterPrice    = envInt('PLAN_STARTER_BASE_PRICE', 5999);
  const starterUsers    = envInt('PLAN_STARTER_MAX_USERS', 15);
  const starterMachines = envInt('PLAN_STARTER_MAX_MACHINES', 5);

  const proPrice    = envInt('PLAN_PROFESSIONAL_BASE_PRICE', 14999);
  const proUsers    = envInt('PLAN_PROFESSIONAL_MAX_USERS', 30);
  const proMachines = envInt('PLAN_PROFESSIONAL_MAX_MACHINES', 15);

  const entPrice    = envInt('PLAN_ENTERPRISE_BASE_PRICE', 49999);
  const entUsers    = envInt('PLAN_ENTERPRISE_MAX_USERS', -1);
  const entMachines = envInt('PLAN_ENTERPRISE_MAX_MACHINES', -1);

  return [
    {
      name: 'Free',
      tagline: `Try FactoryOS free for ${trialDays} days`,
      price: 'Free',
      priceSuffix: `${trialDays}-day trial`,
      highlight: false,
      cta: 'Start Free Trial',
      ctaHref: '/signup',
      icon: Factory,
      gradient: 'from-gray-600 to-gray-800',
      features: [
        `Up to ${freeUsers} users`,
        `Up to ${freeMachines} machines`,
        'Dashboard & real-time monitoring',
        'Shift management',
        'Production planning',
        'Community support',
      ],
    },
    {
      name: 'Starter',
      tagline: 'For small factories getting started',
      price: formatPrice(starterPrice),
      priceSuffix: '/month',
      highlight: false,
      cta: 'Get Started',
      ctaHref: '/signup',
      icon: Rocket,
      gradient: 'from-emerald-600 to-teal-600',
      features: [
        `Up to ${starterUsers} users`,
        `Up to ${starterMachines} machines`,
        'Everything in Free, plus:',
        'Downtime tracking & analytics',
        'Reports & export',
        'Email support',
      ],
    },
    {
      name: 'Professional',
      tagline: 'For growing manufacturing teams',
      price: formatPrice(proPrice),
      priceSuffix: '/month',
      highlight: true,
      cta: 'Start 30-Day Trial',
      ctaHref: '/signup',
      icon: Star,
      gradient: 'from-brand-600 to-accent-600',
      features: [
        `Up to ${proUsers} users`,
        `Up to ${proMachines} machines`,
        'Everything in Starter, plus:',
        'Compliance mode & audit trail',
        'Custom theming & branding',
        'Advanced export & scheduling',
        'Priority email support',
      ],
    },
    {
      name: 'Enterprise',
      tagline: 'For large-scale operations',
      price: formatPrice(entPrice),
      priceSuffix: '/month',
      highlight: false,
      cta: 'Contact Sales',
      ctaHref: '/contact',
      icon: Crown,
      gradient: 'from-amber-500 to-orange-600',
      features: [
        entUsers === -1 ? 'Unlimited users' : `Up to ${entUsers} users`,
        entMachines === -1 ? 'Unlimited machines' : `Up to ${entMachines} machines`,
        'Everything in Professional, plus:',
        'Backup & restore system',
        'Admin panel & license management',
        'Fine-grained RBAC permissions',
        'On-premise deployment option',
        'SSO / LDAP integration',
        'Dedicated account manager',
        'SLA-backed priority support',
      ],
    },
  ];
}

/* ─── Add-on pricing (optional, shown below cards) ── */

function getAddons() {
  return {
    starterPerMachine: envInt('PLAN_STARTER_PRICE_MACHINE', 499),
    starterPerUser: envInt('PLAN_STARTER_PRICE_USER', 199),
    proPerMachine: envInt('PLAN_PROFESSIONAL_PRICE_MACHINE', 999),
    proPerUser: envInt('PLAN_PROFESSIONAL_PRICE_USER', 299),
    entPerMachine: envInt('PLAN_ENTERPRISE_PRICE_MACHINE', 799),
    entPerUser: envInt('PLAN_ENTERPRISE_PRICE_USER', 249),
  };
}

/* ─── FAQ Data ──────────────────────────────── */

const FAQS = [
  {
    q: 'Can I start without a credit card?',
    a: 'Yes! The Free plan requires no credit card. Sign up and start using FactoryOS in minutes.',
  },
  {
    q: 'What happens after the free trial ends?',
    a: 'After your trial ends, you can upgrade to any paid plan to keep full access, or your workspace will be read-only until you upgrade.',
  },
  {
    q: 'Can I add more machines or users beyond my plan limit?',
    a: 'Yes — paid plans support add-on pricing per extra machine or user. See the add-on rates below the plan cards.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Absolutely. You can upgrade, downgrade, or cancel at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'Do you offer discounts for annual billing?',
    a: 'Yes — annual plans get 2 months free. Contact us for annual pricing on Starter, Professional, and Enterprise plans.',
  },
  {
    q: 'Is on-premise deployment available?',
    a: 'On-premise and hybrid deployments are available on the Enterprise plan. We support Docker-based installation on your own infrastructure.',
  },
  {
    q: 'What kind of support do you offer?',
    a: 'Free includes community support. Starter & Professional get email support. Enterprise includes a dedicated account manager and SLA-backed priority support.',
  },
];

/* ─── Page ──────────────────────────────────── */

export default function PricingPage() {
  const PLANS = getPlans();
  const addons = getAddons();

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
      <section className="pb-12 -mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border ${
                  plan.highlight
                    ? 'border-brand-400 shadow-xl shadow-brand-500/10 ring-2 ring-brand-400/20 lg:scale-[1.03]'
                    : 'border-gray-200 shadow-lg'
                } bg-white flex flex-col`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 text-white text-xs font-semibold uppercase tracking-wider shadow-lg whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 pb-5">
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                      <plan.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-[11px] text-gray-500">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-sm text-gray-500">{plan.priceSuffix}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    className={`block w-full text-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
                <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">What&apos;s included</p>
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-brand-500' : 'text-emerald-500'}`} />
                        <span className="text-[13px] text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Add-on Pricing ═══ */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Need more capacity?</h3>
            <p className="text-sm text-gray-500 mb-6">Add extra machines or users to any paid plan at these rates:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-700">Add-on</th>
                    <th className="text-center py-2 px-4 font-semibold text-gray-700">Starter</th>
                    <th className="text-center py-2 px-4 font-semibold text-brand-700">Professional</th>
                    <th className="text-center py-2 px-4 font-semibold text-gray-700">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-gray-600">Per extra machine</td>
                    <td className="py-3 px-4 text-center font-medium text-gray-900">₹{addons.starterPerMachine.toLocaleString('en-IN')}/mo</td>
                    <td className="py-3 px-4 text-center font-medium text-gray-900">₹{addons.proPerMachine.toLocaleString('en-IN')}/mo</td>
                    <td className="py-3 px-4 text-center font-medium text-gray-900">₹{addons.entPerMachine.toLocaleString('en-IN')}/mo</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-gray-600">Per extra user</td>
                    <td className="py-3 px-4 text-center font-medium text-gray-900">₹{addons.starterPerUser.toLocaleString('en-IN')}/mo</td>
                    <td className="py-3 px-4 text-center font-medium text-gray-900">₹{addons.proPerUser.toLocaleString('en-IN')}/mo</td>
                    <td className="py-3 px-4 text-center font-medium text-gray-900">₹{addons.entPerUser.toLocaleString('en-IN')}/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
            Start with the free plan — no credit card, no commitment.
            Upgrade when your factory needs grow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3 rounded-xl bg-white text-brand-700 font-semibold hover:shadow-lg transition-all"
            >
              Start Free Trial
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

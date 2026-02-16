import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2, X, ArrowRight, Sparkles, Zap, Crown, Building2 } from 'lucide-react';

interface PlanFeature {
  name: string;
  free: boolean | string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

const PLANS = [
  {
    id: 'FREE',
    name: 'Free Trial',
    price: '0',
    period: '14 days',
    desc: 'Get started with basic production monitoring. Perfect for evaluating FactoryOS.',
    icon: Sparkles,
    accent: 'border-gray-200',
    badgeBg: 'bg-gray-100 text-gray-700',
    cta: 'Start Free Trial',
    ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
    machines: '2 machines',
    users: '3 users',
    popular: false,
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: '4,999',
    period: '/month',
    desc: 'For small factories getting started with digital manufacturing.',
    icon: Zap,
    accent: 'border-brand-200',
    badgeBg: 'bg-brand-100 text-brand-700',
    cta: 'Get Started',
    ctaStyle: 'bg-brand-600 text-white hover:bg-brand-700',
    machines: '10 machines',
    users: '10 users',
    popular: false,
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: '14,999',
    period: '/month',
    desc: 'Full-featured solution for growing manufacturing operations.',
    icon: Crown,
    accent: 'border-accent-300 ring-2 ring-accent-200',
    badgeBg: 'bg-accent-100 text-accent-700',
    cta: 'Get Professional',
    ctaStyle: 'bg-gradient-to-r from-brand-600 to-accent-600 text-white hover:shadow-lg',
    machines: '30 machines',
    users: '50 users',
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Unlimited scale with dedicated support and custom integrations.',
    icon: Building2,
    accent: 'border-gray-200',
    badgeBg: 'bg-gray-800 text-white',
    cta: 'Contact Sales',
    ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
    machines: 'Unlimited',
    users: 'Unlimited',
    popular: false,
  },
];

const FEATURES: PlanFeature[] = [
  { name: 'Real-time Production Monitoring', free: true, starter: true, professional: true, enterprise: true },
  { name: 'Machine Status Dashboard', free: true, starter: true, professional: true, enterprise: true },
  { name: 'Production Planning', free: true, starter: true, professional: true, enterprise: true },
  { name: 'Shift Management', free: true, starter: true, professional: true, enterprise: true },
  { name: 'Downtime Analysis', free: false, starter: true, professional: true, enterprise: true },
  { name: 'Reports & Analytics', free: false, starter: true, professional: true, enterprise: true },
  { name: 'Data Export (CSV/JSON)', free: false, starter: false, professional: true, enterprise: true },
  { name: 'Audit Trail', free: false, starter: false, professional: true, enterprise: true },
  { name: 'Theme Customization', free: false, starter: false, professional: true, enterprise: true },
  { name: 'Database Backups', free: false, starter: false, professional: false, enterprise: true },
  { name: 'Admin Panel', free: false, starter: false, professional: false, enterprise: true },
  { name: 'License Management', free: false, starter: false, professional: false, enterprise: true },
  { name: 'Advanced Permissions', free: false, starter: false, professional: false, enterprise: true },
  { name: 'Dedicated Support', free: false, starter: false, professional: false, enterprise: true },
  { name: 'Custom Integrations', free: false, starter: false, professional: false, enterprise: true },
  { name: 'SLA Guarantee', free: false, starter: false, professional: false, enterprise: true },
];

const FAQ = [
  {
    q: 'What happens after the free trial?',
    a: 'After 14 days, you can choose a paid plan to continue. Your data is preserved. If you don\'t upgrade, your account becomes read-only — no data is deleted.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes! You can upgrade or downgrade anytime. When upgrading, the new features are available immediately. When downgrading, changes take effect at the next billing cycle.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No setup fees. You can be up and running in under 5 minutes. For Enterprise customers, we provide dedicated onboarding at no extra cost.',
  },
  {
    q: 'Do you offer on-premise deployment?',
    a: 'Yes. Our Enterprise plan includes the option for on-premise deployment with the same feature set. Contact sales for details.',
  },
];

function FeatureCheck({ val }: { val: boolean | string }) {
  if (typeof val === 'string') return <span className="text-sm text-gray-600">{val}</span>;
  return val ? (
    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
  ) : (
    <X className="w-5 h-5 text-gray-300 mx-auto" />
  );
}

export default function PricingPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-brand-50/50 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Pricing</span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-gray-900">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Start free, upgrade when you&apos;re ready. All plans include core manufacturing features.
            Prices in INR.
          </p>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative card-hover rounded-2xl border bg-white p-8 flex flex-col ${plan.accent}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 text-white text-xs font-bold">
                    Most Popular
                  </div>
                )}

                <div className={`inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${plan.badgeBg} mb-6`}>
                  <plan.icon className="w-3.5 h-3.5" />
                  {plan.name}
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  {plan.price !== 'Custom' && <span className="text-sm text-gray-500">₹</span>}
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-sm text-gray-500">{plan.period}</span>}
                </div>

                <p className="text-sm text-gray-500 mb-6 flex-1">{plan.desc}</p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-gray-700">Up to {plan.machines}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-gray-700">Up to {plan.users}</span>
                  </div>
                </div>

                <Link
                  href={plan.id === 'ENTERPRISE' ? '/contact' : '/signup'}
                  className={`block text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Feature <span className="gradient-text">Comparison</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-4 pr-4 text-sm font-semibold text-gray-900 w-1/3">Feature</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-600">Free</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-600">Starter</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-accent-700 bg-accent-50/50 rounded-t-lg">Professional</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-600">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr key={f.name} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : ''}`}>
                    <td className="py-3 pr-4 text-sm text-gray-700">{f.name}</td>
                    <td className="py-3 px-4 text-center"><FeatureCheck val={f.free} /></td>
                    <td className="py-3 px-4 text-center"><FeatureCheck val={f.starter} /></td>
                    <td className="py-3 px-4 text-center bg-accent-50/30"><FeatureCheck val={f.professional} /></td>
                    <td className="py-3 px-4 text-center"><FeatureCheck val={f.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </div>
          <div className="space-y-6">
            {FAQ.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Still not sure?</h2>
          <p className="text-gray-600 mb-6">Start with a free trial — no credit card required, no commitment.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-semibold hover:shadow-xl hover:shadow-brand-500/25 transition-all"
          >
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}

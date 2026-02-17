import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Download, FileText, BookOpen, Video, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const resources = [
  {
    icon: FileText,
    title: 'FactoryOS Product Brochure',
    description: 'Comprehensive overview of all FactoryOS modules — Proefficient, OEE Tracking, Quality Management, Digital Work Instructions, and more.',
    format: 'PDF',
    size: '4.2 MB',
    href: 'https://felidaesystems.co.in/wp-content/uploads/2023/06/Power-Profit-Technologies-Brochure.pdf',
    primary: true,
  },
  {
    icon: BookOpen,
    title: 'OEE Improvement Guide',
    description: 'Learn how leading factories use FactoryOS to achieve 30%+ OEE improvement within 90 days of deployment.',
    format: 'PDF',
    size: '2.1 MB',
    href: '#',
    primary: false,
  },
  {
    icon: Video,
    title: 'Product Demo Video',
    description: 'Watch a 5-minute walkthrough of FactoryOS in action — from real-time dashboards to downtime analysis.',
    format: 'MP4',
    size: 'Stream',
    href: '#',
    primary: false,
  },
];

const brochureHighlights = [
  'Real-time production monitoring with Proefficient',
  'OEE calculation with breakdown analysis',
  'Quality tracking — CTQ/CTP management',
  'Digital work instructions for operators',
  'Downtime categorization & root cause analysis',
  'Multi-factory deployment architecture',
  'Integration with existing PLCs and MES systems',
  'ROI calculator and customer success stories',
];

export default function BrochurePage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-brand-50/50 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Resources</span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-gray-900">
            Download Our <span className="gradient-text">Brochure</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Learn how FactoryOS helps manufacturing companies digitise their factory floor, track real-time performance, and boost profitability.
          </p>
        </div>
      </section>

      {/* Main Download Card */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Brochure Preview + Download */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                {/* Preview mockup */}
                <div className="bg-gradient-to-br from-brand-600 to-accent-600 p-10 text-center">
                  <div className="w-32 h-40 bg-white/20 backdrop-blur rounded-lg mx-auto flex items-center justify-center mb-4">
                    <FileText className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg">FactoryOS Product Brochure</h3>
                  <p className="text-white/70 text-sm mt-1">by Zipybills</p>
                </div>

                <div className="p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">What&apos;s Inside</h3>
                  <div className="grid sm:grid-cols-2 gap-2 mb-8">
                    {brochureHighlights.map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>

                  <a
                    href="https://felidaesystems.co.in/wp-content/uploads/2023/06/Power-Profit-Technologies-Brochure.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-semibold hover:shadow-lg transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download Brochure (PDF)
                  </a>
                </div>
              </div>
            </div>

            {/* Side — Other Resources */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-gray-900 mb-2">More Resources</h3>
              {resources.map((r) => (
                <a
                  key={r.title}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-hover block p-5 rounded-xl border border-gray-100 bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      <r.icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{r.title}</div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          {r.format}
                        </span>
                        <span className="text-[10px] text-gray-400">{r.size}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}

              {/* CTA */}
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 mt-6">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Want a personalised demo?</h4>
                <p className="text-xs text-gray-500 mb-3">
                  See FactoryOS configured for your specific industry and use case.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 text-sm text-brand-600 font-semibold hover:underline"
                >
                  Request Demo <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animated-gradient rounded-2xl p-10 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Ready to transform your factory?</h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8">
              Start your free 14-day trial — no credit card required. Set up your first factory in under 5 minutes.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-brand-700 font-semibold hover:bg-white/90 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

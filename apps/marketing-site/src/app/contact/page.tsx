'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production, this would POST to an API endpoint
    setSubmitted(true);
  }

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-brand-50/50 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Contact Us</span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-gray-900">
            Let&apos;s <span className="gradient-text">Talk Manufacturing</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions? Want a demo? Reach out and our team will get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Mail, title: 'Email Us', value: 'contact@factoryos.in', href: 'mailto:contact@factoryos.in' },
              { icon: Phone, title: 'Call Us', value: '+91 98765 43210', href: 'tel:+919876543210' },
              { icon: MapPin, title: 'Visit Us', value: 'India', href: '#' },
            ].map((c) => (
              <a
                key={c.title}
                href={c.href}
                className="card-hover flex items-center gap-4 p-6 rounded-2xl border border-gray-100 bg-white"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <c.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">{c.title}</div>
                  <div className="font-semibold text-gray-900">{c.value}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-8">
                {submitted ? (
                  <div className="text-center py-16">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-500">
                      Thank you for reaching out. Our team will get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setForm({ name: '', email: '', company: '', phone: '', subject: '', message: '' }); }}
                      className="mt-6 text-brand-600 font-semibold hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                          placeholder="Rajesh Kumar"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                          placeholder="rajesh@company.com"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                        <input
                          type="text"
                          value={form.company}
                          onChange={(e) => setForm({ ...form, company: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                          placeholder="ABC Manufacturing Pvt Ltd"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                      <select
                        required
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                      >
                        <option value="">Select a topic</option>
                        <option value="demo">Request a Demo</option>
                        <option value="pricing">Pricing Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="partnership">Partnership Opportunity</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm resize-none"
                        placeholder="Tell us about your manufacturing setup and what you're looking for..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-semibold hover:shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Side Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-600" />
                  Response Time
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We respond to all inquiries within <strong>24 hours</strong> on business days.
                  For urgent technical support, Enterprise customers get priority response within 4 hours.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-600" />
                  What to Expect
                </h3>
                <ul className="space-y-3">
                  {[
                    'Free consultation to understand your needs',
                    'Personalized product demo for your use case',
                    'Custom pricing quote for your factory size',
                    'Pilot deployment plan with timeline',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 p-6 text-white">
                <h3 className="font-bold mb-2">Prefer to try it yourself?</h3>
                <p className="text-sm text-white/80 mb-4">
                  Start a free trial — no credit card, no call, no commitment. Set up in 5 minutes.
                </p>
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-brand-700 font-semibold text-sm hover:bg-white/90 transition-colors"
                >
                  Start Free Trial
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

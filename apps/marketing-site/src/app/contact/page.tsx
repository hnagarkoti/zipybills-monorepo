'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

// ← Replace with your WhatsApp number (country code + number, no + or spaces)
const WHATSAPP_NUMBER = '919876543210';

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

    // Build a readable WhatsApp message from the form data
    const lines = [
      `📋 *New FactoryOS Enquiry*`,
      ``,
      `👤 *Name:* ${form.name}`,
      form.email   ? `📧 *Email:* ${form.email}`     : null,
      form.company ? `🏭 *Company:* ${form.company}` : null,
      form.phone   ? `📞 *Phone:* ${form.phone}`     : null,
      form.subject ? `📌 *Subject:* ${form.subject}` : null,
      ``,
      `💬 *Message:*`,
      form.message,
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

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
          <div className="grid sm:grid-cols-4 gap-6">
            <a
              href="mailto:contact@factoryos.in"
              className="card-hover flex items-center gap-4 p-6 rounded-2xl border border-gray-100 bg-white"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Email Us</div>
                <div className="font-semibold text-gray-900 text-sm">contact@factoryos.in</div>
              </div>
            </a>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover flex items-center gap-4 p-6 rounded-2xl border border-emerald-200 bg-emerald-50"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                {/* WhatsApp icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm text-emerald-700 font-medium">WhatsApp</div>
                <div className="font-semibold text-gray-900 text-sm">Chat instantly</div>
              </div>
            </a>

            <a
              href="tel:+919876543210"
              className="card-hover flex items-center gap-4 p-6 rounded-2xl border border-gray-100 bg-white"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Call Us</div>
                <div className="font-semibold text-gray-900 text-sm">+91 98765 43210</div>
              </div>
            </a>

            <a
              href="#"
              className="card-hover flex items-center gap-4 p-6 rounded-2xl border border-gray-100 bg-white"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-semibold text-gray-900 text-sm">India</div>
              </div>
            </a>
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
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Opened!</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                      Your message has been pre-filled in WhatsApp. Just hit <strong>Send</strong> and we&apos;ll reply shortly.
                    </p>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      Open WhatsApp again
                    </a>
                    <div className="mt-4">
                      <button
                        onClick={() => { setSubmitted(false); setForm({ name: '', email: '', company: '', phone: '', subject: '', message: '' }); }}
                        className="text-brand-600 font-semibold hover:underline text-sm"
                      >
                        Send another message
                      </button>
                    </div>
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
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all"
                    >
                      {/* WhatsApp icon inline */}
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Send via WhatsApp
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Building2, User, Lock, Mail, ArrowRight, CheckCircle2,
  XCircle, Loader2, Eye, EyeOff, Sparkles, Shield, Zap,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function SignupPage() {
  const [form, setForm] = useState({
    company_name: '',
    slug: '',
    admin_full_name: '',
    admin_username: '',
    admin_email: '',
    admin_password: '',
    confirm_password: '',
  });
  const [slugManual, setSlugManual] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ company: string; username: string } | null>(null);

  // Auto-generate slug from company name
  function handleCompanyChange(value: string) {
    setForm((prev) => ({
      ...prev,
      company_name: value,
      slug: slugManual ? prev.slug : slugify(value),
    }));
  }

  // Debounced username availability check
  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await fetch(`${API_BASE}/api/v1/saas/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.admin_username.length >= 3) {
        checkUsername(form.admin_username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.admin_username, checkUsername]);

  // Validation
  const passwordValid = form.admin_password.length >= 8;
  const passwordsMatch = form.admin_password === form.confirm_password && form.confirm_password.length > 0;
  const formReady =
    form.company_name.trim().length >= 2 &&
    form.slug.trim().length >= 2 &&
    form.admin_full_name.trim().length >= 2 &&
    form.admin_username.trim().length >= 3 &&
    usernameStatus === 'available' &&
    passwordValid &&
    passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formReady) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/saas/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name.trim(),
          slug: form.slug.trim(),
          admin_full_name: form.admin_full_name.trim(),
          admin_username: form.admin_username.trim(),
          admin_password: form.admin_password,
          admin_email: form.admin_email.trim() || undefined,
          plan_code: 'FREE', // Default free trial
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Signup failed. Please try again.');
        return;
      }

      setSuccess({ company: data.tenant.company_name, username: data.user.username });
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      <section className="pt-28 pb-20 min-h-screen relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-[500px] h-[500px] rounded-full bg-accent-50/50 blur-3xl" />
          <div className="absolute bottom-20 left-10 w-[400px] h-[400px] rounded-full bg-brand-50/50 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {success ? (
            /* Success State */
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome to FactoryOS!</h2>
              <p className="text-gray-600 mb-6">
                <strong>{success.company}</strong> has been set up successfully.
                Your 14-day free trial has started.
              </p>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-8 text-left">
                <div className="text-sm text-gray-500 mb-1">Your login credentials</div>
                <div className="font-mono text-sm">
                  <span className="text-gray-500">Username:</span>{' '}
                  <span className="font-semibold text-gray-900">{success.username}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Password: the one you just set</div>
              </div>
              <a
                href="http://localhost:8081/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Go to FactoryOS Login
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            /* Signup Form */
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              {/* Left — Benefits */}
              <div className="lg:col-span-2 lg:sticky lg:top-28">
                <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Get Started Free</span>
                <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900">
                  Start your <span className="gradient-text">14-day free trial</span>
                </h1>
                <p className="mt-4 text-gray-600">
                  No credit card required. Get your factory dashboard up and running in under 5 minutes.
                </p>

                <div className="mt-10 space-y-6">
                  {[
                    { icon: Sparkles, title: 'Instant Setup', desc: 'Your workspace is ready the moment you sign up. No waiting.' },
                    { icon: Shield, title: 'Secure & Isolated', desc: 'Your data is completely isolated. Enterprise-grade security from day one.' },
                    { icon: Zap, title: 'Full Features', desc: 'Access all core features during your trial — OEE, downtime, reports & more.' },
                  ].map((b) => (
                    <div key={b.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                        <b.icon className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{b.title}</div>
                        <p className="text-sm text-gray-500">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500">
                    Already have an account?{' '}
                    <a href="http://localhost:8081/login" className="text-brand-600 font-semibold hover:underline">
                      Log in here
                    </a>
                  </p>
                </div>
              </div>

              {/* Right — Form */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Create your account</h2>

                  {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> Company Name *
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.company_name}
                        onChange={(e) => handleCompanyChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                        placeholder="Acme Manufacturing Pvt Ltd"
                      />
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Workspace URL *
                      </label>
                      <div className="flex items-center gap-0">
                        <span className="px-3 py-3 rounded-l-xl bg-gray-100 border border-r-0 border-gray-200 text-xs text-gray-500 whitespace-nowrap">
                          factoryos.in/
                        </span>
                        <input
                          type="text"
                          required
                          value={form.slug}
                          onChange={(e) => {
                            setSlugManual(true);
                            setForm({ ...form, slug: slugify(e.target.value) });
                          }}
                          className="flex-1 px-3 py-3 rounded-r-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                          placeholder="acme-manufacturing"
                        />
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Your Full Name *
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.admin_full_name}
                        onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                        placeholder="Rajesh Kumar"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> Email
                        </span>
                      </label>
                      <input
                        type="email"
                        value={form.admin_email}
                        onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                        placeholder="rajesh@acme.com (optional)"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Username *
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          minLength={3}
                          value={form.admin_username}
                          onChange={(e) =>
                            setForm({ ...form, admin_username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm pr-10"
                          placeholder="rajesh_admin"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                          {usernameStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {usernameStatus === 'taken' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                      {usernameStatus === 'taken' && (
                        <p className="text-xs text-red-600 mt-1">This username is already taken. Try another.</p>
                      )}
                      {usernameStatus === 'available' && (
                        <p className="text-xs text-emerald-600 mt-1">Username is available!</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Password *
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={form.admin_password}
                          onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm pr-10"
                          placeholder="Min 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {form.admin_password.length > 0 && !passwordValid && (
                        <p className="text-xs text-amber-600 mt-1">Password must be at least 8 characters.</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Confirm Password *
                        </span>
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={form.confirm_password}
                        onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                          form.confirm_password.length > 0 && !passwordsMatch
                            ? 'border-red-300'
                            : 'border-gray-200'
                        }`}
                        placeholder="Re-enter your password"
                      />
                      {form.confirm_password.length > 0 && !passwordsMatch && (
                        <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={!formReady || submitting}
                      className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating your workspace...
                        </>
                      ) : (
                        <>
                          Start Free Trial
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      By signing up you agree to our{' '}
                      <Link href="#" className="underline hover:text-gray-600">Terms of Service</Link>
                      {' '}and{' '}
                      <Link href="#" className="underline hover:text-gray-600">Privacy Policy</Link>.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

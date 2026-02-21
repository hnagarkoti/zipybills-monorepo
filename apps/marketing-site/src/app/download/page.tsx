import type { Metadata } from 'next';
import Link from 'next/link';
import { Factory, Smartphone, ArrowLeft, Shield, Zap, Wifi, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Download FactoryOS App | Android & iOS',
  description: 'Download the FactoryOS mobile app for Android (.apk) or iOS (.ipa). Monitor your factory in real-time from anywhere.',
};

// ─── Update these URLs after each EAS build ───────────────
// Build with: cd apps/factoryOS && eas build --profile preview --platform all
// Then download the artifacts from expo.dev and upload to GitHub Releases.
const DOWNLOAD_LINKS = {
  android: {
    url: 'https://github.com/hnagarkoti/zipybills-monorepo/releases/latest/download/factoryos.apk',
    available: false, // flip to true once you've uploaded your first build
  },
  ios: {
    url: 'https://github.com/hnagarkoti/zipybills-monorepo/releases/latest/download/factoryos.ipa',
    available: false,
  },
};

const FEATURES = [
  { icon: Zap,       title: 'Real-time Dashboard',    desc: 'Live OEE, machine status and production KPIs at a glance' },
  { icon: Wifi,      title: 'Offline Support',        desc: 'Log operator data even without internet — syncs when back online' },
  { icon: Shield,    title: 'Role-based Access',      desc: 'Admin, Supervisor & Operator roles with scoped permissions' },
  { icon: RefreshCw, title: 'Instant Sync',           desc: 'Changes on mobile reflect on desktop and vice-versa instantly' },
];

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-white">
      {/* Nav bar */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-2 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-2xl shadow-blue-500/30 mb-8">
          <Factory className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          FactoryOS{' '}
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Mobile App
          </span>
        </h1>

        <p className="text-lg text-gray-300 max-w-xl mx-auto mb-12">
          Monitor production, manage machines and track shifts — right from your phone.
          Available for Android and iOS.
        </p>

        {/* Download cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Android */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 flex flex-col items-center gap-5 hover:border-green-500/40 hover:bg-green-500/5 transition-all group">
            {/* Android robot SVG */}
            <svg viewBox="0 0 24 24" className="w-16 h-16" fill="none">
              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zm-2.5-1c-.83 0-1.5.67-1.5 1.5v5c0 .83.67 1.5 1.5 1.5S5 24.33 5 23.5v-5C5 17.67 4.33 17 3.5 17zm17 0c-.83 0-1.5.67-1.5 1.5v5c0 .83.67 1.5 1.5 1.5S22 24.33 22 23.5v-5c0-.83-.67-1.5-1.5-1.5zm-4.97-15.15l1.96-1.96c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-2.13 2.13C14.16 2.1 13.12 2 12 2c-1.12 0-2.16.1-3.13.31L6.74.18c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.96 1.96C5.17 4.32 3 7.41 3 11h18c0-3.59-2.17-6.68-5.47-8.15zM10 9H9V8h1v1zm5 0h-1V8h1v1z" fill="#4ADE80" />
            </svg>

            <div className="text-center">
              <div className="text-xl font-bold mb-1">Android</div>
              <div className="text-sm text-gray-400">APK • Direct install</div>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Version 1.0.0 · com.zipybills.factoryos
            </div>

            {DOWNLOAD_LINKS.android.available ? (
              <a
                href={DOWNLOAD_LINKS.android.url}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold transition-all shadow-lg hover:shadow-green-500/30"
                download="factoryos.apk"
              >
                <Smartphone className="w-5 h-5" />
                Download APK
              </a>
            ) : (
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-700 text-gray-400 font-semibold cursor-not-allowed">
                  <Smartphone className="w-5 h-5" />
                  Download APK
                </div>
                <span className="text-xs text-amber-400 font-medium">🚧 Build coming soon</span>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center">
              Enable "Install from unknown sources" in Android settings before installing
            </p>
          </div>

          {/* iOS */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 flex flex-col items-center gap-5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group">
            {/* Apple SVG */}
            <svg viewBox="0 0 24 24" className="w-16 h-16" fill="none">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#60A5FA" />
            </svg>

            <div className="text-center">
              <div className="text-xl font-bold mb-1">iOS</div>
              <div className="text-sm text-gray-400">IPA • Ad-hoc distribution</div>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Version 1.0.0 · com.zipybills.factoryos
            </div>

            {DOWNLOAD_LINKS.ios.available ? (
              <a
                href={DOWNLOAD_LINKS.ios.url}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/30"
                download="factoryos.ipa"
              >
                <Smartphone className="w-5 h-5" />
                Download IPA
              </a>
            ) : (
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-700 text-gray-400 font-semibold cursor-not-allowed">
                  <Smartphone className="w-5 h-5" />
                  Download IPA
                </div>
                <span className="text-xs text-amber-400 font-medium">🚧 Build coming soon</span>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center">
              Requires iOS 15+. Device UDID must be registered for ad-hoc builds.
            </p>
          </div>
        </div>

        {/* QR placeholder */}
        <p className="mt-10 text-sm text-gray-500">
          Already have the app?{' '}
          <Link href="https://app.factoryos.zipybills.com" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Open the web app instead →
          </Link>
        </p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-center text-2xl font-bold mb-10 text-white/80">What you get</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <Icon className="w-6 h-6 text-blue-400 mb-3" />
              <div className="font-semibold mb-1">{title}</div>
              <div className="text-sm text-gray-400 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Install instructions */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-center text-2xl font-bold mb-8 text-white/80">Installation Guide</h2>
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
            <div className="flex items-center gap-2 font-bold text-green-400 mb-4">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-400"><path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zm11-10H7V6c0-2.76 2.24-5 5-5s5 2.24 5 5v2zm-9-2h8V6c0-2.21-1.79-4-4-4S8 3.79 8 6v2z" /></svg>
              Android Installation
            </div>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center shrink-0">1</span>Download the <strong>.apk</strong> file above</li>
              <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center shrink-0">2</span>Go to <strong>Settings → Security</strong> and enable <em>Install unknown apps</em> for your browser</li>
              <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center shrink-0">3</span>Open the downloaded APK file and tap <strong>Install</strong></li>
              <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center shrink-0">4</span>Launch <strong>FactoryOS</strong> and sign in with your workspace credentials</li>
            </ol>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
            <div className="flex items-center gap-2 font-bold text-blue-400 mb-4">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-400"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
              iOS Installation
            </div>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">1</span>Send your <strong>device UDID</strong> to your admin to register it</li>
              <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">2</span>Download the <strong>.ipa</strong> file on your iPhone/iPad</li>
              <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">3</span>Go to <strong>Settings → General → VPN &amp; Device Management</strong> and trust the developer profile</li>
              <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">4</span>Launch <strong>FactoryOS</strong> and sign in</li>
            </ol>
            <p className="mt-4 text-xs text-gray-500">
              Alternatively, we can distribute via TestFlight — contact support for access.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-white/10 py-16 text-center">
        <p className="text-gray-400 mb-4">Need help? Contact our support team</p>
        <a
          href="mailto:contact@factoryos.in"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-all"
        >
          contact@factoryos.in
        </a>
      </section>
    </main>
  );
}

import Link from 'next/link';
import { Factory, Mail, Phone, MapPin, Smartphone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">FactoryOS</div>
                <div className="text-[10px] text-gray-400 -mt-0.5">by Zipybills</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Digitalizing manufacturing processes since 2020.
              13 solutions. Real-time data. Built for Indian manufacturing.
            </p>
            {/* Mobile app download */}
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Download the App</p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/download#android"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-green-500/10 border border-white/10 hover:border-green-500/30 text-xs font-medium text-gray-300 hover:text-green-400 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zm-2.5-1c-.83 0-1.5.67-1.5 1.5v5c0 .83.67 1.5 1.5 1.5S5 24.33 5 23.5v-5C5 17.67 4.33 17 3.5 17zm17 0c-.83 0-1.5.67-1.5 1.5v5c0 .83.67 1.5 1.5 1.5S22 24.33 22 23.5v-5c0-.83-.67-1.5-1.5-1.5zm-4.97-15.15l1.96-1.96c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-2.13 2.13C14.16 2.1 13.12 2 12 2c-1.12 0-2.16.1-3.13.31L6.74.18c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.96 1.96C5.17 4.32 3 7.41 3 11h18c0-3.59-2.17-6.68-5.47-8.15zM10 9H9V8h1v1zm5 0h-1V8h1v1z" /></svg>
                  Android APK
                </Link>
                <Link
                  href="/download#ios"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 text-xs font-medium text-gray-300 hover:text-blue-400 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                  iOS IPA
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: '/about', label: 'About Us' },
                { href: '/solutions', label: 'Our Solutions' },
                { href: '/pricing', label: 'Pricing & Plans' },
                { href: '/download', label: '📱 Download App' },
                { href: '/brochure', label: 'Download Brochure' },
                { href: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Solutions</h3>
            <ul className="space-y-2">
              {[
                { href: '/solutions#traceability', label: 'Traceability' },
                { href: '/solutions#digital-work-instructions', label: 'Digital Work Instructions' },
                { href: '/solutions#ctq-management', label: 'CTQ Management' },
                { href: '/solutions#downtime-logbooks', label: 'Downtime Analysis' },
                { href: '/solutions#iiot-solutions', label: 'IIoT Solutions' },
                { href: '/solutions#energy-management', label: 'Energy Management' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-brand-400 shrink-0" />
                <span className="text-sm text-gray-400">India</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <a href="mailto:contact@factoryos.in" className="text-sm text-gray-400 hover:text-white transition-colors">
                  contact@factoryos.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <a href="tel:+919891241863" className="text-sm text-gray-400 hover:text-white transition-colors">
                  +91 98912 41863 / +91 98115 64873
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Zipybills. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

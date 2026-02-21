import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin } from 'lucide-react';
import {
  PHONE_PRIMARY, PHONE_ALTERNATE, PHONE_PRIMARY_TEL, PHONE_ALTERNATE_TEL,
  WHATSAPP_NUMBER, CONTACT_EMAIL, BUSINESS_HOURS,
} from '@/config/contact';
import ContactForm from './ContactForm';

export default function ContactPage() {
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
              href={`mailto:${CONTACT_EMAIL}`}
              className="card-hover flex items-center gap-4 p-6 rounded-2xl border border-gray-100 bg-white"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Email Us</div>
                <div className="font-semibold text-gray-900 text-sm">{CONTACT_EMAIL}</div>
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
              href={`tel:${PHONE_PRIMARY_TEL}`}
              className="card-hover flex items-center gap-4 p-6 rounded-2xl border border-gray-100 bg-white"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Call Us</div>
                <div className="font-semibold text-gray-900 text-sm">{PHONE_PRIMARY}</div>
                <div className="text-xs text-gray-400">{BUSINESS_HOURS}</div>
                {PHONE_ALTERNATE && (
                  <a href={`tel:${PHONE_ALTERNATE_TEL}`} className="text-xs text-brand-500 hover:underline">
                    Alt: {PHONE_ALTERNATE}
                  </a>
                )}
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
          <ContactForm whatsappNumber={WHATSAPP_NUMBER} phonePrimary={PHONE_PRIMARY} />
        </div>
      </section>

      <Footer />
    </>
  );
}

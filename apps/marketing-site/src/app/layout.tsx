import type { Metadata } from 'next';
import './globals.css';

/* ─── SEO Metadata ─────────────────────────────────────────────────
   Title / description optimised for primary target keywords:
   - "shop floor digitization software india"
   - "oee software india"
   - "production monitoring software india"
────────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: 'FactoryOS — Shop Floor Digitization & OEE Software for Indian Manufacturers',
    template: '%s | FactoryOS',
  },
  description:
    'Shop floor digitization software for Indian MSMEs & automobile manufacturers. Real-time OEE tracking, production monitoring, downtime alerts & 13 Industry 4.0 modules. IIoT ready. Free 14-day trial.',
  keywords: [
    'shop floor digitization software india',
    'oee software india',
    'production monitoring software india',
    'manufacturing mes software india',
    'factory digitization software',
    'iiot solution manufacturing india',
    'automobile manufacturing software india',
    'msme factory automation software',
    'machine monitoring software india',
    'downtime tracking software',
    'Industry 4.0 india',
    'FactoryOS',
    'Zipybills',
  ],
  authors: [{ name: 'Zipybills Technologies', url: 'https://factoryos.zipybills.com' }],
  creator: 'Zipybills Technologies',
  metadataBase: new URL('https://factoryos.zipybills.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-IN': 'https://factoryos.zipybills.com',
    },
  },
  openGraph: {
    title: 'FactoryOS — Shop Floor Digitization Software for Indian Manufacturers',
    description:
      'Real-time OEE tracking, production monitoring & 13 Industry 4.0 modules for Indian MSMEs & auto manufacturers. IIoT ready. Free 14-day trial.',
    type: 'website',
    url: 'https://factoryos.zipybills.com',
    siteName: 'FactoryOS by Zipybills',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FactoryOS — Shop Floor Digitization for Indian Manufacturers',
    description:
      'Real-time OEE, production monitoring & downtime alerts for Indian factories. 13 Industry 4.0 modules. Free 14-day trial.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/* ─── JSON-LD Structured Data ─────────────────────────────────────
   Organization + SoftwareApplication schema.
   Helps Google understand what FactoryOS is, who it's for,
   and enables rich search result features (sitelinks, ratings).
────────────────────────────────────────────────────────────────── */
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Zipybills Technologies',
  url: 'https://factoryos.zipybills.com',
  logo: 'https://factoryos.zipybills.com/logo.png',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-98912-41863',
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['English', 'Hindi'],
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
  },
  sameAs: [
    'https://www.linkedin.com/company/zipybills',
  ],
};

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FactoryOS',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Manufacturing Execution System',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
    description: '14-day free trial — no credit card required',
  },
  description:
    'Shop floor digitization and OEE monitoring software for Indian MSMEs and automobile manufacturers. Real-time production tracking, downtime alerts, quality management, and 13 Industry 4.0 modules.',
  url: 'https://factoryos.zipybills.com',
  provider: {
    '@type': 'Organization',
    name: 'Zipybills Technologies',
  },
  featureList: [
    'Real-time OEE Monitoring',
    'Production Monitoring & Counting',
    'Machine Downtime Tracking',
    'Quality Management',
    'Shift Management',
    'Energy Monitoring',
    'IIoT Sensor Integration',
    'ERP Integration (SAP, Tally, Oracle)',
    'Mobile Dashboard for Plant Managers',
  ],
  audience: {
    '@type': 'Audience',
    audienceType: 'Indian MSMEs and Automobile Manufacturers',
    geographicArea: {
      '@type': 'Country',
      name: 'India',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className="scroll-smooth">
      <head>
        {/* Preconnect for performance on Indian mobile connections */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://wa.me" />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className="antialiased text-gray-900 bg-white">{children}</body>
    </html>
  );
}

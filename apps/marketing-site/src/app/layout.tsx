import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FactoryOS by Zipybills — Smart Manufacturing Platform',
  description:
    'FactoryOS digitizes your shop floor with real-time OEE tracking, production monitoring, quality management, and lean manufacturing tools. Trusted by 5000+ machines across automotive, appliances & FMCG.',
  keywords: [
    'manufacturing software',
    'OEE tracking',
    'production monitoring',
    'shop floor management',
    'Industry 4.0',
    'lean manufacturing',
    'FactoryOS',
    'Zipybills',
  ],
  openGraph: {
    title: 'FactoryOS — Smart Manufacturing Platform',
    description: 'Digitize your shop floor. Track OEE. Maximize efficiency.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased text-gray-900 bg-white">{children}</body>
    </html>
  );
}

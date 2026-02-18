import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FactoryOS by Zipybills — Smart Manufacturing Platform',
  description:
    'FactoryOS by Zipybills — digitise your shop floor with real-time OEE tracking, production monitoring, quality management, and 13 Industry 4.0 modules. Built for Indian manufacturing. IIoT ready, cloud or on-premise.',
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

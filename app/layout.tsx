import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SITUATION MONITOR | NYC/NJ Real-Time Situational Awareness',
  description: 'Real-time situational awareness dashboard for the NYC/NJ metro area. Aggregates fire, police, transit, weather, and utility data into a unified tactical display.',
  keywords: ['situational awareness', 'NYC', 'NJ', 'emergency', 'traffic', 'transit', 'weather'],
  authors: [{ name: 'Situation Monitor' }],
  openGraph: {
    title: 'SITUATION MONITOR',
    description: 'Real-time situational awareness for NYC/NJ metro area',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-bg-primary text-white antialiased">
        {children}
      </body>
    </html>
  );
}


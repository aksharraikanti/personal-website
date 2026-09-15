import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { site } from '@/content/site';
import { experience } from '@/content/experience';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { CommandPaletteProvider } from '@/components/command-palette/CommandPaletteProvider';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CursorGlow } from '@/components/effects/CursorGlow';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Software Engineer`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  authors: [{ name: site.name, url: site.url }],
  keywords: [
    'Akshar Raikanti',
    'Software Engineer',
    'Purdue University',
    'Agentic AI',
    'Machine Learning',
    'RAG',
    'Google',
    'Tesla',
  ],
  openGraph: {
    type: 'website',
    url: site.url,
    title: `${site.name} — Software Engineer`,
    description: site.description,
    siteName: site.name,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — Software Engineer`,
    description: site.description,
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  url: site.url,
  email: `mailto:${site.email}`,
  telephone: site.phone,
  jobTitle: experience[0]?.role,
  worksFor: experience[0] ? { '@type': 'Organization', name: experience[0].company } : undefined,
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'Purdue University' },
  sameAs: [site.github, site.linkedin],
  description: site.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${site.gaId}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${site.gaId}');
          `}
        </Script>
        <ThemeProvider>
          <CommandPaletteProvider>
            <CursorGlow />
            <Header />
            {children}
            <Footer />
            <CommandPalette />
          </CommandPaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

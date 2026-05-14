import type { Metadata } from 'next';
import { Inter, Syne } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SINYAL COHIBA — AI Trading Signal XAUUSD',
  description:
    'Platform AI Trading Signal XAUUSD terdepan di Indonesia. Dapatkan sinyal entry/exit real-time, Daily Market Bias, dan AI Chat Assistant untuk analisa teknikal.',
  keywords: ['trading', 'XAUUSD', 'gold', 'emas', 'AI signal', 'forex', 'Indonesia'],
  authors: [{ name: 'SINYAL COHIBA' }],
  openGraph: {
    title: 'SINYAL COHIBA — AI Trading Signal XAUUSD',
    description: 'Sinyal trading emas berbasis AI. Akurasi tinggi, otomatis, real-time.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`dark ${inter.variable} ${syne.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* Inline script: apply saved theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('gm_theme');
            if (t === 'light') {
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
            }
          } catch(e) {}
        `}} />
      </head>
      <body className="min-h-screen bg-brand-dark font-sans">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}

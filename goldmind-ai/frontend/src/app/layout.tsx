import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GoldMind AI — AI Trading Signal XAUUSD',
  description:
    'Platform AI Trading Signal XAUUSD terdepan di Indonesia. Dapatkan sinyal entry/exit real-time, Daily Market Bias, dan AI Chat Assistant untuk analisa teknikal.',
  keywords: ['trading', 'XAUUSD', 'gold', 'emas', 'AI signal', 'forex', 'Indonesia'],
  authors: [{ name: 'GoldMind AI' }],
  openGraph: {
    title: 'GoldMind AI — AI Trading Signal XAUUSD',
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
    <html lang="id" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-brand-dark">
        {children}
      </body>
    </html>
  );
}

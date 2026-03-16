import type { Metadata } from 'next';
import { Noto_Sans_JP, Instrument_Serif } from 'next/font/google';
import { SkipLink } from '@/components/shared/skip-link';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kanejo — パーソナル金融エージェント',
  description: 'すべての人に、自分だけのCFOを。',
};

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('kanejo-theme');
    var dark = t === 'dark' || (!t || t === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${notoSansJP.variable} ${instrumentSerif.variable} font-sans antialiased`}
      >
        <SkipLink />
        {children}
      </body>
    </html>
  );
}

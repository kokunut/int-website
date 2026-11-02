import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import KakaoFab from '@/components/KakaoFab';
import { getSiteLinks } from '@/lib/data';
import { buildNav } from '@/lib/nav';
import { getSiteUrl, isVercelProduction } from '@/lib/site';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

const gmarket = localFont({
  src: [
    { path: './fonts/GmarketSansMedium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/GmarketSansBold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
  preload: false,
  fallback: ['Noto Sans KR', 'Pretendard Variable', 'Pretendard', 'sans-serif'],
});

export const viewport: Viewport = { themeColor: '#181A16' };

const SITE_TITLE ='인트 | 인공지능융합대학 학생회';
const SITE_DESC = '세종대학교 인공지능융합대학 학생회 인트';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { template: '%s | 인트', default: SITE_TITLE },
  description: SITE_DESC,
  openGraph: { siteName: '인트', locale: 'ko_KR', type: 'website', title: SITE_TITLE, description: SITE_DESC },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const links = await getSiteLinks();
  return (
    <html lang="ko" className={gmarket.variable}>
      <body>
        <a className="skip-link" href="#app">
          본문 바로가기
        </a>
        <Header nav={buildNav()} />
        <main id="app" tabIndex={-1}>{children}</main>
        <Footer links={links} />
        <KakaoFab href={links.kakao} />
        {isVercelProduction() && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}

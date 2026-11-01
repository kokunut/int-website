import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import ContestPopup from '@/components/ContestPopup';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import KakaoFab from '@/components/KakaoFab';
import { getContests, getSiteLinks } from '@/lib/data';
import { buildNav } from '@/lib/nav';
import './globals.css';

export const metadata: Metadata = {
  title: { template: '%s | 인트', default: '인트 | 인공지능융합대학 학생회' },
  description: '세종대학교 인공지능융합대학 학생회 인트',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [links, contests] = await Promise.all([getSiteLinks(), getContests()]);
  const popupContests = contests
    .filter((c) => c.popup)
    .map(({ id, title, desc, start, end, popup }) => ({ id, title, desc, start, end, popup }));
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <a className="skip-link" href="#app">
          본문 바로가기
        </a>
        <Header nav={buildNav(links)} />
        <main id="app" tabIndex={-1}>{children}</main>
        <Footer links={links} />
        <KakaoFab href={links.kakao} />
        <ContestPopup contests={popupContests} />
      </body>
    </html>
  );
}

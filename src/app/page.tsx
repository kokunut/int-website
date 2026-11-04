import type { Metadata } from 'next';
import AppLink from '@/components/AppLink';
import BannerCarousel from '@/components/BannerCarousel';
import Calendar from '@/components/Calendar';
import ContestList from '@/components/ContestList';
import NoticeList from '@/components/NoticeList';
import PaybackCard from '@/components/PaybackCard';
import PopupModal from '@/components/PopupModal';
import Link from 'next/link';
import { getBanners, getCalendarEvents, getContests, getNotices, getPayback, getPopups, getSiteLinks } from '@/lib/data';
import { todayKST } from '@/lib/date';
import { activePopups, buildPopups, popupHideScript } from '@/lib/popup';
import { PAGE_DESCRIPTIONS, pageMetadata } from '@/lib/seo';

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({ title: { absolute: '인트 | 인공지능융합대학 학생회' }, description: PAGE_DESCRIPTIONS.home, path: '/' });

export default async function HomePage() {
  const [banners, events, contests, popupRows, notices, payback, links] = await Promise.all([
    getBanners(),
    getCalendarEvents(),
    getContests(),
    getPopups(),
    getNotices(),
    getPayback(),
    getSiteLinks(),
  ]);
  const today = todayKST();
  const popups = buildPopups(popupRows, contests);
  const serverPopups = activePopups(popups, today);

  return (
    <div className="container">
      {serverPopups.length > 0 && (
        <script dangerouslySetInnerHTML={{ __html: popupHideScript(serverPopups.map((p) => p.id)) }} />
      )}
      <PopupModal popups={popups} serverToday={today} />
      <h1 className="sr-only">인트 · 인공지능융합대학 학생회</h1>
      <section id="banner" aria-label="배너">
        <BannerCarousel banners={banners} />
      </section>
      <section className="section home-top">
        <Calendar id="home-cal" events={events} today={today} compact />
        <div className="home-pb">
          <div className="sec-head">
            <h2>검정비 페이백 현황</h2>
            <Link className="more" href="/payback">
              자세히 →<span className="sr-only"> · 검정비 페이백 현황</span>
            </Link>
          </div>
          <PaybackCard payback={payback} formUrl={links.paybackForm} />
        </div>
      </section>
      <section className="section two">
        <div>
          <div className="sec-head">
            <h2>공모전</h2>
            <Link className="more" href="/contest">
              더보기 →
            </Link>
          </div>
          <ContestList items={contests.slice(0, 4)} />
        </div>
        <div>
          <div className="sec-head">
            <h2>공지사항</h2>
            <Link className="more" href="/notice">
              더보기 →
            </Link>
          </div>
          <NoticeList items={notices.slice(0, 5)} />
        </div>
      </section>
      <section className="section quick" aria-label="바로가기">
        <Link className="qk" href="/archive/military">
          <div>
            <small>아카이브</small>
            <strong>병영 길라잡이</strong>
          </div>
          <span className="arr">→</span>
        </Link>
        <AppLink className="qk" href={links.notionInterview}>
          <div>
            <small>노션 바로가기</small>
            <strong>인융 인터뷰 아카이브</strong>
          </div>
          <span className="arr">↗</span>
        </AppLink>
        <Link className="qk" href="/suggest">
          <div>
            <small>학생회에 바라는 점</small>
            <strong>건의함</strong>
          </div>
          <span className="arr">→</span>
        </Link>
      </section>
    </div>
  );
}

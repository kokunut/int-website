import type { Metadata } from 'next';
import AppLink from '@/components/AppLink';
import BannerCarousel from '@/components/BannerCarousel';
import Calendar from '@/components/Calendar';
import ContestList from '@/components/ContestList';
import NoticeList from '@/components/NoticeList';
import PaybackCard from '@/components/PaybackCard';
import Link from 'next/link';
import { getBanners, getCalendarEvents, getContests, getNotices, getPayback, getSiteLinks } from '@/lib/data';
import { todayKST } from '@/lib/date';

export const revalidate = 600;

export const metadata: Metadata = { title: { absolute: '인트 | 인공지능융합대학 학생회' } };

export default async function HomePage() {
  const [banners, events, contests, notices, payback, links] = await Promise.all([
    getBanners(),
    getCalendarEvents(),
    getContests(),
    getNotices(),
    getPayback(),
    getSiteLinks(),
  ]);
  const today = todayKST();

  return (
    <div className="container">
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
        <AppLink className="qk" href={links.notionMilitary}>
          <div>
            <small>노션 바로가기</small>
            <strong>군입대 백서</strong>
          </div>
          <span className="arr">↗</span>
        </AppLink>
        <AppLink className="qk" href={links.notionContest}>
          <div>
            <small>노션 바로가기</small>
            <strong>공모전 정보</strong>
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

import type { Metadata } from 'next';
import Calendar from '@/components/Calendar';
import { getCalendarEvents, getSiteLinks } from '@/lib/data';
import { todayKST } from '@/lib/date';

export const revalidate = 600;

export const metadata: Metadata = { title: '캘린더' };

export default async function CalendarPage() {
  const [events, links] = await Promise.all([getCalendarEvents(), getSiteLinks()]);
  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">소식</p>
        <h1>캘린더</h1>
        <p className="page-desc">
          학사일정, 학생회 행사, 공모전 마감일을 한눈에 확인하세요. 공지에 등록된 행사는 자동으로 표시돼요.
        </p>
      </div>
      <Calendar
        id="cal-page"
        events={events}
        today={todayKST()}
        deepLink
        title="전체 일정"
        plusHref={links.gcalSubscribe}
        plusLabel="구글 캘린더로 구독"
      />
    </section>
  );
}

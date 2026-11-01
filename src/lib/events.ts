import type { AcademicEvent, CalendarEvent, Contest, DateString, Notice } from './types';
import { ymd } from './date';

interface EventSources {
  academic: AcademicEvent[];
  notices: Notice[];
  contests: Contest[];
}

/** 학사일정 + 공지의 event + 공모전 마감일을 하나의 캘린더 이벤트 목록으로 합친다. */
export function buildEvents({ academic, notices, contests }: EventSources): CalendarEvent[] {
  const list: CalendarEvent[] = [];
  for (const e of academic) {
    list.push({ cat: 'academic', title: e.title, start: e.start, end: e.end || e.start });
  }
  for (const n of notices) {
    if (!n.event) continue;
    list.push({
      cat: 'event',
      title: n.title,
      start: n.event.start,
      end: n.event.end || n.event.start,
      link: `/notice/${n.id}`,
    });
  }
  for (const c of contests) {
    list.push({ cat: 'contest', title: `${c.title} 마감`, start: c.end, end: c.end, link: `/contest/${c.id}` });
  }
  return list.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

/** 해당 날짜(YYYY-MM-DD)에 걸쳐 있는 이벤트 */
export function eventsOn(events: CalendarEvent[], day: DateString): CalendarEvent[] {
  return events.filter((e) => e.start <= day && day <= e.end);
}

/** 해당 월(m: 0~11)과 기간이 하나라도 겹치는 이벤트 */
export function eventsInMonth(events: CalendarEvent[], y: number, m: number): CalendarEvent[] {
  const first = ymd(new Date(y, m, 1));
  const last = ymd(new Date(y, m + 1, 0));
  return events.filter((e) => e.start <= last && e.end >= first);
}

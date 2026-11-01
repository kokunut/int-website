import type { CalendarCategory, DateString } from './types';
import { toDate, ymd } from './date';

/** 캘린더 분류 표시 이름 (순서 = 필터/범례 순서) */
export const CAT_LABEL: Record<CalendarCategory, string> = {
  academic: '학사일정',
  event: '학생회 행사',
  contest: '공모전',
};

export const CAT_KEYS = Object.keys(CAT_LABEL) as CalendarCategory[];

export interface GridDay {
  date: DateString;
  /** 일(1~31) */
  day: number;
  /** 요일(0=일 ~ 6=토) */
  weekday: number;
  /** 표시 중인 달에 속하는지 */
  inMonth: boolean;
}

/** 해당 월(m: 0~11)을 6주 x 7일 = 42칸 격자로 만든다. 앞뒤는 이웃 달 날짜로 채운다. */
export function monthGrid(y: number, m: number): GridDay[] {
  const offset = new Date(y, m, 1).getDay();
  return Array.from({ length: 42 }, (_, k) => {
    const d = new Date(y, m, 1 - offset + k);
    return { date: ymd(d), day: d.getDate(), weekday: d.getDay(), inMonth: d.getMonth() === m };
  });
}

/** 월 이동 (연도 넘김 처리). m: 0~11 */
export function shiftMonth(y: number, m: number, delta: number): { y: number; m: number } {
  const d = new Date(y, m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

/** 해당 월의 첫날·마지막날 */
export function monthBounds(y: number, m: number): { first: DateString; last: DateString } {
  return { first: ymd(new Date(y, m, 1)), last: ymd(new Date(y, m + 1, 0)) };
}

/** `YYYY-MM-DD` -> { y, m(0~11) } */
export function ymOf(s: DateString): { y: number; m: number } {
  const d = toDate(s);
  return { y: d.getFullYear(), m: d.getMonth() };
}

/** `?date=` 값 검증: `YYYY-MM-DD` 형식이며 실제로 존재하는 날짜일 때만 반환, 아니면 null */
export function parseDateParam(v: string | null | undefined): DateString | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return ymd(toDate(v)) === v ? v : null;
}

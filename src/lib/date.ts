import type { Contest, ContestStatus, DateString } from './types';

export const WEEK = ['일', '월', '화', '수', '목', '금', '토'] as const;

const DAY_MS = 864e5;
const pad = (n: number): string => String(n).padStart(2, '0');

/** 오늘 날짜(KST 기준, YYYY-MM-DD). UTC 서버에서도 하루가 밀리지 않는다. */
export function todayKST(): DateString {
  // sv-SE 로캘은 YYYY-MM-DD 형식으로 출력된다
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** `YYYY-MM-DD` -> 로컬 자정 Date (달력 계산용) */
export function toDate(s: DateString): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date -> `YYYY-MM-DD` (로컬 기준) */
export function ymd(d: Date): DateString {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `2026-10-05` -> `10.5` */
export function md(s: DateString): string {
  const d = toDate(s);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

/** `2026-10-05` -> `2026.10.05` */
export function full(s: DateString): string {
  return s.replaceAll('-', '.');
}

/** 시작/끝이 같으면 하루만, 아니면 `a ~ b` */
export function range(a: DateString, b: DateString): string {
  return a === b ? md(a) : `${md(a)} ~ ${md(b)}`;
}

/** 500000 -> `500,000원` */
export function won(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

/** 오늘 기준 남은 일수 (지난 날짜는 음수) */
export function dday(s: DateString, today: DateString = todayKST()): number {
  return Math.round((toDate(s).getTime() - toDate(today).getTime()) / DAY_MS);
}

/** 접수 시작일·마감일 당일은 모두 '진행중' */
export function contestStatus(
  c: Pick<Contest, 'start' | 'end'>,
  today: DateString = todayKST(),
): ContestStatus {
  if (today < c.start) return '예정';
  if (today > c.end) return '마감';
  return '진행중';
}

/**
 * iCal(.ics) 파서 — 구글 캘린더 학사일정용.
 *
 * 한계: 반복 일정(RRULE/RDATE/EXDATE)은 해석하지 않고 첫 발생만 사용한다.
 * 같은 이유로 반복 일정의 수정된 회차(RECURRENCE-ID 가 있는 VEVENT)는 건너뛴다 (원본과 따로 중복 표시되는 것을 막음).
 * 반복되는 학사일정이 필요하거나 특정 회차를 바꾸려면 캘린더에서 각각 별도 일정으로 입력한다.
 */
import type { AcademicEvent, DateString } from '../types';
import { addDays, todayKST } from '../date';

const KST_OFFSET_MS = 9 * 3600e3;

function pad(n: number, w = 2): string {
  return String(n).padStart(w, '0');
}

function fromUtcMs(ms: number): DateString {
  const d = new Date(ms);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** 줄 이어쓰기(줄 앞 공백/탭) 해제 */
export function unfold(text: string): string[] {
  return text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}

export function unescapeText(s: string): string {
  return s.replace(/\\([nN,;\\])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c));
}

interface ContentLine {
  name: string;
  params: Record<string, string>;
  value: string;
}

function parseLine(line: string): ContentLine | null {
  // 따옴표 밖의 첫 ':' 에서 이름/파라미터와 값을 나눈다
  let inQuote = false;
  let colon = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuote = !inQuote;
    else if (ch === ':' && !inQuote) {
      colon = i;
      break;
    }
  }
  if (colon < 0) return null;
  const [name, ...rawParams] = line.slice(0, colon).split(';');
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: name.toUpperCase(), params, value: line.slice(colon + 1) };
}

/** 특정 시간대의 벽시계 시각을 UTC ms 로 (Intl 사용, 실패하면 null) */
function zonedToUtcMs(y: number, mo: number, d: number, h: number, mi: number, s: number, tz: string): number | null {
  try {
    const wall = Date.UTC(y, mo - 1, d, h, mi, s);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    const offsetAt = (ms: number): number => {
      const parts = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((p) => [p.type, Number(p.value)]));
      return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - ms;
    };
    const guess = wall - offsetAt(wall);
    return wall - offsetAt(guess);
  } catch {
    return null;
  }
}

interface ParsedDate {
  date: DateString;
  allDay: boolean;
  /** 시각이 자정(00:00:00, KST)인지 — 종료 시각 보정용 */
  midnight: boolean;
}

/** DTSTART/DTEND 값 -> KST 날짜 */
function parseDateValue(v: ContentLine): ParsedDate | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v.value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (m[4] === undefined || v.params.VALUE === 'DATE') {
    return { date: `${m[1]}-${m[2]}-${m[3]}`, allDay: true, midnight: true };
  }
  const [h, mi, s] = [Number(m[4]), Number(m[5]), Number(m[6] ?? 0)];
  let utc: number | null;
  if (m[7]) utc = Date.UTC(y, mo - 1, d, h, mi, s);
  else if (v.params.TZID) utc = zonedToUtcMs(y, mo, d, h, mi, s, v.params.TZID);
  else utc = Date.UTC(y, mo - 1, d, h, mi, s) - KST_OFFSET_MS; // 시간대 없는 값은 KST 로 간주
  if (utc === null) utc = Date.UTC(y, mo - 1, d, h, mi, s) - KST_OFFSET_MS;
  const kst = utc + KST_OFFSET_MS;
  const k = new Date(kst);
  return {
    date: fromUtcMs(kst),
    allDay: false,
    midnight: k.getUTCHours() === 0 && k.getUTCMinutes() === 0 && k.getUTCSeconds() === 0,
  };
}

interface Draft {
  summary?: string;
  start?: ParsedDate;
  end?: ParsedDate;
  cancelled: boolean;
  /** RECURRENCE-ID 가 있는 반복 일정의 수정 회차 */
  override: boolean;
}

function finish(d: Draft): AcademicEvent | null {
  if (!d.start || !d.summary?.trim()) return null;
  if (d.cancelled || d.override) return null;
  const start = d.start.date;
  let end = start;
  if (d.end) {
    end = d.end.date;
    // 종일 일정의 DTEND 는 '다음 날(배타)', 시간 일정은 자정에 끝나면 전날까지로 본다
    if (d.end.allDay || d.end.midnight) end = addDays(end, -1);
  }
  if (end < start) end = start;
  return { title: d.summary.trim(), start, end };
}

/**
 * ics 텍스트 -> 학사일정. 오늘 기준 ±1년 안의 일정만 남기고 시작일 순으로 정렬한다.
 * @param today 테스트용 기준일 (기본 KST 오늘)
 */
export function parseIcs(text: string, today: DateString = todayKST()): AcademicEvent[] {
  const from = addDays(today, -366);
  const to = addDays(today, 366);
  const events: AcademicEvent[] = [];
  let draft: Draft | null = null;
  let alarmDepth = 0;

  for (const raw of unfold(text)) {
    const line = raw.trim();
    if (!line) continue;
    const upper = line.toUpperCase();
    if (upper === 'BEGIN:VEVENT') {
      draft = { cancelled: false, override: false };
      alarmDepth = 0;
      continue;
    }
    if (upper === 'END:VEVENT') {
      const ev = draft && finish(draft);
      if (ev && ev.end >= from && ev.start <= to) events.push(ev);
      draft = null;
      continue;
    }
    if (!draft) continue;
    if (upper === 'BEGIN:VALARM') alarmDepth++;
    else if (upper === 'END:VALARM') alarmDepth--;
    if (alarmDepth > 0) continue;

    const cl = parseLine(line);
    if (!cl) continue;
    if (cl.name === 'SUMMARY') draft.summary = unescapeText(cl.value);
    else if (cl.name === 'DTSTART') draft.start = parseDateValue(cl) ?? undefined;
    else if (cl.name === 'DTEND') draft.end = parseDateValue(cl) ?? undefined;
    else if (cl.name === 'RECURRENCE-ID') draft.override = true;
    else if (cl.name === 'STATUS') draft.cancelled = cl.value.trim().toUpperCase() === 'CANCELLED';
  }
  return events.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

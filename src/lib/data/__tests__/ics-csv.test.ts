import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { mapPayback, parseCsv } from '../csv';
import { addDays } from '../../date';
import { parseIcs, unescapeText } from '../ics';

const fixture = (name: string): string => readFileSync(join(__dirname, 'fixtures', name), 'utf8');

describe('parseIcs', () => {
  const events = parseIcs(fixture('academic.ics'), '2026-11-01');
  const by = (title: string) => events.find((e) => e.title.startsWith(title));

  it('종일 일정: DTEND(배타)에서 하루를 뺀다', () => {
    expect(by('2학기 중간고사')).toEqual({ title: '2학기 중간고사', start: '2026-10-20', end: '2026-10-26' });
  });

  it('DTEND 없으면 하루 + SUMMARY 이스케이프 해제', () => {
    expect(by('기말고사')).toEqual({ title: '기말고사, 시작; 첫날\n본관', start: '2026-12-15', end: '2026-12-15' });
  });

  it('UTC 시각은 KST 날짜로 변환', () => {
    expect(by('UTC')).toMatchObject({ start: '2026-11-14', end: '2026-11-14' });
  });

  it('TZID=Asia/Seoul 시각', () => {
    expect(by('KST')).toMatchObject({ start: '2026-11-20', end: '2026-11-21' });
  });

  it('±1년 밖, 취소된 일정 제외 / 줄 접기 해제 / VALARM 무시', () => {
    expect(by('오래된')).toBeUndefined();
    expect(by('취소')).toBeUndefined();
    expect(by('접힌 줄')?.title).toBe('접힌 줄 테스트 아주 긴 제목입니다');
    expect(events).toHaveLength(5);
  });

  it('시작일 순 정렬', () => {
    const starts = events.map((e) => e.start);
    expect(starts).toEqual([...starts].sort());
  });

  it('다른 TZID 변환 (America/New_York 11월 EST = UTC-5)', () => {
    const ics = 'BEGIN:VEVENT\nDTSTART;TZID=America/New_York:20261110T200000\nSUMMARY:뉴욕\nEND:VEVENT';
    // 20:00 EST = 다음 날 01:00 UTC = 10:00 KST (11/11)
    expect(parseIcs(ics, '2026-11-01')[0]).toMatchObject({ start: '2026-11-11' });
  });

  it('유틸', () => {
    expect(unescapeText('a\\,b\;c\\nd\\\\e')).toBe('a,b;c\nd\\e');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('RECURRENCE-ID 가 있는 수정 회차는 건너뛰고 원본만 남긴다', () => {
    const ics = [
      'BEGIN:VEVENT',
      'UID:a@x',
      'DTSTART;VALUE=DATE:20261110',
      'DTEND;VALUE=DATE:20261111',
      'RRULE:FREQ=WEEKLY',
      'SUMMARY:정기 행사',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:a@x',
      'RECURRENCE-ID;VALUE=DATE:20261117',
      'DTSTART;VALUE=DATE:20261118',
      'DTEND;VALUE=DATE:20261119',
      'SUMMARY:정기 행사 (수정)',
      'END:VEVENT',
    ].join('\n');
    expect(parseIcs(ics, '2026-11-01')).toEqual([{ title: '정기 행사', start: '2026-11-10', end: '2026-11-10' }]);
  });
});

describe('parseCsv', () => {
  it('따옴표·이스케이프·CRLF·BOM', () => {
    expect(parseCsv('﻿a,"b,1","c ""q"""\r\nx,y\r\n')).toEqual([
      ['a', 'b,1', 'c "q"'],
      ['x', 'y'],
    ]);
  });
  it('따옴표 안 줄바꿈', () => {
    expect(parseCsv('k,"l1\nl2"\n')).toEqual([['k', 'l1\nl2']]);
  });
});

describe('mapPayback', () => {
  it('정상 시트', () => {
    expect(mapPayback(parseCsv(fixture('payback.csv')))).toEqual({
      budget: 500000,
      paid: 310000,
      recipients: 9,
      applyPeriod: '2026.10.13 ~ 11.07',
      nextPayDate: '2026-11-14',
      updatedAt: '2026-10-27',
    });
  });

  it('정해진 필드 외에는 노출하지 않는다', () => {
    const p = mapPayback(parseCsv(fixture('payback.csv')));
    expect(Object.keys(p ?? {}).sort()).toEqual(
      ['applyPeriod', 'budget', 'nextPayDate', 'paid', 'recipients', 'updatedAt'].sort(),
    );
  });

  it('누락·잘못된 값은 null', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(mapPayback([['총예산', '1000']])).toBeNull();
    const bad = parseCsv(fixture('payback.csv').replace('2026.11.14', '2026.13.40'));
    expect(mapPayback(bad)).toBeNull();
    const neg = parseCsv(fixture('payback.csv').replace('지급인원,9', '지급인원,abc'));
    expect(mapPayback(neg)).toBeNull();
    warn.mockRestore();
  });
});

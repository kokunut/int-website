import { describe, expect, it } from 'vitest';
import { buildEvents, eventsInMonth, eventsOn } from '../events';
import type { AcademicEvent, Contest, Notice } from '../types';

const academic: AcademicEvent[] = [{ title: '중간고사', start: '2026-10-20', end: '2026-10-26' }];
const notices: Notice[] = [
  { id: 1, type: '행사', title: '학술제', date: '2026-10-26', event: { start: '2026-11-03', end: '2026-11-14' }, body: [] },
  { id: 2, type: '일반', title: '회의록 공개', date: '2026-10-08', body: [] },
  { id: 3, type: '행사', title: '탐방', date: '2026-10-05', event: { start: '2026-10-20', end: '2026-10-20' }, body: [] },
];
const contests: Contest[] = [
  { id: 'c1', title: '공모전', start: '2026-10-20', end: '2026-11-15', popup: true, desc: '', target: '', prize: '', contact: '' },
];

describe('buildEvents', () => {
  const events = buildEvents({ academic, notices, contests });

  it('event 가 없는 공지는 제외하고 있는 공지는 포함', () => {
    const titles = events.map((e) => e.title);
    expect(titles).toContain('학술제');
    expect(titles).toContain('탐방');
    expect(titles).not.toContain('회의록 공개');
  });

  it('공모전은 마감일 하루짜리 이벤트로 변환', () => {
    const c = events.find((e) => e.cat === 'contest');
    expect(c).toEqual({ cat: 'contest', title: '공모전 마감', start: '2026-11-15', end: '2026-11-15', link: '/contest/c1' });
  });

  it('공지 링크는 실제 경로', () => {
    expect(events.find((e) => e.title === '학술제')?.link).toBe('/notice/1');
  });

  it('시작일, 같으면 종료일 순으로 정렬', () => {
    expect(events.map((e) => e.title)).toEqual(['탐방', '중간고사', '학술제', '공모전 마감']);
  });
});

describe('eventsOn', () => {
  const events = buildEvents({ academic, notices, contests });

  it('여러 날 이벤트는 시작일·중간일·종료일 모두에 포함', () => {
    for (const day of ['2026-10-20', '2026-10-23', '2026-10-26']) {
      expect(eventsOn(events, day).map((e) => e.title)).toContain('중간고사');
    }
  });

  it('범위 밖 날짜에는 포함되지 않음', () => {
    expect(eventsOn(events, '2026-10-19')).toEqual([]);
    expect(eventsOn(events, '2026-10-27').map((e) => e.title)).not.toContain('중간고사');
  });
});

describe('eventsInMonth', () => {
  const events = buildEvents({ academic, notices, contests });

  it('월 경계를 걸친 이벤트는 양쪽 달에 모두 포함', () => {
    const cross = buildEvents({
      academic: [{ title: '걸침', start: '2026-10-30', end: '2026-11-02' }],
      notices: [],
      contests: [],
    });
    expect(eventsInMonth(cross, 2026, 9)).toHaveLength(1);
    expect(eventsInMonth(cross, 2026, 10)).toHaveLength(1);
    expect(eventsInMonth(cross, 2026, 11)).toHaveLength(0);
  });

  it('월은 0부터 시작 (11월 = 10)', () => {
    expect(eventsInMonth(events, 2026, 10).map((e) => e.title)).toEqual(['학술제', '공모전 마감']);
  });
});

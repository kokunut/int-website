import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestStatus, dday, full, md, range, todayKST, won, ymd, toDate } from '../date';

afterEach(() => {
  vi.useRealTimers();
});

describe('todayKST', () => {
  it('UTC 자정 직전(KST 오전 8:59)은 KST 다음 날', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T23:59:00Z'));
    expect(todayKST()).toBe('2026-11-02');
  });

  it('UTC 16:00 은 KST 다음 날 오전 1시', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T16:00:00Z'));
    expect(todayKST()).toBe('2026-11-02');
  });

  it('UTC 15:00 이 KST 자정(날짜 경계)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T15:00:00Z'));
    expect(todayKST()).toBe('2026-11-02');
  });

  it('UTC 14:59:59 는 아직 KST 당일', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T14:59:59Z'));
    expect(todayKST()).toBe('2026-11-01');
  });
});

describe('formatters', () => {
  it('toDate / ymd 는 서로 역변환', () => {
    expect(ymd(toDate('2026-03-04'))).toBe('2026-03-04');
  });
  it('md, full, range, won', () => {
    expect(md('2026-10-05')).toBe('10.5');
    expect(full('2026-10-05')).toBe('2026.10.05');
    expect(range('2026-10-05', '2026-10-05')).toBe('10.5');
    expect(range('2026-10-05', '2026-10-09')).toBe('10.5 ~ 10.9');
    expect(won(500000)).toBe('500,000원');
  });
});

describe('dday', () => {
  it('미래는 양수, 당일 0, 과거는 음수', () => {
    expect(dday('2026-11-15', '2026-11-01')).toBe(14);
    expect(dday('2026-11-01', '2026-11-01')).toBe(0);
    expect(dday('2026-10-31', '2026-11-01')).toBe(-1);
  });
  it('today 생략 시 KST 오늘 기준', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T16:00:00Z'));
    expect(dday('2026-11-02')).toBe(0);
  });
});

describe('contestStatus', () => {
  const c = { start: '2026-10-20', end: '2026-11-15' };
  it('시작 전은 예정', () => {
    expect(contestStatus(c, '2026-10-19')).toBe('예정');
  });
  it('시작일 당일은 진행중', () => {
    expect(contestStatus(c, '2026-10-20')).toBe('진행중');
  });
  it('마감일 당일은 진행중', () => {
    expect(contestStatus(c, '2026-11-15')).toBe('진행중');
  });
  it('마감일 다음 날은 마감', () => {
    expect(contestStatus(c, '2026-11-16')).toBe('마감');
  });
});

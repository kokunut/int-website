import { describe, expect, it } from 'vitest';
import { monthBounds, parseDateParam, monthGrid, shiftMonth, ymOf } from '../calendar';

describe('monthGrid', () => {
  const g = monthGrid(2026, 10); // 2026-11 (1일 = 일요일)
  it('항상 42칸', () => {
    expect(g).toHaveLength(42);
  });
  it('1일이 일요일이면 첫 칸이 1일', () => {
    expect(g[0]).toMatchObject({ date: '2026-11-01', day: 1, weekday: 0, inMonth: true });
  });
  it('이웃 달 날짜는 inMonth=false', () => {
    const g2 = monthGrid(2026, 9); // 2026-10 (1일 = 목요일)
    expect(g2[0]).toMatchObject({ date: '2026-09-27', inMonth: false });
    expect(g2.filter((d) => d.inMonth)).toHaveLength(31);
  });
  it('연도 경계 (2027-01)', () => {
    const g3 = monthGrid(2027, 0);
    expect(g3.filter((d) => d.inMonth)).toHaveLength(31);
    expect(g3[0].date).toBe('2026-12-27');
  });
});

describe('shiftMonth', () => {
  it('연도 넘김', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ y: 2027, m: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ y: 2025, m: 11 });
  });
});

describe('monthBounds / ymOf', () => {
  it('윤년 2월', () => {
    expect(monthBounds(2028, 1)).toEqual({ first: '2028-02-01', last: '2028-02-29' });
  });
  it('ymOf', () => {
    expect(ymOf('2026-11-01')).toEqual({ y: 2026, m: 10 });
  });
});

describe('parseDateParam', () => {
  it('유효한 날짜만 통과', () => {
    expect(parseDateParam('2026-12-15')).toBe('2026-12-15');
    expect(parseDateParam('2026-02-30')).toBeNull();
    expect(parseDateParam('2026-1-5')).toBeNull();
    expect(parseDateParam('abc')).toBeNull();
    expect(parseDateParam(null)).toBeNull();
  });
});

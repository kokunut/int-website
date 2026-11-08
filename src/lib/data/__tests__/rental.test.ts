import { describe, expect, it } from 'vitest';
import { mapRental, parseCsv } from '../csv';

describe('mapRental', () => {
  it('물품·총수량·대여중 열을 읽고 대여중은 총수량을 넘지 않는다', () => {
    const r = mapRental(parseCsv('물품,총수량,대여중,갱신일\n충전기,6,2,2026.11.07\n보조배터리,5,9,\n,3,1,\n'), '2026-11-08');
    expect(r).toEqual({ items: [{ name: '충전기', total: 6, out: 2 }, { name: '보조배터리', total: 5, out: 5 }], updatedAt: '2026-11-07' });
  });
  it('필수 열이 없으면 null, 갱신일이 없으면 오늘', () => {
    expect(mapRental(parseCsv('물품,수량\n충전기,6\n'), '2026-11-08')).toBeNull();
    expect(mapRental(parseCsv('물품,총수량,대여중\n충전기,6,0\n'), '2026-11-08')?.updatedAt).toBe('2026-11-08');
  });
});

import { describe, expect, it } from 'vitest';
import { ALL_CATEGORY, filterPartners, partnerCategories, partnerMapUrl } from '../partners';

const items = [{ cat: '식당' }, { cat: '카페' }, { cat: '식당' }, { cat: '생활' }];

describe('partners', () => {
  it('builds unique categories with 전체 first', () => {
    expect(partnerCategories(items)).toEqual(['전체', '식당', '카페', '생활']);
  });
  it('filters by category', () => {
    expect(filterPartners(items, ALL_CATEGORY)).toHaveLength(4);
    expect(filterPartners(items, '식당')).toHaveLength(2);
    expect(filterPartners(items, '없음')).toHaveLength(0);
  });
});

describe('partnerMapUrl', () => {
  it('uses mapUrl when given', () => {
    expect(partnerMapUrl({ name: 'A', place: 'B', mapUrl: 'https://kko.to/x' })).toBe('https://kko.to/x');
  });
  it('builds a Naver search url otherwise', () => {
    expect(partnerMapUrl({ name: 'OO식당', place: '정문 앞' })).toBe(
      `https://map.naver.com/p/search/${encodeURIComponent('OO식당 정문 앞')}`,
    );
    expect(partnerMapUrl({ name: 'A', place: 'B', mapUrl: '#' })).toContain('map.naver.com');
    expect(partnerMapUrl({ name: 'A', place: 'B', mapUrl: ' ' })).toContain('map.naver.com');
  });
});

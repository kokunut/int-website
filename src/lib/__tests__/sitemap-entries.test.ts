import { describe, expect, it } from 'vitest';
import { sitemapEntry, validLastModified } from '../sitemap-entries';

describe('validLastModified', () => {
  it('올바른 날짜는 그대로 돌려준다', () => {
    expect(validLastModified('2026-10-05')).toBe('2026-10-05');
    expect(validLastModified('2028-02-29')).toBe('2028-02-29');
  });

  it.each(['', '2026-13-01', '2026-02-30', '2027-02-29', '2026-1-5', '2026/10/05', '2026-10-05T00:00:00Z', 'abc'])(
    '잘못된 문자열 %j 은 생략한다',
    (s) => {
      expect(validLastModified(s)).toBeUndefined();
    },
  );

  it('값이 없으면 생략한다', () => {
    expect(validLastModified(undefined)).toBeUndefined();
    expect(validLastModified(null)).toBeUndefined();
  });
});

describe('sitemapEntry', () => {
  it('날짜가 올바르면 lastModified 를 넣는다', () => {
    const e = sitemapEntry('/notice/1', '2026-10-05');
    expect(e.url).toMatch(/\/notice\/1$/);
    expect(e.lastModified).toBe('2026-10-05');
  });

  it('날짜가 없으면 lastModified 키 자체가 없다', () => {
    expect('lastModified' in sitemapEntry('/about')).toBe(false);
  });

  it('잘못된 날짜면 lastModified 키 자체가 없다', () => {
    expect('lastModified' in sitemapEntry('/notice/2', '2026-02-30')).toBe(false);
  });

  it('changeFrequency·priority 는 넣지 않는다', () => {
    const e = sitemapEntry('/notice/1', '2026-10-05');
    expect('changeFrequency' in e).toBe(false);
    expect('priority' in e).toBe(false);
  });
});

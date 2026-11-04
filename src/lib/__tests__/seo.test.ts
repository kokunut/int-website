import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from '@/app/robots';
import {
  ARCHIVE_DESCRIPTIONS,
  DOC_DESCRIPTIONS,
  PAGE_DESCRIPTIONS,
  blocksText,
  contestJsonLd,
  detailDescription,
  faqJsonLd,
  organizationJsonLd,
  pageMetadata,
  realUrl,
  serializeJsonLd,
  summarize,
  verificationMeta,
  websiteJsonLd,
} from '../seo';
import type { Contest } from '../types';

describe('summarize', () => {
  it('collapses whitespace and newlines', () => {
    expect(summarize('  가나\n\n다  라\t마 ')).toBe('가나 다 라 마');
  });
  it('keeps short text as is', () => {
    expect(summarize('짧은 글', 120)).toBe('짧은 글');
    expect(summarize('a'.repeat(120))).toBe('a'.repeat(120));
  });
  it('truncates to max characters including the ellipsis', () => {
    const out = summarize('가'.repeat(200), 120);
    expect(Array.from(out)).toHaveLength(120);
    expect(out.endsWith('…')).toBe(true);
  });
  it('does not split surrogate pairs', () => {
    const out = summarize('😀'.repeat(10), 5);
    expect(out).toBe('😀😀😀😀…');
  });
  it('handles empty input', () => {
    expect(summarize(undefined)).toBe('');
    expect(summarize(null)).toBe('');
    expect(summarize('   ')).toBe('');
  });
});

describe('detailDescription', () => {
  it('falls back when the text is empty', () => {
    expect(detailDescription('  ', '대체 문구')).toBe('대체 문구');
    expect(detailDescription('본문', '대체 문구')).toBe('본문');
  });
});

describe('blocksText', () => {
  it('joins text blocks and skips images and dividers', () => {
    expect(
      blocksText([
        { type: 'paragraph', text: '하나' },
        { type: 'divider' },
        { type: 'image', src: '/x.png', caption: '무시' },
        { type: 'list', ordered: false, items: ['둘', '셋'] },
      ]),
    ).toBe('하나 둘 셋');
    expect(blocksText(undefined)).toBe('');
  });
});

describe('static descriptions', () => {
  const all = [...Object.values(PAGE_DESCRIPTIONS), ...Object.values(DOC_DESCRIPTIONS), ...Object.values(ARCHIVE_DESCRIPTIONS)];
  it('are 80-120 characters', () => {
    const outOfRange = all.map((d) => `${Array.from(d).length}: ${d}`).filter((s) => Number.parseInt(s, 10) < 80 || Number.parseInt(s, 10) > 120);
    expect(outOfRange).toEqual([]);
  });
  it('are all different', () => {
    expect(new Set(all).size).toBe(all.length);
  });
  it('mention the council', () => {
    for (const d of all) expect(d).toMatch(/인공지능융합대학/);
  });
});

describe('pageMetadata', () => {
  it('sets description, canonical and social cards', () => {
    const m = pageMetadata({ title: '소개', description: '설명', path: '/about' });
    expect(m.description).toBe('설명');
    expect(m.alternates?.canonical).toBe('/about');
    expect(m.openGraph).toMatchObject({ title: '소개 | 인트', url: '/about', siteName: '인트', locale: 'ko_KR' });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
  });
  it('uses the absolute title as is and prefers a given image over the default', () => {
    const m = pageMetadata({ title: { absolute: '홈' }, description: '설명', path: '/', image: { url: 'https://a.com/i.png', width: 10, height: 20 } });
    expect(m.alternates?.canonical).toBe('/');
    expect(m.openGraph).toMatchObject({ title: '홈', images: [{ url: 'https://a.com/i.png', width: 10, height: 20 }] });
    expect(m.twitter).toMatchObject({ images: ['https://a.com/i.png'] });
    const dflt = pageMetadata({ title: 'x', description: 'y', path: '/x' });
    expect(dflt.openGraph).toMatchObject({ images: [{ url: '/opengraph-image', width: 1200, height: 630 }] });
    expect(dflt.twitter).toMatchObject({ images: ['/opengraph-image'] });
  });
});

describe('verificationMeta', () => {
  it('is undefined without values', () => {
    expect(verificationMeta(undefined, undefined)).toBeUndefined();
    expect(verificationMeta(' ', '')).toBeUndefined();
  });
  it('includes only the provided engines', () => {
    expect(verificationMeta('g-token', undefined)).toEqual({ google: 'g-token' });
    expect(verificationMeta(undefined, 'n-token')).toEqual({ other: { 'naver-site-verification': 'n-token' } });
    expect(verificationMeta('g', 'n')).toEqual({ google: 'g', other: { 'naver-site-verification': 'n' } });
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so a script tag cannot be closed (XSS regression)', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>', a: '<!--' });
    expect(out).not.toContain('<');
    expect(out).toContain('\\u003c/script>');
    expect(JSON.parse(out)).toEqual({ name: '</script><script>alert(1)</script>', a: '<!--' });
  });
  it('escapes line separators', () => {
    const out = serializeJsonLd({ t: 'a\u2028b\u2029c' });
    expect(out).not.toMatch(/[\u2028\u2029]/);
    expect(JSON.parse(out).t).toBe('a\u2028b\u2029c');
  });
});

describe('realUrl', () => {
  it('rejects placeholders and non-http urls', () => {
    for (const v of [undefined, '', '#', 'nope', 'https://www.instagram.com/', 'https://forms.gle', 'javascript:alert(1)']) {
      expect(realUrl(v)).toBeNull();
    }
  });
  it('accepts urls with a path', () => {
    expect(realUrl('https://www.instagram.com/int_sejong')).toBe('https://www.instagram.com/int_sejong');
  });
});

describe('JSON-LD builders', () => {
  const base = 'https://example.com';
  it('organization keeps only real sameAs urls', () => {
    const none = organizationJsonLd({ instagram: 'https://www.instagram.com/', kakao: 'https://pf.kakao.com/' }, base);
    expect(none).not.toHaveProperty('sameAs');
    const some = organizationJsonLd({ instagram: 'https://www.instagram.com/int', kakao: 'https://pf.kakao.com/' }, base);
    expect(some).toMatchObject({
      '@type': 'Organization',
      name: '인트',
      alternateName: '세종대학교 인공지능융합대학 학생회',
      url: 'https://example.com/',
      logo: 'https://example.com/brand/logo.svg',
      sameAs: ['https://www.instagram.com/int'],
    });
  });
  it('website', () => {
    expect(websiteJsonLd(base)).toMatchObject({ '@type': 'WebSite', name: '인트', url: 'https://example.com/', inLanguage: 'ko-KR' });
  });
  it('faq', () => {
    expect(faqJsonLd([{ q: '질문', a: '답' }])).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: '질문', acceptedAnswer: { '@type': 'Answer', text: '답' } }],
    });
  });
  const contest: Contest = {
    id: 'c1',
    title: '공모전',
    start: '2026-11-01',
    end: '2026-11-30',
    popup: false,
    desc: '설명',
    target: '',
    prize: '',
    contact: '',
  };
  it('contest uses the school as the place without an apply link', () => {
    const e = contestJsonLd(contest, base);
    expect(e).toMatchObject({ '@type': 'Event', name: '공모전', startDate: '2026-11-01', endDate: '2026-11-30', url: 'https://example.com/contest/c1' });
    expect(e.location).toMatchObject({ '@type': 'Place', name: '세종대학교' });
    expect(e.organizer).toMatchObject({ '@type': 'Organization', name: '인트' });
  });
  it('contest is a virtual location with an apply link', () => {
    const e = contestJsonLd({ ...contest, applyUrl: 'https://forms.gle/abc' }, base);
    expect(e.location).toEqual({ '@type': 'VirtualLocation', url: 'https://forms.gle/abc' });
  });
});

describe('robots', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('allows crawling in production and locally', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(robots().rules).toEqual({ userAgent: '*', allow: '/' });
    vi.stubEnv('VERCEL_ENV', '');
    expect(robots().rules).toEqual({ userAgent: '*', allow: '/' });
  });
  it('blocks everything on preview deployments', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });
});

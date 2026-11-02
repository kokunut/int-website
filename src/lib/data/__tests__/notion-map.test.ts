import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  blocksToLines,
  dedupeBy,
  mapBanner,
  mapContest,
  mapDoc,
  mapFaq,
  mapNotice,
  mapPartner,
  mapPopup,
  mapSuggest,
  safeHref,
  safeImageSrc,
  safeInstagramUrl,
  sortByOrder,
} from '../notion-map';
import type { NotionBlock, NotionPage } from '../notion-types';
import blocks from './fixtures/blocks.json';
import banner from './fixtures/banner.json';
import contest from './fixtures/contest.json';
import contestBad from './fixtures/contest-bad-slug.json';
import doc from './fixtures/doc.json';
import faq from './fixtures/faq.json';
import notice from './fixtures/notice.json';
import noticeNoNumber from './fixtures/notice-no-number.json';
import partner from './fixtures/partner.json';
import suggest from './fixtures/suggest.json';

const pg = (x: unknown): NotionPage => x as NotionPage;

describe('notion mappers', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('mapNotice', () => {
    expect(mapNotice(pg(notice), ['본문'])).toEqual({
      id: 6,
      type: '행사',
      title: '학술제 참가팀 모집',
      date: '2026-10-26',
      event: { start: '2026-11-03', end: '2026-11-14' },
      body: ['본문'],
    });
  });

  it('mapNotice: 번호 없으면 건너뛰고 DB 이름을 경고', () => {
    expect(mapNotice(pg(noticeNoNumber))).toBeNull();
    expect(warn.mock.calls[0][0]).toContain('NOTION_DB_NOTICES');
  });

  it('mapNotice: 행사기간 없으면 event 키 없음', () => {
    const p = pg({ id: 'x', properties: { ...notice.properties, 행사기간: { type: 'date', date: null } } });
    expect(mapNotice(p)).not.toHaveProperty('event');
  });

  const PAGE_ID = '0123456789abcdef0123456789abcdef';
  const withCards = (files: unknown[], instagram?: string) =>
    pg({
      id: PAGE_ID,
      properties: {
        ...notice.properties,
        유형: { type: 'select', select: { name: '카드뉴스' } },
        카드뉴스: { type: 'files', files },
        ...(instagram !== undefined ? { 인스타그램: { type: 'url', url: instagram } } : {}),
      },
    });
  const upload = { type: 'file', file: { url: 'https://s3.example/a.png?sig=1' } };
  const external = (url: string) => ({ type: 'external', external: { url } });

  it('mapNotice: 카드뉴스 — 업로드는 인덱스별 안정 경로, 외부 링크는 https 만, 순서 유지', () => {
    const n = mapNotice(withCards([upload, external('https://img.example/b.png'), external('http://img.example/c.png'), upload]));
    expect(n?.type).toBe('카드뉴스');
    expect(n?.cards).toEqual([
      `/api/notion-file/${PAGE_ID}/notice-images/0`,
      'https://img.example/b.png',
      `/api/notion-file/${PAGE_ID}/notice-images/3`,
    ]);
  });

  it('mapNotice: 카드뉴스 최대 20장, 파일 없으면 cards 키 없음', () => {
    expect(mapNotice(withCards(Array.from({ length: 25 }, () => upload)))?.cards).toHaveLength(20);
    expect(mapNotice(withCards([]))).not.toHaveProperty('cards');
    expect(mapNotice(pg(notice))).not.toHaveProperty('instagram');
  });

  it('mapNotice: 인스타그램 링크는 instagram.com 만', () => {
    expect(mapNotice(withCards([], 'https://www.instagram.com/p/abc/'))?.instagram).toBe('https://www.instagram.com/p/abc/');
    expect(mapNotice(withCards([], 'https://evil.example/instagram.com'))).not.toHaveProperty('instagram');
  });

  it('safeInstagramUrl', () => {
    expect(safeInstagramUrl('https://instagram.com/int')).toBe('https://instagram.com/int');
    expect(safeInstagramUrl('https://www.instagram.com/p/x')).toBe('https://www.instagram.com/p/x');
    for (const bad of ['http://www.instagram.com/p/x', 'https://notinstagram.com/', 'https://instagram.com.evil.example/', 'javascript:alert(1)', '/notice', '', null, undefined]) {
      expect(safeInstagramUrl(bad)).toBe('');
    }
  });

  it('mapContest', () => {
    const c = mapContest(pg(contest));
    expect(c).toMatchObject({
      id: 'c2026-ai',
      start: '2026-10-20',
      end: '2026-11-15',
      popup: true,
      schedule: [
        { label: '접수', value: '2026.10.20 ~ 11.15' },
        { label: '본선', value: '2026.11.27' },
      ],
      prizes: [{ rank: '대상', count: '1팀', amount: '50만 원' }],
      howTo: [{ title: '신청서 작성', desc: '구글폼 제출' }],
      notes: ['표절 금지', '저작권은 참가자에게'],
      applyUrl: 'https://forms.gle/x',
    });
    expect(c).not.toHaveProperty('guideUrl');
    expect(c).not.toHaveProperty('result');
  });

  it('mapContest: 슬러그 형식 오류는 null', () => {
    expect(mapContest(pg(contestBad))).toBeNull();
    expect(warn.mock.calls[0][0]).toContain('NOTION_DB_CONTESTS');
  });

  it('mapPartner: 빈 선택 항목은 키를 생략(기본값이 채워지도록)', () => {
    const p = mapPartner(pg(partner));
    expect(p).toEqual({
      id: 'oo-restaurant',
      name: 'OO식당',
      cat: '식당',
      benefit: '10% 할인',
      place: '정문 앞',
      condition: '1인 1회',
      mapUrl: 'https://naver.me/x',
      details: ['전 메뉴 10% 할인', '음료 서비스'],
    });
    expect(p).not.toHaveProperty('hours');
  });

  it('mapDoc: 분류 변환과 날짜 시각 제거', () => {
    expect(mapDoc(pg(doc))).toEqual({
      category: 'minutes',
      item: {
        id: 'm-2026-10',
        title: '10월 회의록',
        date: '2026-10-08',
        by: '사무부',
        summary: ['안건 1', '안건 2'],
        file: 'https://drive.google.com/x',
      },
    });
  });

  it('mapDoc: 모르는 분류는 null', () => {
    const p = pg({ id: 'x', properties: { ...doc.properties, 분류: { type: 'select', select: { name: '기타' } } } });
    expect(mapDoc(p)).toBeNull();
  });

  it('mapBanner: file/external 첫 URL', () => {
    expect(mapBanner(pg(banner))).toEqual({
      image: 'https://s3.example/a.png?sig=1',
      imageMobile: 'https://cdn.example/m.png',
      href: '/about',
      word: 'INT',
      slogan: '인트가 함께합니다',
      placeLabel: 'PLACE',
      place: 'OO관',
      links: [{ label: 'Instagram', value: '@int' }],
    });
  });

  it('mapBanner: 업로드 파일은 내부 안정 경로, 외부 링크는 원래 URL', () => {
    const id = '0123456789abcdef0123456789abcdef';
    const b = mapBanner(pg({ ...banner, id }));
    expect(b?.image).toBe(`/api/notion-file/${id}/banner-image/0`);
    expect(b?.imageMobile).toBe('https://cdn.example/m.png');
  });

  it('mapFaq / mapSuggest', () => {
    expect(mapFaq(pg(faq))).toEqual({ q: '언제 지급되나요?', a: '지급일에 일괄 지급' });
    expect(mapSuggest(pg(suggest))).toEqual({ title: '열람실 연장', answer: '확정되었습니다', date: '2026-10-20' });
    expect(mapFaq(pg({ id: 'x', properties: {} }))).toBeNull();
  });

  it('blocksToLines: 텍스트 블록만', () => {
    expect(blocksToLines(blocks as NotionBlock[])).toEqual(['첫 문단', '소제목', '항목 하나', '번호 항목']);
  });

  it('sortByOrder: 비어 있으면 뒤, 같으면 원래 순서', () => {
    const mk = (id: string, v: number | null): NotionPage => ({ id, properties: { 순서: { type: 'number', number: v } } });
    const out = sortByOrder([mk('a', null), mk('b', 2), mk('c', 1), mk('d', null)], '순서').map((p) => p.id);
    expect(out).toEqual(['c', 'b', 'a', 'd']);
  });

  it('safeHref / safeImageSrc', () => {
    expect(safeHref('javascript:alert(1)')).toBe('');
    expect(safeHref(' JAVASCRIPT:alert(1)')).toBe('');
    expect(safeHref('data:text/html,x')).toBe('');
    expect(safeHref('//evil.com')).toBe('');
    expect(safeHref('/\\evil.com')).toBe('');
    expect(safeHref('/notice/1')).toBe('/notice/1');
    expect(safeHref('https://forms.gle/x')).toBe('https://forms.gle/x');
    expect(safeHref('http://a.b')).toBe('http://a.b');
    expect(safeHref(null)).toBe('');
    expect(safeImageSrc('http://a.b/x.png')).toBeNull();
    expect(safeImageSrc('data:image/png;base64,AA')).toBeNull();
    expect(safeImageSrc('https://a.b/x.png')).toBe('https://a.b/x.png');
  });

  it('위험한 URL 은 매퍼에서 비워진다', () => {
    const p = pg({ id: 'x', properties: { ...contest.properties, 신청링크: { type: 'url', url: 'javascript:alert(1)' } } });
    expect(mapContest(p)).not.toHaveProperty('applyUrl');
    const b = pg({ id: 'y', properties: { ...banner.properties, 링크: { type: 'rich_text', rich_text: [{ plain_text: '//evil.com' }] } } });
    expect(mapBanner(b)).toBeNull();
  });

  it('mapDoc: 사이트 탭 이름과 예전 별칭', () => {
    const mk = (n: string) => pg({ id: 'x', properties: { ...doc.properties, 분류: { type: 'select', select: { name: n } } } });
    expect(mapDoc(mk('활동계획서·결산'))?.category).toBe('plans');
    expect(mapDoc(mk('서식'))?.category).toBe('forms');
    expect(mapDoc(mk('양식'))?.category).toBe('forms');
  });

  describe('mapPopup', () => {
    const rt = (s: string) => ({ type: 'rich_text', rich_text: [{ plain_text: s }] });
    const base = (over: Record<string, unknown> = {}) =>
      pg({
        id: '0123456789abcdef0123456789abcdef',
        properties: {
          제목: { type: 'title', title: [{ plain_text: 'OO식당 제휴' }] },
          슬러그: rt('p-open'),
          분류: { type: 'select', select: { name: '제휴' } },
          기간: { type: 'date', date: { start: '2026-11-01', end: '2026-11-14' } },
          내용: rt('10% 할인'),
          링크: { type: 'url', url: '/partners/p1' },
          버튼문구: rt(''),
          순서: { type: 'number', number: 2 },
          공개: { type: 'checkbox', checkbox: true },
          ...over,
        },
      });

    it('필수·선택 속성을 읽고 버튼 문구는 기본값으로 채운다', () => {
      expect(mapPopup(base())).toEqual({
        id: 'p-open',
        title: 'OO식당 제휴',
        cat: '제휴',
        start: '2026-11-01',
        end: '2026-11-14',
        desc: '10% 할인',
        image: null,
        href: '/partners/p1',
        cta: '자세히 보기',
        order: 2,
      });
    });

    it('이미지: 업로드는 안정 경로, 외부 https 는 그대로, http 는 제외', () => {
      const upload = mapPopup(base({ 이미지: { type: 'files', files: [{ file: { url: 'https://s3.example/a.png?sig=1' } }] } }));
      expect(upload?.image).toBe('/api/notion-file/0123456789abcdef0123456789abcdef/popup-image/0');
      expect(mapPopup(base({ 이미지: { type: 'files', files: [{ external: { url: 'https://cdn.example/a.png' } }] } }))?.image).toBe(
        'https://cdn.example/a.png',
      );
      expect(mapPopup(base({ 이미지: { type: 'files', files: [{ external: { url: 'http://cdn.example/a.png' } }] } }))?.image).toBeNull();
    });

    it('버튼문구·순서 없음, 기간 하루, 위험한 링크는 비운다', () => {
      const m = mapPopup(
        base({ 버튼문구: rt('신청하기'), 순서: { type: 'number', number: null }, 기간: { type: 'date', date: { start: '2026-11-03' } }, 링크: { type: 'url', url: 'javascript:alert(1)' } }),
      );
      expect(m).toMatchObject({ cta: '신청하기', start: '2026-11-03', end: '2026-11-03', href: '' });
      expect(m).not.toHaveProperty('order');
    });

    it('슬러그·제목·분류·기간이 잘못되면 DB 이름과 함께 건너뛴다', () => {
      expect(mapPopup(base({ 슬러그: rt('Bad Slug') }))).toBeNull();
      expect(mapPopup(base({ 제목: { type: 'title', title: [] } }))).toBeNull();
      expect(mapPopup(base({ 분류: { type: 'select', select: { name: '기타' } } }))).toBeNull();
      expect(mapPopup(base({ 기간: { type: 'date', date: null } }))).toBeNull();
      expect(warn).toHaveBeenCalledTimes(4);
      expect(warn.mock.calls.every((c: unknown[]) => String(c[0]).includes('NOTION_DB_POPUPS'))).toBe(true);
    });
  });

  it('dedupeBy: 먼저 나온 것만 남기고 경고', () => {
    expect(dedupeBy('DB', [{ k: 'a', v: 1 }, { k: 'a', v: 2 }, { k: 'b', v: 3 }], (x) => x.k).map((x) => x.v)).toEqual([1, 3]);
    expect(warn.mock.calls[0][0]).toContain('중복');
  });
});

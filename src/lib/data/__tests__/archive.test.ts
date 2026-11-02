import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { archive } from '@/content/archive';
import { filterArchive, sortArchive, topicsOf } from '../../archive';
import type { ArchivePost } from '../../types';
import { blocksToContent, mapArchive } from '../notion-map';
import { ARCHIVE_TOPICS, DB_SPECS } from '../notion-schema';
import { contentToNotionBlocks, toNotionPage } from '../notion-setup';
import { fileProxyPath, parseFileProxyParams } from '../file-proxy';
import type { NotionBlock, NotionPage, NotionProperty } from '../notion-types';

const pg = (x: unknown): NotionPage => x as NotionPage;
const rt = (s: string) => [{ plain_text: s }];
const PAGE_ID = '0123456789abcdef0123456789abcdef';

const base = (over: Record<string, unknown> = {}): NotionPage =>
  pg({
    id: PAGE_ID,
    properties: {
      제목: { type: 'title', title: rt('자격증 로드맵') },
      슬러그: { type: 'rich_text', rich_text: rt('cert-roadmap') },
      분류: { type: 'select', select: { name: '취업' } },
      주제: { type: 'select', select: { name: '자격증' } },
      날짜: { type: 'date', date: { start: '2026-10-20', end: null } },
      요약: { type: 'rich_text', rich_text: rt('요약 문장') },
      첨부: { type: 'files', files: [] },
      링크: { type: 'url', url: 'https://example.com/a' },
      고정: { type: 'checkbox', checkbox: true },
      공개: { type: 'checkbox', checkbox: true },
      ...over,
    },
  });

const block = (type: string, inner: Record<string, unknown>): NotionBlock => ({ type, [type]: inner });
const text = (type: string, s: string, extra: Record<string, unknown> = {}) => block(type, { rich_text: rt(s), ...extra });

describe('blocksToContent', () => {
  it('문단·제목(1·2→h2, 3→h3)', () => {
    expect(blocksToContent([text('paragraph', '문단'), text('heading_1', '큰'), text('heading_2', '중'), text('heading_3', '작')])).toEqual([
      { type: 'paragraph', text: '문단' },
      { type: 'heading', level: 2, text: '큰' },
      { type: 'heading', level: 2, text: '중' },
      { type: 'heading', level: 3, text: '작' },
    ]);
  });

  it('연속된 같은 종류 목록 항목은 하나로 묶고, 종류가 바뀌면 나눈다', () => {
    expect(
      blocksToContent([
        text('bulleted_list_item', 'a'),
        text('bulleted_list_item', 'b'),
        text('numbered_list_item', '1'),
        text('paragraph', '끊김'),
        text('bulleted_list_item', 'c'),
      ]),
    ).toEqual([
      { type: 'list', ordered: false, items: ['a', 'b'] },
      { type: 'list', ordered: true, items: ['1'] },
      { type: 'paragraph', text: '끊김' },
      { type: 'list', ordered: false, items: ['c'] },
    ]);
  });

  it('인용·콜아웃(이모지 아이콘)·구분선·체크리스트', () => {
    expect(
      blocksToContent([
        text('quote', '인용'),
        text('callout', '알림', { icon: { type: 'emoji', emoji: '📌' } }),
        text('callout', '아이콘 없음', { icon: { type: 'external', external: { url: 'https://x' } } }),
        block('divider', {}),
        text('to_do', '할 일', { checked: true }),
        text('to_do', '안 한 일'),
      ]),
    ).toEqual([
      { type: 'quote', text: '인용' },
      { type: 'callout', text: '알림', icon: '📌' },
      { type: 'callout', text: '아이콘 없음' },
      { type: 'divider' },
      { type: 'todo', text: '할 일', checked: true },
      { type: 'todo', text: '안 한 일', checked: false },
    ]);
  });

  it('이미지: 외부 https 만, 업로드·http 는 건너뜀, 캡션을 대체 텍스트로', () => {
    expect(
      blocksToContent([
        block('image', { type: 'external', external: { url: 'https://img.example/a.png' }, caption: rt('설명') }),
        block('image', { type: 'external', external: { url: 'http://img.example/b.png' }, caption: [] }),
        block('image', { type: 'file', file: { url: 'https://s3.example/c.png' }, caption: [] }),
      ]),
    ).toEqual([{ type: 'image', src: 'https://img.example/a.png', caption: '설명' }]);
  });

  it('빈 텍스트·지원하지 않는 타입은 건너뛴다', () => {
    expect(blocksToContent([text('paragraph', '  '), text('quote', ''), block('table', {}), text('code', 'x')])).toEqual([]);
  });
});

describe('mapArchive', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('필수·선택 속성을 읽는다', () => {
    expect(mapArchive(base())).toEqual({
      id: 'cert-roadmap',
      category: 'career',
      title: '자격증 로드맵',
      topic: '자격증',
      date: '2026-10-20',
      summary: '요약 문장',
      attachments: [],
      link: 'https://example.com/a',
      pinned: true,
      blocks: [],
    });
  });

  it('병영 분류, 선택 속성이 비면 빈 값', () => {
    const p = mapArchive(
      base({
        분류: { type: 'select', select: { name: '병영' } },
        주제: { type: 'select', select: null },
        링크: { type: 'url', url: null },
        고정: { type: 'checkbox', checkbox: false },
        요약: { type: 'rich_text', rich_text: [] },
      }),
    );
    expect(p).toMatchObject({ category: 'military', topic: '', link: '', pinned: false, summary: '' });
  });

  it('첨부: 업로드는 안정 경로(이름 유지), 외부는 https 만, 이름 없으면 "첨부 n", 최대 20개', () => {
    const files = [
      { name: '안내문.pdf', file: { url: 'https://s3.example/a.pdf' } },
      { name: '외부.pdf', external: { url: 'https://example.com/b.pdf' } },
      { name: 'http.pdf', external: { url: 'http://example.com/c.pdf' } },
      { file: { url: 'https://s3.example/d.pdf' } },
    ];
    const p = mapArchive(base({ 첨부: { type: 'files', files } }));
    expect(p?.attachments).toEqual([
      { name: '안내문.pdf', href: `/api/notion-file/${PAGE_ID}/archive-files/0` },
      { name: '외부.pdf', href: 'https://example.com/b.pdf' },
      { name: '첨부 4', href: `/api/notion-file/${PAGE_ID}/archive-files/3` },
    ]);
    const many = Array.from({ length: 25 }, () => ({ name: 'f', file: { url: 'https://s3.example/x' } }));
    expect(mapArchive(base({ 첨부: { type: 'files', files: many } }))?.attachments).toHaveLength(20);
  });

  it('링크는 safeHref 를 거친다', () => {
    expect(mapArchive(base({ 링크: { type: 'url', url: 'javascript:alert(1)' } }))?.link).toBe('');
  });

  it.each([
    ['슬러그 형식 오류', { 슬러그: { type: 'rich_text', rich_text: rt('Bad Slug') } }],
    ['분류 오류', { 분류: { type: 'select', select: { name: '기타' } } }],
    ['제목 없음', { 제목: { type: 'title', title: [] } }],
    ['날짜 없음', { 날짜: { type: 'date', date: null } }],
  ])('%s -> 건너뛰고 DB 이름을 경고', (_n, over) => {
    expect(mapArchive(base(over))).toBeNull();
    expect(warn.mock.calls[0][0]).toContain('NOTION_DB_ARCHIVE');
  });
});

describe('안정 경로 필드 archive-files', () => {
  it('경로 생성·검증', () => {
    expect(fileProxyPath(PAGE_ID, 'archive-files', 2)).toBe(`/api/notion-file/${PAGE_ID}/archive-files/2`);
    expect(parseFileProxyParams({ pageId: PAGE_ID, field: 'archive-files', index: '2' })).toEqual({
      pageId: PAGE_ID,
      field: 'archive-files',
      index: 2,
    });
  });
});

describe('아카이브 스키마·목 데이터', () => {
  it('DB_SPECS 에 아카이브가 있고 주제 옵션을 미리 만든다', () => {
    const spec = DB_SPECS.find((s) => s.key === 'archive');
    expect(spec?.env).toBe('NOTION_DB_ARCHIVE');
    expect(spec?.props.find((p) => p.name === '분류')?.options).toEqual(['취업', '병영']);
    expect(spec?.props.find((p) => p.name === '주제')?.options).toEqual([...ARCHIVE_TOPICS.career, ...ARCHIVE_TOPICS.military]);
    expect(spec?.props.find((p) => p.name === '첨부')?.type).toBe('files');
  });

  it('목 데이터: 취업 3건·병영 3건, 슬러그 형식·분류별 유일', () => {
    expect(archive.filter((a) => a.category === 'career')).toHaveLength(3);
    expect(archive.filter((a) => a.category === 'military')).toHaveLength(3);
    const keys = archive.map((a) => `${a.category}/${a.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const a of archive) {
      expect(a.id).toMatch(/^[a-z0-9-]+$/);
      expect(a.title).toContain('예시');
    }
  });

  it('시드 왕복: 속성과 본문 블록이 그대로 돌아온다', () => {
    const plain = (v: unknown) => (v as { text: { content: string } }[]).map((r) => ({ plain_text: r.text.content }));
    for (const a of archive) {
      const payload = toNotionPage('archive', a);
      const properties: NotionPage['properties'] = {};
      for (const [name, v] of Object.entries(payload.properties as Record<string, Record<string, unknown>>)) {
        const [type, val] = Object.entries(v)[0];
        properties[name] = { type, [type]: type === 'title' || type === 'rich_text' ? plain(val) : val } as unknown as NotionProperty;
      }
      const blocks = (payload.children ?? []).map((c) => {
        const b = c as { type: string } & Record<string, { rich_text?: unknown } | undefined>;
        const inner = b[b.type] ?? {};
        return { type: b.type, [b.type]: { ...inner, rich_text: inner.rich_text ? plain(inner.rich_text) : [] } } as NotionBlock;
      });
      expect(mapArchive({ id: PAGE_ID, properties }, blocksToContent(blocks))).toEqual({ ...a, attachments: [] });
      expect(contentToNotionBlocks(a.blocks)).toHaveLength(payload.children?.length ?? 0);
    }
  });
});

describe('아카이브 목록 도우미', () => {
  const post = (id: string, over: Partial<ArchivePost>): ArchivePost => ({
    id,
    category: 'career',
    title: id,
    topic: '',
    date: '2026-10-01',
    summary: '',
    attachments: [],
    link: '',
    pinned: false,
    blocks: [],
    ...over,
  });

  it('sortArchive: 고정 글 먼저, 날짜 내림차순', () => {
    const list = [post('a', { date: '2026-10-01' }), post('b', { date: '2026-10-09' }), post('c', { date: '2026-09-01', pinned: true })];
    expect(sortArchive(list).map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });

  it('topicsOf: 정해 둔 순서 → 새 주제, 글 없는 주제는 제외', () => {
    const list = [post('a', { topic: '자격증' }), post('b', { topic: '채용공고' }), post('c', { topic: '새주제' }), post('d', {})];
    expect(topicsOf(list, ARCHIVE_TOPICS.career)).toEqual(['채용공고', '자격증', '새주제']);
  });

  it('filterArchive: 주제 + 제목 검색(공백 무시)', () => {
    const list = [post('a', { title: '자격증 안내', topic: '자격증' }), post('b', { title: '채용 안내', topic: '채용공고' })];
    expect(filterArchive(list, '', '').map((p) => p.id)).toEqual(['a', 'b']);
    expect(filterArchive(list, '자격증', '').map((p) => p.id)).toEqual(['a']);
    expect(filterArchive(list, '', ' 채용 ').map((p) => p.id)).toEqual(['b']);
    expect(filterArchive(list, '자격증', '채용')).toEqual([]);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildIndex } from '../build-index';
import type { NotionPage } from '../notion-types';

const pg = (id: string): NotionPage => ({ id, properties: {} }) as unknown as NotionPage;
const map = (p: NotionPage): { n: number } | null => (p.id.startsWith('bad') ? null : { n: Number(p.id.split('-')[0]) });

describe('buildIndex', () => {
  afterEach(() => vi.restoreAllMocks());

  it('map 이 null 인 행은 건너뛰고 키 -> 페이지 id 를 만든다', () => {
    const out = buildIndex([pg('1-a'), pg('bad'), pg('2-a')], map, (x) => x.n, 'DB');
    expect(out.list).toEqual([{ n: 1 }, { n: 2 }]);
    expect([...out.pageIds]).toEqual([
      [1, '1-a'],
      [2, '2-a'],
    ]);
  });

  it('키가 겹치면 먼저 나온 행만 남기고 경고한다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = buildIndex([pg('1-first'), pg('1-second')], map, (x) => x.n, 'NOTION_DB_NOTICES', (k) => `번호 ${k}`);
    expect(out.list).toHaveLength(1);
    expect(out.pageIds.get(1)).toBe('1-first');
    expect(warn).toHaveBeenCalledWith('[data] NOTION_DB_NOTICES 중복 건너뜀: 번호 1 (먼저 나온 행만 사용)');
  });

  it('표기 함수가 없으면 키 그대로 경고한다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    buildIndex([pg('1-a'), pg('1-b')], map, (x) => `cat/${x.n}`, 'NOTION_DB_ARCHIVE');
    expect(warn).toHaveBeenCalledWith('[data] NOTION_DB_ARCHIVE 중복 건너뜀: cat/1 (먼저 나온 행만 사용)');
  });
});

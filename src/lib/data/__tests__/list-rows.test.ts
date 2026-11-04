import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FILE_FIELDS } from '../file-proxy';
import { listRows } from '../notion';
import { DB } from '../notion-map';
import { DB_QUERY, DEFAULT_SORTS } from '../notion-schema';

const DB_ID = 'fedcba9876543210fedcba9876543210';

describe('listRows / DB_QUERY', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.NOTION_TOKEN = 'test-token';
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ results: [], has_more: false, next_cursor: null })));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NOTION_TOKEN;
  });

  const bodyOf = (call: number): unknown => JSON.parse(fetchMock.mock.calls[call][1].body as string);

  it('같은 dbKey 로 부르면 로더와 프록시의 요청 본문이 같다', async () => {
    for (const dbKey of Object.values(DB)) {
      fetchMock.mockClear();
      await listRows(dbKey, DB_ID); // 로더 경로
      await listRows(dbKey, DB_ID); // 프록시 경로
      expect(bodyOf(0)).toEqual(bodyOf(1));
    }
  });

  it('DB_QUERY 의 정렬 뒤에 만든 시각 오름차순을 보조 정렬로 붙인다', async () => {
    for (const dbKey of Object.keys(DB_QUERY)) {
      fetchMock.mockClear();
      await listRows(dbKey, DB_ID);
      expect(bodyOf(0)).toEqual(expect.objectContaining({ sorts: [...DB_QUERY[dbKey].sorts, ...DEFAULT_SORTS] }));
    }
  });

  it('정의가 없는 DB 는 만든 시각 오름차순(timestamp 정렬)으로 조회한다', async () => {
    await listRows(DB.banners, DB_ID);
    expect(bodyOf(0)).toMatchObject({ sorts: [{ timestamp: 'created_time', direction: 'ascending' }] });
  });

  it('DB_QUERY 키는 모두 알려진 DB 환경변수다', () => {
    const known = new Set<string>(Object.values(DB));
    for (const key of Object.keys(DB_QUERY)) expect(known.has(key)).toBe(true);
  });

  it('FILE_FIELDS 의 DB 환경변수는 모두 알려진 DB 환경변수다', () => {
    const known = new Set<string>(Object.values(DB));
    for (const f of Object.values(FILE_FIELDS)) expect(known.has(f.dbEnv)).toBe(true);
  });
});

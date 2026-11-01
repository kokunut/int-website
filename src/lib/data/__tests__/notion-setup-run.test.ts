import { describe, expect, it } from 'vitest';
import { DB_SPECS } from '../notion-schema';
import { dbTitle, type PagePayload } from '../notion-setup';
import { MAX_CHILDREN, createApi, createRow, runSetup, seedRows, type Api, type SetupOptions } from '../notion-setup-run';

const PARENT = 'a'.repeat(32);

interface FakeDb {
  title: string;
  rows: { properties: unknown; blocks: unknown[] }[];
}

/** 인메모리 가짜 노션 (fetch 모양). 페이지당 children 100개 제한도 흉내 낸다 */
function createFakeNotion() {
  const dbs = new Map<string, FakeDb>();
  const pages = new Map<string, { blocks: unknown[] }>();
  const calls: string[] = [];
  const throttle: { remaining: number; retryAfter: string | null } = { remaining: 0, retryAfter: '3' };
  let seq = 0;
  const newId = (): string => (++seq).toString(16).padStart(32, '0');
  const json = (status: number, body: unknown, headers: Record<string, string> = {}): Response =>
    new Response(JSON.stringify(body), { status, headers });

  const fakeFetch = (async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));
    const path = url.pathname.replace(/^\/v1/, '');
    const method = init?.method ?? 'GET';
    calls.push(`${method} ${path}`);
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

    if (throttle.remaining > 0) {
      throttle.remaining--;
      return json(429, { message: 'rate limited' }, throttle.retryAfter ? { 'Retry-After': throttle.retryAfter } : {});
    }

    if (method === 'GET' && path === `/blocks/${PARENT}/children`) {
      const results = [...dbs].map(([id, d]) => ({ id, type: 'child_database', child_database: { title: d.title } }));
      return json(200, { results, has_more: false, next_cursor: null });
    }
    if (method === 'POST' && path === '/databases') {
      const title = (body.title as { text: { content: string } }[])[0].text.content;
      const id = newId();
      dbs.set(id, { title, rows: [] });
      return json(200, { id });
    }
    const q = /^\/databases\/([0-9a-f]+)\/query$/.exec(path);
    if (method === 'POST' && q) return json(200, { results: (dbs.get(q[1])?.rows ?? []).slice(0, 1) });
    if (method === 'POST' && path === '/pages') {
      const children = (body.children as unknown[] | undefined) ?? [];
      if (children.length > MAX_CHILDREN) return json(400, { message: 'children length should be <= 100' });
      const db = dbs.get((body.parent as { database_id: string }).database_id);
      if (!db) return json(404, { message: 'database not found' });
      const id = newId();
      const blocks = [...children];
      db.rows.push({ properties: body.properties, blocks });
      pages.set(id, { blocks });
      return json(200, { id });
    }
    const b = /^\/blocks\/([0-9a-f]+)\/children$/.exec(path);
    if (method === 'PATCH' && b) {
      const children = body.children as unknown[];
      if (children.length > MAX_CHILDREN) return json(400, { message: 'children length should be <= 100' });
      const page = pages.get(b[1]);
      if (!page) return json(404, { message: 'block not found' });
      page.blocks.push(...children);
      return json(200, { results: [] });
    }
    return json(404, { message: `no route ${method} ${path}` });
  }) as typeof fetch;

  return { dbs, calls, throttle, fetch: fakeFetch, count: (call: string) => calls.filter((c) => c === call).length };
}

function setup(notion: ReturnType<typeof createFakeNotion>) {
  const sleeps: number[] = [];
  const logs: string[] = [];
  const files = new Map<string, string>();
  let clock = 0;
  const sleep = async (ms: number): Promise<void> => {
    sleeps.push(ms);
    clock += ms;
  };
  const log = (m: string): void => void logs.push(m);
  const api = createApi({ token: 't', fetch: notion.fetch, sleep, now: () => clock, log });
  const run = (opts: Partial<SetupOptions> = {}) =>
    runSetup(
      { dryRun: false, seed: false, writeEnv: false, parent: PARENT, ...opts },
      {
        token: 't',
        api,
        log,
        readFile: (p) => files.get(p) ?? null,
        writeFile: (p, c) => void files.set(p, c),
      },
    );
  return { run, sleeps, logs, files, api };
}

const totalRows = (n: ReturnType<typeof createFakeNotion>): number => [...n.dbs.values()].reduce((s, d) => s + d.rows.length, 0);

describe('runSetup (가짜 노션)', () => {
  it('첫 실행: DB 7개 생성 + --seed 시 행 생성', async () => {
    const notion = createFakeNotion();
    const { run } = setup(notion);
    const ids = await run({ seed: true });

    expect(notion.count('POST /databases')).toBe(DB_SPECS.length);
    expect(Object.keys(ids)).toEqual(DB_SPECS.map((s) => s.env));
    expect([...notion.dbs.values()].map((d) => d.title)).toEqual(DB_SPECS.map(dbTitle));
    for (const spec of DB_SPECS) {
      const db = [...notion.dbs.values()].find((d) => d.title === dbTitle(spec));
      expect(db?.rows.length).toBe(seedRows(spec.key).length);
    }
    expect(totalRows(notion)).toBeGreaterThan(0);
  });

  it('--seed 없이 실행하면 행을 만들지 않는다', async () => {
    const notion = createFakeNotion();
    await setup(notion).run();
    expect(notion.count('POST /pages')).toBe(0);
    expect(notion.dbs.size).toBe(DB_SPECS.length);
  });

  it('두 번째 실행: DB 재사용, 행이 있으면 시드 생략', async () => {
    const notion = createFakeNotion();
    const { run } = setup(notion);
    const first = await run({ seed: true });
    const rowsAfterFirst = totalRows(notion);
    notion.calls.length = 0;

    const second = await run({ seed: true });

    expect(second).toEqual(first);
    expect(notion.count('POST /databases')).toBe(0);
    expect(notion.count('POST /pages')).toBe(0);
    expect(totalRows(notion)).toBe(rowsAfterFirst);
    expect(notion.dbs.size).toBe(DB_SPECS.length);
  });

  it('재사용한 DB 가 비어 있으면 시드한다', async () => {
    const notion = createFakeNotion();
    const { run } = setup(notion);
    await run();
    notion.calls.length = 0;
    await run({ seed: true });
    expect(notion.count('POST /databases')).toBe(0);
    expect(notion.count('POST /pages')).toBe(DB_SPECS.reduce((s, d) => s + seedRows(d.key).length, 0));
  });

  it('--dry-run: 네트워크 호출 0회', async () => {
    const notion = createFakeNotion();
    const { run, logs } = setup(notion);
    const ids = await run({ dryRun: true, seed: true });
    expect(notion.calls).toEqual([]);
    expect(ids).toEqual({});
    expect(logs.join('\n')).toContain('노션 호출 없음');
  });

  it('--write-env: NOTION_DB_* 키를 .env.local 에 병합한다', async () => {
    const notion = createFakeNotion();
    const { run, files } = setup(notion);
    files.set('.env.local', 'FOO=bar\n');
    const ids = await run({ writeEnv: true });
    const env = files.get('.env.local') ?? '';
    expect(env).toContain('FOO=bar');
    for (const [k, v] of Object.entries(ids)) expect(env).toContain(`${k}=${v}`);
  });

  it('토큰·부모가 없으면 오류', async () => {
    const notion = createFakeNotion();
    const { run } = setup(notion);
    await expect(run({ parent: undefined })).rejects.toThrow('부모 페이지');
    await expect(
      runSetup(
        { dryRun: false, seed: false, writeEnv: false, parent: PARENT },
        { log: () => {}, readFile: () => null, writeFile: () => {} },
      ),
    ).rejects.toThrow('NOTION_TOKEN');
    expect(notion.calls).toEqual([]);
  });
});

describe('429 재시도', () => {
  it('Retry-After 만큼 기다린 뒤 재시도한다 (sleep 주입)', async () => {
    const notion = createFakeNotion();
    const { run, sleeps } = setup(notion);
    notion.throttle.remaining = 2;
    notion.throttle.retryAfter = '3';

    await run();

    expect(sleeps.filter((ms) => ms === 3000)).toHaveLength(2);
    expect(notion.dbs.size).toBe(DB_SPECS.length);
  });

  it('Retry-After 가 없으면 1초 대기', async () => {
    const notion = createFakeNotion();
    const { run, sleeps } = setup(notion);
    notion.throttle.remaining = 1;
    notion.throttle.retryAfter = null;
    await run();
    expect(sleeps).toContain(1000);
  });

  it('계속 429 면 포기한다', async () => {
    const notion = createFakeNotion();
    const { run } = setup(notion);
    notion.throttle.remaining = 100;
    await expect(run()).rejects.toThrow('429');
  });

  it('429 가 아닌 오류는 메시지와 함께 던진다', async () => {
    const notion = createFakeNotion();
    const { api } = setup(notion);
    await expect(api('POST', '/pages', { parent: { database_id: 'ff' }, properties: {} })).rejects.toThrow(
      'Notion 404 POST /pages - database not found',
    );
  });
});

describe('createRow: 블록 100개 제한', () => {
  const paragraphs = (n: number): unknown[] =>
    Array.from({ length: n }, (_, i) => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `p${i}` } }] } }));

  async function create(n: number) {
    const notion = createFakeNotion();
    const { api } = setup(notion);
    const { id } = await api<{ id: string }>('POST', '/databases', { title: [{ text: { content: 'x' } }] });
    notion.calls.length = 0;
    const row: PagePayload = { properties: {}, children: paragraphs(n) };
    await createRow(api, id, row);
    return { notion, db: notion.dbs.get(id) as FakeDb };
  }

  it('100개 이하: POST 한 번으로 끝', async () => {
    const { notion, db } = await create(100);
    expect(notion.calls).toEqual(['POST /pages']);
    expect(db.rows[0].blocks).toHaveLength(100);
  });

  it('250개: 첫 100개는 POST, 나머지는 PATCH 100 + 50', async () => {
    const { notion, db } = await create(250);
    expect(notion.calls.map((c) => c.split(' ')[0])).toEqual(['POST', 'PATCH', 'PATCH']);
    expect(db.rows[0].blocks).toHaveLength(250);
    expect(db.rows[0].blocks).toEqual(paragraphs(250));
  });

  it('101개: PATCH 한 번 (1개)', async () => {
    const { notion, db } = await create(101);
    expect(notion.count('PATCH ' + notion.calls[1].split(' ')[1])).toBe(1);
    expect(db.rows[0].blocks).toHaveLength(101);
  });

  it('본문이 없으면 children 을 보내지 않는다', async () => {
    const notion = createFakeNotion();
    const sent: unknown[] = [];
    const api = (async (_m: string, path: string, body?: unknown) => {
      sent.push([path, body]);
      return { id: 'p' };
    }) as Api;
    await createRow(api, 'db', { properties: {} });
    expect(sent).toHaveLength(1);
    expect(JSON.stringify(sent[0])).not.toContain('children');
    expect(notion.calls).toEqual([]);
  });
});

/**
 * `npm run notion:setup` 의 실행 흐름. 노션 호출(`api`)·대기(`sleep`)·출력·파일 입출력을 주입받아
 * 인메모리 가짜 노션으로 테스트할 수 있다.
 */
import { archive } from '../../content/archive';
import { banners } from '../../content/banners';
import { popups } from '../../content/popups';
import { contests } from '../../content/contests';
import { docs } from '../../content/docs';
import { faq, suggestAnswers } from '../../content/faq';
import { notices } from '../../content/notices';
import { partners } from '../../content/partners';
import type { DocCategory } from '../types';
import { DB_SPECS } from './notion-schema';
import {
  buildDatabaseProperties,
  dbTitle,
  mergeEnv,
  parseNotionId,
  toNotionPage,
  type PagePayload,
  type SeedItems,
} from './notion-setup';

export type ApiMethod = 'GET' | 'POST' | 'PATCH';
export type Api = <T>(method: ApiMethod, path: string, body?: unknown) => Promise<T>;

/** `POST /pages` 의 children 최대 개수 (PATCH /blocks/{id}/children 도 동일) */
export const MAX_CHILDREN = 100;

const API = 'https://api.notion.com/v1';
const GAP_MS = 350;
const MAX_ATTEMPTS = 5;

export interface ApiDeps {
  token: string;
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  log: (msg: string) => void;
}

/** 호출 간격 유지 + 429(Retry-After) 재시도를 하는 노션 API 클라이언트 */
export function createApi(deps: ApiDeps): Api {
  let lastCall = 0;
  return async function api<T>(method: ApiMethod, path: string, body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const wait = lastCall + GAP_MS - deps.now();
      if (wait > 0) await deps.sleep(wait);
      lastCall = deps.now();
      const res = await deps.fetch(`${API}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${deps.token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429) {
        const sec = Number(res.headers.get('Retry-After')) || 1;
        deps.log(`  ⏳ 요청이 많아 ${sec}초 대기`);
        await deps.sleep(sec * 1000);
        continue;
      }
      if (!res.ok) {
        const msg = ((await res.json().catch(() => ({}))) as { message?: string }).message ?? '';
        throw new Error(`Notion ${res.status} ${method} ${path.split('?')[0]} - ${msg}`);
      }
      return (await res.json()) as T;
    }
    throw new Error(`Notion 429 가 계속됨: ${path}`);
  };
}

/** 순서 속성이 있는 DB 용: 1부터 순번을 붙인다 */
function ordered<K extends 'partners' | 'faq' | 'banners'>(kind: K, items: SeedItems[K][]): PagePayload[] {
  return items.map((it, i) => toNotionPage(kind, it, i + 1));
}

/** 시드할 행 (spec.key 별) */
export function seedRows(key: string): PagePayload[] {
  switch (key) {
    case 'notices':
      return notices.map((n) => toNotionPage('notices', n));
    case 'contests':
      return contests.map((c) => toNotionPage('contests', c));
    case 'partners':
      return ordered('partners', partners);
    case 'faq':
      return ordered('faq', faq);
    case 'docs':
      return (Object.entries(docs) as [DocCategory, (typeof docs)[DocCategory]][]).flatMap(([category, items]) =>
        items.map((item) => toNotionPage('docs', { category, item })),
      );
    case 'archive':
      return archive.map((a) => toNotionPage('archive', a));
    case 'banners':
      return ordered('banners', banners);
    case 'popups':
      return popups.map((p) => toNotionPage('popups', p, p.order));
    case 'suggest':
      return suggestAnswers.map((s) => toNotionPage('suggest', s));
    default:
      return [];
  }
}

/** 부모 페이지의 child_database 블록 -> 제목별 id */
async function existingDatabases(api: Api, parent: string): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const res = await api<{
      results: { id: string; type: string; child_database?: { title: string } }[];
      has_more: boolean;
      next_cursor: string | null;
    }>('GET', `/blocks/${parent}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`);
    for (const b of res.results) {
      if (b.type === 'child_database' && b.child_database && !found.has(b.child_database.title)) {
        found.set(b.child_database.title, b.id);
      }
    }
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);
  return found;
}

/** 행 1개 생성. 본문 블록이 100개를 넘으면 나머지를 100개씩 이어 붙인다 */
export async function createRow(api: Api, databaseId: string, row: PagePayload): Promise<void> {
  const children = row.children ?? [];
  const page = await api<{ id: string }>('POST', '/pages', {
    parent: { database_id: databaseId },
    properties: row.properties,
    ...(children.length ? { children: children.slice(0, MAX_CHILDREN) } : {}),
  });
  for (let i = MAX_CHILDREN; i < children.length; i += MAX_CHILDREN) {
    await api('PATCH', `/blocks/${page.id}/children`, { children: children.slice(i, i + MAX_CHILDREN) });
  }
}

export interface SetupOptions {
  dryRun: boolean;
  seed: boolean;
  writeEnv: boolean;
  /** 부모 페이지 id 또는 URL */
  parent?: string;
}

export interface SetupDeps {
  /** 없으면(드라이런 외) 오류 */
  api?: Api;
  token?: string;
  log: (msg: string) => void;
  readFile: (path: string) => string | null;
  writeFile: (path: string, content: string) => void;
}

function printPlan(opts: SetupOptions, log: (msg: string) => void): void {
  log('만들 DB 계획 (노션 호출 없음)');
  for (const spec of DB_SPECS) {
    log(`\n- ${dbTitle(spec)}  →  ${spec.env}`);
    for (const p of spec.props) {
      const opt = p.options ? ` [${p.options.join(', ')}]` : '';
      log(`    · ${p.name} (${p.type})${p.required ? ' *필수' : ''}${opt}`);
    }
    if (opts.seed) log(`    + 예시 행 ${seedRows(spec.key).length}개 (공개 체크)`);
  }
  log('\n실제로 만들려면 --dry-run 없이 실행하세요. (NOTION_TOKEN, NOTION_PARENT_PAGE_ID 또는 --parent 필요)');
}

/** 설정 실행. 만든/재사용한 DB id(`env 키 -> id`)를 돌려준다 */
export async function runSetup(opts: SetupOptions, deps: SetupDeps): Promise<Record<string, string>> {
  const { log } = deps;
  if (opts.dryRun) {
    printPlan(opts, log);
    return {};
  }

  if (!deps.token || !deps.api) throw new Error('NOTION_TOKEN 이 없습니다 (.env.local 또는 환경변수)');
  const api = deps.api;
  const parent = opts.parent ? parseNotionId(opts.parent) : null;
  if (!parent) throw new Error('부모 페이지를 알 수 없습니다: NOTION_PARENT_PAGE_ID 또는 --parent <id|URL> (32자리 id)');

  log('노션 DB 자동 생성');
  const ids: Record<string, string> = {};
  try {
    await createAll(api, parent, ids, opts, log);
  } catch (e) {
    reportPartial(ids, log);
    throw e;
  }

  log('\n--- Vercel 환경변수 (KEY=value) ---');
  for (const [k, v] of Object.entries(ids)) log(`${k}=${v}`);

  if (opts.writeEnv) {
    const file = '.env.local';
    deps.writeFile(file, mergeEnv(deps.readFile(file) ?? '', ids));
    log(`\n${file} 의 NOTION_DB_* 키를 갱신했습니다 (다른 키는 그대로).`);
  }
  log('\n다음: npm run content:check 로 점검하세요.');
  return ids;
}

/** 중간 실패 시 그때까지의 DB id 를 알리고 재실행 방법을 안내한다 */
function reportPartial(ids: Record<string, string>, log: (msg: string) => void): void {
  log('\n⚠️ 중간에 실패했습니다.');
  const entries = Object.entries(ids);
  if (entries.length) {
    log('여기까지 만들거나 확인한 DB id:');
    for (const [k, v] of entries) log(`${k}=${v}`);
  } else {
    log('아직 만든 DB가 없습니다.');
  }
  log('원인을 해결한 뒤 같은 명령을 다시 실행하세요. 같은 제목의 DB는 새로 만들지 않고 재사용합니다.');
}

async function createAll(
  api: Api,
  parent: string,
  ids: Record<string, string>,
  opts: SetupOptions,
  log: (msg: string) => void,
): Promise<void> {
  const existing = await existingDatabases(api, parent);
  for (const spec of DB_SPECS) {
    const title = dbTitle(spec);
    log(`\n[${title}]`);
    let id = existing.get(title);
    let created = false;
    if (id) {
      log(`  ♻️ 이미 있음 → 기존 DB 사용 (${id})`);
    } else {
      const res = await api<{ id: string }>('POST', '/databases', {
        parent: { type: 'page_id', page_id: parent },
        title: [{ type: 'text', text: { content: title } }],
        properties: buildDatabaseProperties(spec),
      });
      id = res.id;
      created = true;
      log(`  ✅ 생성 (${id})`);
    }
    ids[spec.env] = id.replace(/-/g, '');

    if (!opts.seed) continue;
    if (!created) {
      const q = await api<{ results: unknown[] }>('POST', `/databases/${id}/query`, { page_size: 1 });
      if (q.results.length) {
        log('  ⏭️ 이미 행이 있어 시드 생략');
        continue;
      }
    }
    const rows = seedRows(spec.key);
    for (const row of rows) await createRow(api, id, row);
    log(`  🌱 예시 행 ${rows.length}개 추가`);
  }
}

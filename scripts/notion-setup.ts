/**
 * 노션 DB 자동 생성: `npm run notion:setup -- [--parent <id|URL>] [--dry-run] [--seed] [--write-env]`
 * 부모 페이지 아래에 DB 7개를 만들고(이미 같은 제목이 있으면 재사용), DB id 를 출력한다.
 * 비밀값이 필요하므로 CI 에는 넣지 않는다.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { banners } from '../src/content/banners';
import { contests } from '../src/content/contests';
import { docs } from '../src/content/docs';
import { faq, suggestAnswers } from '../src/content/faq';
import { notices } from '../src/content/notices';
import { partners } from '../src/content/partners';
import { DB_SPECS } from '../src/lib/data/notion-schema';
import {
  buildDatabaseProperties,
  dbTitle,
  mergeEnv,
  parseNotionId,
  toNotionPage,
  type PagePayload,
  type SeedKind,
} from '../src/lib/data/notion-setup';
import type { DocCategory } from '../src/lib/types';

for (const f of ['.env.local', '.env']) if (existsSync(f)) process.loadEnvFile(f);

const API = 'https://api.notion.com/v1';
const GAP_MS = 350;

const argv = process.argv.slice(2);
const flag = (name: string): boolean => argv.includes(`--${name}`);
const parentIdx = argv.indexOf('--parent');
const parentArg = parentIdx >= 0 ? argv[parentIdx + 1] : process.env.NOTION_PARENT_PAGE_ID;
const dryRun = flag('dry-run');
const seed = flag('seed');
const writeEnv = flag('write-env');

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** 시드할 행 (spec.key 별) */
function seedRows(key: string): PagePayload[] {
  const withOrder = (kind: SeedKind, items: unknown[]): PagePayload[] =>
    items.map((it, i) => toNotionPage(kind as 'faq', it as never, i + 1));
  switch (key) {
    case 'notices':
      return notices.map((n) => toNotionPage('notices', n));
    case 'contests':
      return contests.map((c) => toNotionPage('contests', c));
    case 'partners':
      return withOrder('partners', partners);
    case 'faq':
      return withOrder('faq', faq);
    case 'docs':
      return (Object.entries(docs) as [DocCategory, (typeof docs)[DocCategory]][]).flatMap(([category, items]) =>
        items.map((item) => toNotionPage('docs', { category, item })),
      );
    case 'banners':
      return withOrder('banners', banners);
    case 'suggest':
      return suggestAnswers.map((s) => toNotionPage('suggest', s));
    default:
      return [];
  }
}

let lastCall = 0;
async function api<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const token = process.env.NOTION_TOKEN as string;
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = lastCall + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status === 429) {
      const sec = Number(res.headers.get('Retry-After')) || 1;
      console.log(`  ⏳ 요청이 많아 ${sec}초 대기`);
      await sleep(sec * 1000);
      continue;
    }
    if (!res.ok) {
      const msg = ((await res.json().catch(() => ({}))) as { message?: string }).message ?? '';
      throw new Error(`Notion ${res.status} ${method} ${path.split('?')[0]} - ${msg}`);
    }
    return (await res.json()) as T;
  }
  throw new Error(`Notion 429 가 계속됨: ${path}`);
}

/** 부모 페이지의 child_database 블록 -> 제목별 id */
async function existingDatabases(parent: string): Promise<Map<string, string>> {
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

function printPlan(): void {
  console.log('만들 DB 계획 (노션 호출 없음)');
  for (const spec of DB_SPECS) {
    console.log(`\n- ${dbTitle(spec)}  →  ${spec.env}`);
    for (const p of spec.props) {
      const opt = p.options ? ` [${p.options.join(', ')}]` : '';
      console.log(`    · ${p.name} (${p.type})${p.required ? ' *필수' : ''}${opt}`);
    }
    if (seed) console.log(`    + 예시 행 ${seedRows(spec.key).length}개 (공개 체크)`);
  }
  console.log('\n실제로 만들려면 --dry-run 없이 실행하세요. (NOTION_TOKEN, NOTION_PARENT_PAGE_ID 또는 --parent 필요)');
}

async function main(): Promise<void> {
  if (dryRun) return printPlan();

  if (!process.env.NOTION_TOKEN) throw new Error('NOTION_TOKEN 이 없습니다 (.env.local 또는 환경변수)');
  const parent = parentArg ? parseNotionId(parentArg) : null;
  if (!parent) throw new Error('부모 페이지를 알 수 없습니다: NOTION_PARENT_PAGE_ID 또는 --parent <id|URL> (32자리 id)');

  console.log('노션 DB 자동 생성');
  const existing = await existingDatabases(parent);
  const ids: Record<string, string> = {};

  for (const spec of DB_SPECS) {
    const title = dbTitle(spec);
    console.log(`\n[${title}]`);
    let id = existing.get(title);
    let created = false;
    if (id) {
      console.log(`  ♻️ 이미 있음 → 기존 DB 사용 (${id})`);
    } else {
      const res = await api<{ id: string }>('POST', '/databases', {
        parent: { type: 'page_id', page_id: parent },
        title: [{ type: 'text', text: { content: title } }],
        properties: buildDatabaseProperties(spec),
      });
      id = res.id;
      created = true;
      console.log(`  ✅ 생성 (${id})`);
    }
    ids[spec.env] = id.replace(/-/g, '');

    if (!seed) continue;
    if (!created) {
      const q = await api<{ results: unknown[] }>('POST', `/databases/${id}/query`, { page_size: 1 });
      if (q.results.length) {
        console.log('  ⏭️ 이미 행이 있어 시드 생략');
        continue;
      }
    }
    const rows = seedRows(spec.key);
    for (const row of rows) {
      await api('POST', '/pages', {
        parent: { database_id: id },
        properties: row.properties,
        ...(row.children ? { children: row.children } : {}),
      });
    }
    console.log(`  🌱 예시 행 ${rows.length}개 추가`);
  }

  console.log('\n--- Vercel 환경변수 (KEY=value) ---');
  for (const [k, v] of Object.entries(ids)) console.log(`${k}=${v}`);

  if (writeEnv) {
    const file = '.env.local';
    const before = existsSync(file) ? readFileSync(file, 'utf8') : '';
    writeFileSync(file, mergeEnv(before, ids));
    console.log(`\n${file} 의 NOTION_DB_* 키를 갱신했습니다 (다른 키는 그대로).`);
  }
  console.log('\n다음: npm run content:check 로 점검하세요.');
}

main().catch((e: unknown) => {
  console.error(`\n❌ ${(e as Error).message}`);
  process.exit(1);
});

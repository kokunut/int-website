/**
 * 콘텐츠 연동 점검: `npm run content:check`
 * .env.local(또는 환경변수)의 설정으로 노션·캘린더·시트를 실제로 읽어 보고 한국어 리포트를 출력한다.
 * 비밀값이 필요하므로 CI 에는 넣지 않는다.
 */
import { existsSync } from 'node:fs';
import { mapPayback, parseCsv } from '../src/lib/data/csv';
import { parseIcs } from '../src/lib/data/ics';
import {
  mapBanner,
  mapContest,
  mapDoc,
  mapFaq,
  mapNotice,
  mapPartner,
  mapSuggest,
} from '../src/lib/data/notion-map';
import { DB_SPECS, P_PUBLIC, type PropSpec } from '../src/lib/data/notion-schema';
import { queryDatabase } from '../src/lib/data/notion';
import type { NotionPage } from '../src/lib/data/notion-types';

for (const f of ['.env.local', '.env']) if (existsSync(f)) process.loadEnvFile(f);

let errors = 0;
const ok = (m: string): void => console.log(`  ✅ ${m}`);
const warn = (m: string): void => console.log(`  ⚠️ ${m}`);
const bad = (m: string): void => {
  errors++;
  console.log(`  ❌ ${m}`);
};

const MAPPERS: Record<string, (p: NotionPage) => unknown> = {
  notices: (p) => mapNotice(p),
  contests: mapContest,
  partners: mapPartner,
  faq: mapFaq,
  docs: mapDoc,
  banners: mapBanner,
  suggest: mapSuggest,
};

interface DbInfo {
  properties?: Record<string, { type: string }>;
}

async function checkNotion(): Promise<void> {
  const token = process.env.NOTION_TOKEN;
  for (const spec of DB_SPECS) {
    console.log(`\n[노션] ${spec.label} (${spec.env})`);
    const id = process.env[spec.env];
    if (!token || !id) {
      warn(`설정 안 됨 -> 목 데이터 사용 (${token ? spec.env : 'NOTION_TOKEN'} 없음)`);
      continue;
    }
    const res = await fetch(`https://api.notion.com/v1/databases/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28' },
      signal: AbortSignal.timeout(10_000),
    }).catch((e: unknown) => e as Error);
    if (res instanceof Error) {
      bad(`접속 실패: ${res.message}`);
      continue;
    }
    if (!res.ok) {
      const msg = ((await res.json().catch(() => ({}))) as { message?: string }).message ?? '';
      bad(`DB를 읽을 수 없음 (${res.status}) ${msg} -> DB id 와 통합 연결(···→연결)을 확인하세요`);
      continue;
    }
    const props = ((await res.json()) as DbInfo).properties ?? {};
    let schemaOk = true;
    for (const p of spec.props as PropSpec[]) {
      const found = props[p.name];
      if (!found) {
        schemaOk = false;
        (p.required ? bad : warn)(`속성 없음: '${p.name}' (${p.type})${p.required ? '' : ' - 선택'}`);
      } else if (found.type !== p.type) {
        schemaOk = false;
        bad(`형식 불일치: '${p.name}' 은(는) ${found.type} 인데 ${p.type} 이어야 함`);
      }
    }
    if (schemaOk) ok('속성 이름·형식 일치');
    if (!props[P_PUBLIC]) continue;
    try {
      const pages = await queryDatabase(id);
      const mapper = MAPPERS[spec.key];
      const valid = pages.filter((p) => mapper(p) !== null).length;
      (valid === pages.length ? ok : warn)(
        `${P_PUBLIC} 체크된 행 ${pages.length}개 중 유효 ${valid}개` + (valid < pages.length ? ' (건너뛴 행 이유는 위 [data] 경고)' : ''),
      );
    } catch (e) {
      bad(`행 조회 실패: ${(e as Error).message}`);
    }
  }
}

async function text(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function checkIcs(): Promise<void> {
  console.log('\n[구글 캘린더] 학사일정 (ACADEMIC_ICS_URL)');
  const url = process.env.ACADEMIC_ICS_URL;
  if (!url) return warn('설정 안 됨 -> 목 데이터 사용');
  try {
    const n = parseIcs(await text(url)).length;
    (n > 0 ? ok : warn)(`오늘 기준 ±1년 일정 ${n}개${n === 0 ? ' (.ics 주소·일정 확인)' : ''}`);
  } catch (e) {
    bad(`읽기 실패: ${(e as Error).message}`);
  }
}

async function checkCsv(): Promise<void> {
  console.log('\n[구글 시트] 페이백 요약 (PAYBACK_CSV_URL)');
  const url = process.env.PAYBACK_CSV_URL;
  if (!url) return warn('설정 안 됨 -> 목 데이터 사용');
  try {
    const p = mapPayback(parseCsv(await text(url)));
    if (p) ok(`형식 정상 (총예산 ${p.budget}, 갱신일 ${p.updatedAt})`);
    else bad('형식 오류: 총예산/지급액/지급인원/신청기간/다음지급일/갱신일 확인');
  } catch (e) {
    bad(`읽기 실패: ${(e as Error).message}`);
  }
}

console.log('콘텐츠 연동 점검');
await checkNotion();
await checkIcs();
await checkCsv();
if (!process.env.REVALIDATE_SECRET) console.log('\n[참고] REVALIDATE_SECRET 설정 안 됨 -> /api/revalidate 는 500 을 돌려줍니다');
console.log(errors ? `\n❌ 오류 ${errors}건` : '\n점검 끝: 오류 없음');
process.exit(errors ? 1 : 0);

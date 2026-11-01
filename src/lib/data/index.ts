/**
 * 데이터 레이어 — 페이지는 src/content 가 아니라 이 파일의 함수만 호출한다.
 *
 * 소스별로: 환경변수가 없으면 src/content 목 데이터, 있으면 원격(노션/구글)을 읽고
 * 실패하면 경고 후 목 데이터로 폴백한다. 원격이 빈 목록이면 그대로 쓴다(빈 것도 유효).
 * 각 로더는 React cache() 로 한 요청 안에서 중복 호출을 합친다.
 */
import { academic } from '@/content/academic';
import { banners } from '@/content/banners';
import { contests } from '@/content/contests';
import { departments } from '@/content/departments';
import { org } from '@/content/council';
import { docs } from '@/content/docs';
import { faq, suggestAnswers } from '@/content/faq';
import { notices } from '@/content/notices';
import { aboutPage, departmentsPage, faqPage, partnersPage, paybackPage, suggestPage } from '@/content/pages';
import { PARTNER_DEFAULT, partners } from '@/content/partners';
import { payback } from '@/content/payback';
import { siteLinks } from '@/content/site';
import { cache } from 'react';
import { buildEvents } from '../events';
import type {
  AboutPage,
  DepartmentsPage,
  AcademicEvent,
  Banner,
  CalendarEvent,
  Contest,
  Department,
  DocCategory,
  DocItem,
  FaqItem,
  FaqPage,
  Notice,
  Member,
  OrgUnit,
  Partner,
  PartnersPage,
  PaybackPage,
  SuggestPage,
  ResolvedPartner,
  Payback,
  SiteLinks,
  SuggestAnswer,
} from '../types';
import { BANNER, FAQ, NOTICE, PARTNER, SUGGEST } from './notion-schema';
import {
  DB,
  blocksToLines,
  dedupeBy,
  mapBanner,
  mapContest,
  mapDoc,
  mapFaq,
  mapNotice,
  mapPartner,
  mapSuggest,
  sortByOrder,
} from './notion-map';
import { fetchBlocks, queryDatabase } from './notion';
import type { NotionPage } from './notion-types';
import { fetchAcademic, fetchPayback } from './remote';


const compact = <T>(list: (T | null)[]): T[] => list.filter((x): x is T => x !== null);

/** 노션 DB 환경변수가 모두 있으면 DB id, 아니면 null */
function notionDb(env: string): string | null {
  return process.env.NOTION_TOKEN && process.env[env] ? (process.env[env] as string) : null;
}

const lastWarn = new Map<string, number>();

/** 같은 소스의 실패 로그는 프로세스당 60초에 한 번만 */
function warnOnce(source: string, err: unknown): void {
  const now = Date.now();
  if (now - (lastWarn.get(source) ?? 0) < 60_000) return;
  lastWarn.set(source, now);
  console.warn(`[data] ${source} 실패, 목 데이터 사용`, err);
}

/** 원격 로더 실행: 실패하면 경고 + 목 데이터 */
async function withFallback<T>(source: string, remote: (() => Promise<T>) | null, mock: () => T): Promise<T> {
  if (!remote) return mock();
  try {
    return await remote();
  } catch (err) {
    warnOnce(source, err);
    return mock();
  }
}

/** 노션 DB 하나를 읽어 행마다 map 한다 */
async function notionRows<T>(dbId: string, map: (p: NotionPage) => T | null, order?: string, sorts: Parameters<typeof queryDatabase>[1] = []): Promise<T[]> {
  const pages = await queryDatabase(dbId, sorts);
  return compact((order ? sortByOrder(pages, order) : pages).map(map));
}

const loadBanners = cache(async (): Promise<Banner[]> => {
  const id = notionDb(DB.banners);
  return withFallback(DB.banners, id ? () => notionRows(id, mapBanner, BANNER.order) : null, () => [...banners]);
});

const loadAcademic = cache(async (): Promise<AcademicEvent[]> => {
  const url = process.env.ACADEMIC_ICS_URL;
  return withFallback('ACADEMIC_ICS_URL', url ? () => fetchAcademic(url) : null, () => [...academic]);
});

/** 목록은 속성만 읽는다(본문 비움). 본문은 getNotice 에서 그 페이지 블록만 읽는다. pageIds: 공지 번호 -> 노션 페이지 id */
interface NoticeIndex {
  list: Notice[];
  pageIds: Map<number, string>;
}

async function fetchNotices(dbId: string): Promise<NoticeIndex> {
  const pages = await queryDatabase(dbId, [{ property: NOTICE.date, direction: 'descending' }]);
  const list: Notice[] = [];
  const pageIds = new Map<number, string>();
  for (const p of pages) {
    const n = mapNotice(p);
    if (!n) continue;
    if (pageIds.has(n.id)) {
      console.warn(`[data] ${DB.notices} 중복 건너뜀: 번호 ${n.id} (먼저 나온 행만 사용)`);
      continue;
    }
    list.push(n);
    pageIds.set(n.id, p.id);
  }
  return { list, pageIds };
}

const loadNoticeIndex = cache(async (): Promise<NoticeIndex> => {
  const id = notionDb(DB.notices);
  return withFallback(DB.notices, id ? () => fetchNotices(id) : null, () => ({
    list: [...notices],
    pageIds: new Map<number, string>(),
  }));
});

const loadNotices = async (): Promise<Notice[]> => (await loadNoticeIndex()).list;

const loadContests = cache(async (): Promise<Contest[]> => {
  const id = notionDb(DB.contests);
  return withFallback(DB.contests, id ? async () => dedupeBy(DB.contests, await notionRows(id, mapContest), (c) => c.id) : null, () => [...contests]);
});

const loadPayback = cache(async (): Promise<Payback> => {
  const url = process.env.PAYBACK_CSV_URL;
  return withFallback('PAYBACK_CSV_URL', url ? () => fetchPayback(url) : null, () => payback);
});

const loadPartners = cache(async (): Promise<Partner[]> => {
  const id = notionDb(DB.partners);
  return withFallback(DB.partners, id ? async () => dedupeBy(DB.partners, await notionRows(id, mapPartner, PARTNER.order), (p) => p.id) : null, () => [...partners]);
});

const loadDocs = cache(async (): Promise<Record<DocCategory, DocItem[]>> => {
  const id = notionDb(DB.docs);
  return withFallback(
    DB.docs,
    id
      ? async () => {
          const out: Record<DocCategory, DocItem[]> = { rules: [], minutes: [], plans: [], forms: [] };
          const rows = dedupeBy(DB.docs, await notionRows(id, mapDoc), (r) => `${r.category}/${r.item.id}`);
          for (const row of rows) out[row.category].push(row.item);
          return out;
        }
      : null,
    () => docs,
  );
});

const loadFaq = cache(async (): Promise<FaqItem[]> => {
  const id = notionDb(DB.faq);
  return withFallback(DB.faq, id ? () => notionRows(id, mapFaq, FAQ.order) : null, () => [...faq]);
});

const loadSuggestAnswers = cache(async (): Promise<SuggestAnswer[]> => {
  const id = notionDb(DB.suggest);
  return withFallback(
    DB.suggest,
    id ? () => notionRows(id, mapSuggest, undefined, [{ property: SUGGEST.date, direction: 'descending' }]) : null,
    () => [...suggestAnswers],
  );
});

export async function getSiteLinks(): Promise<SiteLinks> {
  return siteLinks;
}

export async function getBanners(): Promise<Banner[]> {
  return loadBanners();
}

export async function getAcademic(): Promise<AcademicEvent[]> {
  return loadAcademic();
}

/** 최신 공지가 먼저 (날짜 내림차순, 같으면 id 큰 순) */
export async function getNotices(): Promise<Notice[]> {
  return [...(await loadNotices())].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export async function getNotice(id: number): Promise<Notice | undefined> {
  const { list, pageIds } = await loadNoticeIndex();
  const n = list.find((x) => x.id === id);
  const pageId = pageIds.get(id);
  if (!n || !pageId) return n;
  try {
    return { ...n, body: blocksToLines(await fetchBlocks(pageId)) };
  } catch (err) {
    warnOnce(`${DB.notices} 본문`, err);
    return n;
  }
}

/** 시작일 최신순 */
export async function getContests(): Promise<Contest[]> {
  return [...(await loadContests())].sort((a, b) => b.start.localeCompare(a.start));
}

export async function getContest(id: string): Promise<Contest | undefined> {
  return (await loadContests()).find((c) => c.id === id);
}

export async function getPayback(): Promise<Payback> {
  return loadPayback();
}

export async function getDepartments(): Promise<Department[]> {
  return [...departments];
}

export async function getDepartment(id: string): Promise<Department | undefined> {
  return departments.find((d) => d.id === id);
}

/** 부장(lead)을 맨 앞으로, 나머지는 원래 순서 유지 */
export function sortMembers(members: Member[]): Member[] {
  return [...members.filter((m) => m.lead), ...members.filter((m) => !m.lead)];
}

export async function getOrg(): Promise<OrgUnit[]> {
  return org.map((u) => ({ ...u, members: sortMembers(u.members) }));
}

export async function getCouncilSummary(): Promise<{ total: number }> {
  return { total: org.reduce((n, u) => n + u.members.length, 0) };
}

/** 비어 있는 항목(영업시간·기간·주소·상세·조건)은 PARTNER_DEFAULT 로 채운다 */
const resolvePartner = (p: Partner): ResolvedPartner => ({ ...PARTNER_DEFAULT, ...p });

export async function getPartners(): Promise<ResolvedPartner[]> {
  return (await loadPartners()).map(resolvePartner);
}

export async function getPartner(id: string): Promise<ResolvedPartner | undefined> {
  const p = (await loadPartners()).find((x) => x.id === id);
  return p ? resolvePartner(p) : undefined;
}

/** 날짜 최신순 */
export async function getDocs(category: DocCategory): Promise<DocItem[]> {
  return [...(await loadDocs())[category]].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getDoc(category: DocCategory, id: string): Promise<DocItem | undefined> {
  return (await loadDocs())[category].find((d) => d.id === id);
}

export async function getFaq(): Promise<FaqItem[]> {
  return loadFaq();
}

export async function getSuggestAnswers(): Promise<SuggestAnswer[]> {
  return loadSuggestAnswers();
}

/** 학사일정 + 공지 행사 + 공모전 마감을 합친 캘린더 이벤트 */
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const [ac, ns, cs] = await Promise.all([loadAcademic(), loadNotices(), loadContests()]);
  return buildEvents({ academic: ac, notices: ns, contests: cs });
}

/** 페이지별 편집 문구 */
export async function getAboutPage(): Promise<AboutPage> {
  return aboutPage;
}
export async function getDepartmentsPage(): Promise<DepartmentsPage> {
  return departmentsPage;
}
export async function getPaybackPage(): Promise<PaybackPage> {
  return paybackPage;
}
export async function getSuggestPage(): Promise<SuggestPage> {
  return suggestPage;
}
export async function getPartnersPage(): Promise<PartnersPage> {
  return partnersPage;
}
export async function getFaqPage(): Promise<FaqPage> {
  return faqPage;
}

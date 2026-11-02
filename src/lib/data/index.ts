/**
 * 데이터 레이어 — 페이지는 src/content 가 아니라 이 파일의 함수만 호출한다.
 *
 * 소스별로: 환경변수가 없으면 src/content 목 데이터, 있으면 원격(노션/구글)을 읽고
 * 실패하면 경고 후 목 데이터로 폴백한다. 원격이 빈 목록이면 그대로 쓴다(빈 것도 유효).
 * 각 로더는 React cache() 로 한 요청 안에서 중복 호출을 합친다.
 */
import { academic } from '@/content/academic';
import { archive } from '@/content/archive';
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
import { popups } from '@/content/popups';
import { siteLinks } from '@/content/site';
import { cache } from 'react';
import { buildEvents } from '../events';
import { sortArchive } from '../archive';
import type {
  ArchiveCategory,
  ArchivePost,
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
  Popup,
  SuggestPage,
  ResolvedPartner,
  Payback,
  SiteLinks,
  SuggestAnswer,
} from '../types';
import { BANNER, COUNCIL, FAQ, PARTNER, POPUP, UNIT } from './notion-schema';
import {
  DB,
  blocksToContent,
  blocksToLines,
  buildOrg,
  dedupeBy,
  mapArchive,
  mapBanner,
  mapContest,
  mapDoc,
  mapFaq,
  mapMember,
  mapNotice,
  mapPartner,
  mapPopup,
  mapSettings,
  mapSuggest,
  mapUnit,
  sortByOrder,
  type SettingValues,
} from './notion-map';
import { fetchBlocks, listRows } from './notion';
import type { NotionPage } from './notion-types';
import { fetchAcademic, fetchPayback } from './remote';


const PHOTO_ALT = '학생회 단체 사진';

const compact =<T>(list: (T | null)[]): T[] => list.filter((x): x is T => x !== null);

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
async function notionRows<T>(dbKey: string, dbId: string, map: (p: NotionPage) => T | null, order?: string): Promise<T[]> {
  const pages = await listRows(dbKey, dbId);
  return compact((order ? sortByOrder(pages, order) : pages).map(map));
}

const loadBanners = cache(async (): Promise<Banner[]> => {
  const id = notionDb(DB.banners);
  return withFallback(DB.banners, id ? () => notionRows(DB.banners, id, mapBanner, BANNER.order) : null, () => [...banners]);
});

const loadPopups = cache(async (): Promise<Popup[]> => {
  const id = notionDb(DB.popups);
  return withFallback(
    DB.popups,
    id ? async () => dedupeBy(DB.popups, await notionRows(DB.popups, id, mapPopup, POPUP.order), (p) => p.id) : null,
    () => [...popups],
  );
});

const loadAcademic =cache(async (): Promise<AcademicEvent[]> => {
  const url = process.env.ACADEMIC_ICS_URL;
  return withFallback('ACADEMIC_ICS_URL', url ? () => fetchAcademic(url) : null, () => [...academic]);
});

/** 목록은 속성만 읽는다(본문 비움). 본문은 getNotice 에서 그 페이지 블록만 읽는다. pageIds: 공지 번호 -> 노션 페이지 id */
interface NoticeIndex {
  list: Notice[];
  pageIds: Map<number, string>;
}

async function fetchNotices(dbId: string): Promise<NoticeIndex> {
  const pages = await listRows(DB.notices, dbId);
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
  return withFallback(DB.contests, id ? async () => dedupeBy(DB.contests, await notionRows(DB.contests, id, mapContest), (c) => c.id) : null, () => [...contests]);
});

const loadPayback = cache(async (): Promise<Payback> => {
  const url = process.env.PAYBACK_CSV_URL;
  return withFallback('PAYBACK_CSV_URL', url ? () => fetchPayback(url) : null, () => payback);
});

const loadPartners = cache(async (): Promise<Partner[]> => {
  const id = notionDb(DB.partners);
  return withFallback(DB.partners, id ? async () => dedupeBy(DB.partners, await notionRows(DB.partners, id, mapPartner, PARTNER.order), (p) => p.id) : null, () => [...partners]);
});

const loadDocs = cache(async (): Promise<Record<DocCategory, DocItem[]>> => {
  const id = notionDb(DB.docs);
  return withFallback(
    DB.docs,
    id
      ? async () => {
          const out: Record<DocCategory, DocItem[]> = { rules: [], minutes: [], plans: [], forms: [] };
          const rows = dedupeBy(DB.docs, await notionRows(DB.docs, id, mapDoc), (r) => `${r.category}/${r.item.id}`);
          for (const row of rows) out[row.category].push(row.item);
          return out;
        }
      : null,
    () => docs,
  );
});

/** 목록은 속성만 읽는다(본문 비움). 본문은 getArchivePost 에서 그 페이지 블록만 읽는다. pageIds: `분류/슬러그` -> 노션 페이지 id */
interface ArchiveIndex {
  list: ArchivePost[];
  pageIds: Map<string, string>;
}

const archiveKey = (category: ArchiveCategory, id: string): string => `${category}/${id}`;

async function fetchArchive(dbId: string): Promise<ArchiveIndex> {
  const pages = await listRows(DB.archive, dbId);
  const list: ArchivePost[] = [];
  const pageIds = new Map<string, string>();
  for (const p of pages) {
    const post = mapArchive(p);
    if (!post) continue;
    const key = archiveKey(post.category, post.id);
    if (pageIds.has(key)) {
      console.warn(`[data] ${DB.archive} 중복 건너뜀: ${key} (먼저 나온 행만 사용)`);
      continue;
    }
    list.push(post);
    pageIds.set(key, p.id);
  }
  return { list, pageIds };
}

const loadArchiveIndex = cache(async (): Promise<ArchiveIndex> => {
  const id = notionDb(DB.archive);
  return withFallback(DB.archive, id ? () => fetchArchive(id) : null, () => ({
    list: [...archive],
    pageIds: new Map<string, string>(),
  }));
});

const loadFaq = cache(async (): Promise<FaqItem[]> => {
  const id = notionDb(DB.faq);
  return withFallback(DB.faq, id ? () => notionRows(DB.faq, id, mapFaq, FAQ.order) : null, () => [...faq]);
});

const loadSuggestAnswers = cache(async (): Promise<SuggestAnswer[]> => {
  const id = notionDb(DB.suggest);
  return withFallback(
    DB.suggest,
    id ? () => notionRows(DB.suggest, id, mapSuggest) : null,
    () => [...suggestAnswers],
  );
});

/** 설정 DB: 항목별 값. 환경변수가 없거나 실패하면 빈 값(= 모든 항목 기본값) */
const loadSettings = cache(async (): Promise<SettingValues> => {
  const id = notionDb(DB.settings);
  return withFallback(DB.settings, id ? async () => mapSettings(await listRows(DB.settings, id)) : null, () => ({}));
});

const SITE_LINK_IDS = ['kakao', 'instagram', 'instagramId', 'email', 'address', 'suggestForm', 'paybackForm', 'notionMilitary', 'notionContest', 'gcalSubscribe'] as const;

/** 노션 값이 있는 항목만 기본값 위에 덮어쓴다 */
export async function getSiteLinks(): Promise<SiteLinks> {
  const s = await loadSettings();
  const links: SiteLinks = { ...siteLinks };
  for (const k of SITE_LINK_IDS) {
    const v = s[k];
    if (typeof v === 'string' && v) links[k] = v;
  }
  return links;
}

export async function getBanners(): Promise<Banner[]> {
  return loadBanners();
}

/** 팝업 DB 의 공개 행 (기간 필터 전). 공모전과 합치는 일은 `buildPopups` 가 한다 */
export async function getPopups(): Promise<Popup[]> {
  return loadPopups();
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
    const blocks = await fetchBlocks(pageId);
    return { ...n, body: blocksToLines(blocks), blocks: blocksToContent(blocks) };
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

/**
 * 조직도. 집행부 DB 가 없거나 실패하면 목 데이터. 부서 DB 가 없으면 목 데이터의 부서 목록을 쓴다.
 * 연결돼 있으면 노션 내용 그대로(빈 것도 유효)
 */
const loadOrg = cache(async (): Promise<OrgUnit[]> => {
  const councilId = notionDb(DB.council);
  const unitsId = notionDb(DB.units);
  return withFallback(
    DB.council,
    councilId
      ? async () => {
          const [units, members] = await Promise.all([
            unitsId
              ? notionRows(DB.units, unitsId, mapUnit, UNIT.order)
              : Promise.resolve(org.map((u) => ({ name: u.name, desc: u.desc }))),
            notionRows(DB.council, councilId, mapMember, COUNCIL.order),
          ]);
          return buildOrg(units, members);
        }
      : null,
    () => org,
  );
});

export async function getOrg(): Promise<OrgUnit[]> {
  return (await loadOrg()).map((u) => ({ ...u, members: sortMembers(u.members) }));
}

/** 총원은 데이터에서 계산한다 */
export async function getCouncilSummary(): Promise<{ total: number }> {
  return { total: (await loadOrg()).reduce((n, u) => n + u.members.length, 0) };
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

/** 고정 글 먼저, 그다음 날짜 최신순 (목록은 본문 없음) */
export async function getArchive(category: ArchiveCategory): Promise<ArchivePost[]> {
  return sortArchive((await loadArchiveIndex()).list.filter((p) => p.category === category));
}

export async function getArchivePost(category: ArchiveCategory, id: string): Promise<ArchivePost | undefined> {
  const { list, pageIds } = await loadArchiveIndex();
  const post = list.find((p) => p.category === category && p.id === id);
  const pageId = pageIds.get(archiveKey(category, id));
  if (!post || !pageId) return post;
  try {
    return { ...post, blocks: blocksToContent(await fetchBlocks(pageId)) };
  } catch (err) {
    warnOnce(`${DB.archive} 본문`, err);
    return post;
  }
}

export async function getFaq():Promise<FaqItem[]> {
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
  const s = await loadSettings();
  const greeting = Array.isArray(s.greeting) ? s.greeting : aboutPage.greeting;
  const signer = typeof s.signer === 'string' ? s.signer : aboutPage.signer;
  const photo = typeof s.photo === 'string' ? { src: s.photo, alt: PHOTO_ALT } : aboutPage.photo;
  return { ...aboutPage, greeting, signer, ...(photo ? { photo } : {}) };
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

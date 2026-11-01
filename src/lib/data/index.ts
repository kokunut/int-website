/**
 * 데이터 레이어 — 페이지는 src/content 가 아니라 이 파일의 함수만 호출한다.
 *
 * 지금은 src/content 의 목(mock) 데이터를 반환한다.
 * #6 에서 노션/구글 시트/구글 캘린더 어댑터(notion.ts, sheets.ts, gcal.ts)를 추가하고,
 * 환경변수가 없거나 호출이 실패하면 목 데이터로 폴백한다.
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

export async function getSiteLinks(): Promise<SiteLinks> {
  return siteLinks;
}

export async function getBanners(): Promise<Banner[]> {
  return [...banners];
}

export async function getAcademic(): Promise<AcademicEvent[]> {
  return [...academic];
}

/** 최신 공지가 먼저 (날짜 내림차순, 같으면 id 큰 순) */
export async function getNotices(): Promise<Notice[]> {
  return [...notices].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export async function getNotice(id: number): Promise<Notice | undefined> {
  return notices.find((n) => n.id === id);
}

/** 시작일 최신순 */
export async function getContests(): Promise<Contest[]> {
  return [...contests].sort((a, b) => b.start.localeCompare(a.start));
}

export async function getContest(id: string): Promise<Contest | undefined> {
  return contests.find((c) => c.id === id);
}

export async function getPayback(): Promise<Payback> {
  return payback;
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
  return partners.map(resolvePartner);
}

export async function getPartner(id: string): Promise<ResolvedPartner | undefined> {
  const p = partners.find((x) => x.id === id);
  return p ? resolvePartner(p) : undefined;
}

/** 날짜 최신순 */
export async function getDocs(category: DocCategory): Promise<DocItem[]> {
  return [...docs[category]].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getDoc(category: DocCategory, id: string): Promise<DocItem | undefined> {
  return docs[category].find((d) => d.id === id);
}

export async function getFaq(): Promise<FaqItem[]> {
  return [...faq];
}

export async function getSuggestAnswers(): Promise<SuggestAnswer[]> {
  return [...suggestAnswers];
}

/** 학사일정 + 공지 행사 + 공모전 마감을 합친 캘린더 이벤트 */
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  return buildEvents({ academic, notices, contests });
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

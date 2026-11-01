/**
 * 노션 페이지(JSON) -> 도메인 타입 변환. 순수 함수만 둔다 (네트워크 없음).
 * 잘못된 행은 console.warn 으로 DB·행을 알리고 null 을 반환해 건너뛴다.
 */
import type {
  Banner,
  Contest,
  ContestPrize,
  ContestStep,
  DateString,
  DocCategory,
  DocItem,
  FaqItem,
  LabelValue,
  Notice,
  Partner,
  SuggestAnswer,
} from '../types';
import { BANNER, CONTEST, DOC, DOC_CATEGORY_ALIASES, DOC_CATEGORY_LABELS, FAQ, NOTICE, NOTICE_TYPES, PARTNER, SUGGEST } from './notion-schema';
import type { NotionBlock, NotionFile, NotionPage, NotionProperty, NotionRichText } from './notion-types';

const SLUG_RE = /^[a-z0-9-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 변환 함수들이 경고에 쓰는 DB 이름 */
export const DB = {
  notices: 'NOTION_DB_NOTICES',
  contests: 'NOTION_DB_CONTESTS',
  partners: 'NOTION_DB_PARTNERS',
  faq: 'NOTION_DB_FAQ',
  docs: 'NOTION_DB_DOCS',
  banners: 'NOTION_DB_BANNERS',
  suggest: 'NOTION_DB_SUGGEST',
} as const;

function skip(db: string, page: NotionPage, reason: string): null {
  console.warn(`[data] ${db} 행 건너뜀 (${page.id}): ${reason}`);
  return null;
}

const join = (rt: NotionRichText[] | undefined): string => (rt ?? []).map((r) => r.plain_text).join('');

function prop(page: NotionPage, name: string): NotionProperty | undefined {
  return page.properties[name];
}

/** 제목·텍스트 속성 -> 문자열 (앞뒤 공백 제거). 없으면 '' */
export function text(page: NotionPage, name: string): string {
  const p = prop(page, name);
  if (!p) return '';
  return (p.type === 'title' ? join(p.title) : join(p.rich_text)).trim();
}

/** 여러 줄 텍스트 -> 빈 줄 제외한 줄 배열 */
export function textLines(page: NotionPage, name: string): string[] {
  const p = prop(page, name);
  if (!p) return [];
  return join(p.rich_text)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const num = (page: NotionPage, name: string): number | null => prop(page, name)?.number ?? null;
const select = (page: NotionPage, name: string): string => prop(page, name)?.select?.name.trim() ?? '';
const checked = (page: NotionPage, name: string): boolean => prop(page, name)?.checkbox === true;
/** 링크 허용: http(s) 절대 URL, 또는 `/` 한 개로 시작하는 사이트 내부 경로. 그 외(javascript:, data:, //host)는 '' */
export function safeHref(v: string | null | undefined): string {
  const s = (v ?? '').trim();
  if (/^\/(?![/\\])/.test(s)) return s;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' ? s : '';
  } catch {
    return '';
  }
}

/** 이미지는 https 만 허용 */
export function safeImageSrc(v: string | null | undefined): string | null {
  const s = (v ?? '').trim();
  try {
    return new URL(s).protocol === 'https:' ? s : null;
  } catch {
    return null;
  }
}

const url = (page: NotionPage, name: string): string => safeHref(prop(page, name)?.url);

function fileUrl(page: NotionPage, name: string): string | null {
  const f: NotionFile | undefined = prop(page, name)?.files?.[0];
  return safeImageSrc(f?.file?.url ?? f?.external?.url);
}

/** '순서' 숫자 속성 오름차순 (비어 있으면 맨 뒤, 같으면 원래 순서 유지) */
export function sortByOrder(pages: NotionPage[], name: string): NotionPage[] {
  const key = (p: NotionPage): number => num(p, name) ?? Number.POSITIVE_INFINITY;
  return pages.map((p, i) => ({ p, i })).sort((a, b) => (key(a.p) === key(b.p) ? a.i - b.i : key(a.p) < key(b.p) ? -1 : 1)).map((x) => x.p);
}

/** 노션 날짜 -> YYYY-MM-DD (시간이 붙어 있으면 앞 10자리만). 잘못되면 null */
function day(s: string | null | undefined): DateString | null {
  const d = s?.slice(0, 10);
  return d && DATE_RE.test(d) ? d : null;
}

function dateRange(page: NotionPage, name: string): { start: DateString; end: DateString } | null {
  const d = prop(page, name)?.date;
  const start = day(d?.start);
  if (!start) return null;
  const end = day(d?.end) ?? start;
  return { start, end: end < start ? start : end };
}

function singleDate(page: NotionPage, name: string): DateString | null {
  return day(prop(page, name)?.date?.start);
}

/** `a | b | c` -> ['a','b','c'] (정확히 n칸이 아니면 null) */
function cells(line: string, n: number): string[] | null {
  const parts = line.split('|').map((s) => s.trim());
  return parts.length >= n && parts.slice(0, n).every(Boolean) ? parts.slice(0, n) : null;
}

export function parseLabelValues(lines: string[]): LabelValue[] {
  return lines.flatMap((l) => {
    const c = cells(l, 2);
    return c ? [{ label: c[0], value: c[1] }] : [];
  });
}

export function parsePrizes(lines: string[]): ContestPrize[] {
  return lines.flatMap((l) => {
    const c = cells(l, 3);
    return c ? [{ rank: c[0], count: c[1], amount: c[2] }] : [];
  });
}

export function parseSteps(lines: string[]): ContestStep[] {
  return lines.flatMap((l) => {
    const c = cells(l, 2);
    return c ? [{ title: c[0], desc: c[1] }] : [];
  });
}

/** 블록 목록 -> 본문 줄. 문단·제목·글머리·번호 목록만 사용 */
const TEXT_BLOCKS = new Set([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
]);

export function blocksToLines(blocks: NotionBlock[]): string[] {
  const out: string[] = [];
  for (const b of blocks) {
    if (!TEXT_BLOCKS.has(b.type)) continue;
    const inner = b[b.type] as { rich_text?: NotionRichText[] } | undefined;
    const line = join(inner?.rich_text).trim();
    if (line) out.push(line);
  }
  return out;
}

/** 같은 키가 둘 이상이면 먼저 나온 것만 남기고 나머지는 경고 후 버린다 */
export function dedupeBy<T>(db: string, items: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    const k = key(it);
    if (seen.has(k)) {
      console.warn(`[data] ${db} 중복 건너뜀: ${k} (먼저 나온 행만 사용)`);
      return false;
    }
    seen.add(k);
    return true;
  });
}

export function mapNotice(page: NotionPage, body: string[] = []): Notice | null {
  const db = DB.notices;
  const id = num(page, NOTICE.no);
  if (id === null || !Number.isInteger(id) || id <= 0) return skip(db, page, `${NOTICE.no} 없음/잘못됨`);
  const title = text(page, NOTICE.title);
  if (!title) return skip(db, page, `${NOTICE.title} 없음`);
  const typeName = select(page, NOTICE.type);
  const type = NOTICE_TYPES.find((t) => t === typeName);
  if (!type) return skip(db, page, `${NOTICE.type} 는 일반/행사 중 하나여야 함 (${typeName || '비어 있음'})`);
  const date = singleDate(page, NOTICE.date);
  if (!date) return skip(db, page, `${NOTICE.date} 없음/잘못됨`);
  const event = dateRange(page, NOTICE.event);
  return { id, type, title, date, ...(event ? { event } : {}), body };
}

export function mapContest(page: NotionPage): Contest | null {
  const db = DB.contests;
  const id = text(page, CONTEST.slug);
  if (!SLUG_RE.test(id)) return skip(db, page, `${CONTEST.slug} 형식 오류 (${id || '비어 있음'})`);
  const title = text(page, CONTEST.title);
  if (!title) return skip(db, page, `${CONTEST.title} 없음`);
  const period = dateRange(page, CONTEST.period);
  if (!period) return skip(db, page, `${CONTEST.period} 없음/잘못됨`);

  const schedule = parseLabelValues(textLines(page, CONTEST.schedule));
  const prizes = parsePrizes(textLines(page, CONTEST.prizes));
  const howTo = parseSteps(textLines(page, CONTEST.howTo));
  const notes = textLines(page, CONTEST.notes);
  const applyUrl = url(page, CONTEST.applyUrl);
  const guideUrl = url(page, CONTEST.guideUrl);
  const result = text(page, CONTEST.result);

  return {
    id,
    title,
    start: period.start,
    end: period.end,
    popup: checked(page, CONTEST.popup),
    desc: text(page, CONTEST.desc),
    target: text(page, CONTEST.target),
    prize: text(page, CONTEST.prize),
    contact: text(page, CONTEST.contact),
    ...(schedule.length ? { schedule } : {}),
    ...(prizes.length ? { prizes } : {}),
    ...(howTo.length ? { howTo } : {}),
    ...(notes.length ? { notes } : {}),
    ...(applyUrl ? { applyUrl } : {}),
    ...(guideUrl ? { guideUrl } : {}),
    ...(result ? { result } : {}),
  };
}

export function mapPartner(page: NotionPage): Partner | null {
  const db = DB.partners;
  const id = text(page, PARTNER.slug);
  if (!SLUG_RE.test(id)) return skip(db, page, `${PARTNER.slug} 형식 오류 (${id || '비어 있음'})`);
  const name = text(page, PARTNER.name);
  const cat = select(page, PARTNER.cat);
  const benefit = text(page, PARTNER.benefit);
  const place = text(page, PARTNER.place);
  if (!name || !cat || !benefit || !place) {
    return skip(db, page, `${PARTNER.name}/${PARTNER.cat}/${PARTNER.benefit}/${PARTNER.place} 는 필수`);
  }
  // 비어 있는 선택 항목은 키 자체를 빼서 PARTNER_DEFAULT 가 채우게 한다
  const optional: Partial<Pick<Partner, 'hours' | 'period' | 'address' | 'condition' | 'mapUrl'>> = {};
  const hours = text(page, PARTNER.hours);
  const period = text(page, PARTNER.period);
  const address = text(page, PARTNER.address);
  const condition = text(page, PARTNER.condition);
  const mapUrl = url(page, PARTNER.mapUrl);
  if (hours) optional.hours = hours;
  if (period) optional.period = period;
  if (address) optional.address = address;
  if (condition) optional.condition = condition;
  if (mapUrl) optional.mapUrl = mapUrl;
  const details = textLines(page, PARTNER.details);
  return { id, name, cat, benefit, place, ...optional, ...(details.length ? { details } : {}) };
}

export function mapFaq(page: NotionPage): FaqItem | null {
  const q = text(page, FAQ.q);
  const a = text(page, FAQ.a);
  if (!q || !a) return skip(DB.faq, page, `${FAQ.q}/${FAQ.a} 는 필수`);
  return { q, a };
}

export function mapDoc(page: NotionPage): { category: DocCategory; item: DocItem } | null {
  const db = DB.docs;
  const id = text(page, DOC.slug);
  if (!SLUG_RE.test(id)) return skip(db, page, `${DOC.slug} 형식 오류 (${id || '비어 있음'})`);
  const label = select(page, DOC.category);
  const category = ({ ...DOC_CATEGORY_ALIASES, ...DOC_CATEGORY_LABELS } as Record<string, DocCategory | undefined>)[label];
  if (!category) return skip(db, page, `${DOC.category} 값 오류 (${label || '비어 있음'})`);
  const title = text(page, DOC.title);
  if (!title) return skip(db, page, `${DOC.title} 없음`);
  const date = singleDate(page, DOC.date);
  if (!date) return skip(db, page, `${DOC.date} 없음/잘못됨`);
  const file = url(page, DOC.file);
  return {
    category,
    item: { id, title, date, by: text(page, DOC.by), summary: textLines(page, DOC.summary), ...(file ? { file } : {}) },
  };
}

export function mapBanner(page: NotionPage): Banner | null {
  const slogan = text(page, BANNER.slogan);
  const href = safeHref(text(page, BANNER.href));
  if (!slogan || !href) return skip(DB.banners, page, `${BANNER.slogan}/${BANNER.href} 는 필수 (링크는 https:// 또는 /경로)`);
  return {
    image: fileUrl(page, BANNER.image),
    imageMobile: fileUrl(page, BANNER.imageMobile),
    href,
    word: text(page, BANNER.word),
    slogan,
    placeLabel: text(page, BANNER.placeLabel),
    place: text(page, BANNER.place),
    links: parseLabelValues(textLines(page, BANNER.links)),
  };
}

export function mapSuggest(page: NotionPage): SuggestAnswer | null {
  const title = text(page, SUGGEST.title);
  const answer = text(page, SUGGEST.answer);
  const date = singleDate(page, SUGGEST.date);
  if (!title || !answer || !date) return skip(DB.suggest, page, `${SUGGEST.title}/${SUGGEST.answer}/${SUGGEST.date} 는 필수`);
  return { title, answer, date };
}

/**
 * 노션 페이지(JSON) -> 도메인 타입 변환. 순수 함수만 둔다 (네트워크 없음).
 * 잘못된 행은 console.warn 으로 DB·행을 알리고 null 을 반환해 건너뛴다.
 */
import type {
  ArchiveAttachment,
  ArchivePost,
  ContentBlock,
  Banner,
  Contest,
  ContestPrize,
  ContestStep,
  DateString,
  DocCategory,
  DocItem,
  FaqItem,
  LabelValue,
  Member,
  Notice,
  OrgUnit,
  Partner,
  Popup,
  SuggestAnswer,
} from '../types';
import {
  ARCHIVE,
  ARCHIVE_CATEGORY_LABELS,
  BANNER,
  CONTEST,
  COUNCIL,
  SETTING,
  SETTING_KEYS,
  findSettingKey,
  UNIT,
  UNIT_FALLBACK,
  type SettingId,
  DOC,
  DOC_CATEGORY_ALIASES,
  DOC_CATEGORY_LABELS,
  FAQ,
  NOTICE,
  NOTICE_TYPES,
  PARTNER,
  POPUP,
  POPUP_CATEGORIES,
  SUGGEST,
} from './notion-schema';
import { POPUP_DEFAULT_CTA } from '../popup';
import { fileProxyPath, MAX_FILE_INDEX, type FileField } from './file-proxy';
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
  archive: 'NOTION_DB_ARCHIVE',
  banners: 'NOTION_DB_BANNERS',
  popups: 'NOTION_DB_POPUPS',
  suggest: 'NOTION_DB_SUGGEST',
  settings: 'NOTION_DB_SETTINGS',
  units: 'NOTION_DB_UNITS',
  council: 'NOTION_DB_COUNCIL',
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

/** 설정 링크: 안에 섞인 공백·줄바꿈(복사·붙여넣기)을 모두 제거한 뒤 safeHref */
export function cleanLink(v: string | null | undefined): string {
  return safeHref((v ?? '').replace(/\s+/g, ''));
}

/** 인사말 -> 한 줄이 한 문단인 배열 (빈 줄·연속 빈 줄은 무시) */
export function splitParagraphs(v: string): string[] {
  return v
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** 인스타그램 아이디: 앞에 `@` 가 없으면 붙인다 (빈 값은 그대로) */
export function normalizeInstagramId(v: string): string {
  const s = v.trim().replace(/^@+/, '');
  return s ? `@${s}` : '';
}

/** 업로드 파일(file)은 만료되지 않는 내부 경로로, 외부 링크(external)는 https 만 원래 URL 로 */
function fileUrl(page: NotionPage, name: string, field: FileField): string | null {
  const f: NotionFile | undefined = prop(page, name)?.files?.[0];
  if (f?.file?.url) return fileProxyPath(page.id, field, 0) ?? safeImageSrc(f.file.url);
  return safeImageSrc(f?.external?.url);
}

/** 여러 장 파일 -> 이미지 경로 배열(순서 유지, 최대 20장). 업로드 파일은 인덱스별 안정 경로, 외부 링크는 https 만 */
function fileUrls(page: NotionPage, name: string, field: FileField): string[] {
  const files = (prop(page, name)?.files ?? []).slice(0, MAX_FILE_INDEX + 1);
  const out: string[] = [];
  files.forEach((f, i) => {
    const src = f.file?.url ? (fileProxyPath(page.id, field, i) ?? safeImageSrc(f.file.url)) : safeImageSrc(f.external?.url);
    if (src) out.push(src);
  });
  return out;
}

/** 인스타그램 링크: https 이고 호스트가 instagram.com(또는 하위 도메인)일 때만. 아니면 '' */
export function safeInstagramUrl(v: string | null | undefined): string {
  const s = (v ?? '').trim();
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    return u.protocol === 'https:' && (host === 'instagram.com' || host.endsWith('.instagram.com')) ? s : '';
  } catch {
    return '';
  }
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

interface BlockInner {
  rich_text?: NotionRichText[];
  checked?: boolean;
  icon?: { type?: string; emoji?: string } | null;
  caption?: NotionRichText[];
  type?: string;
  external?: { url?: string };
}

/**
 * 블록 목록 -> 구조가 있는 본문. 최상위 블록만 읽는다(하위 블록은 요청하지 않음).
 * 같은 종류의 연속된 목록 항목은 목록 하나로 묶는다. 빈 텍스트 블록과 지원하지 않는 타입은 건너뛴다.
 * 이미지는 외부 https 주소만 쓴다(업로드 이미지는 안정 경로가 없어 후속 작업).
 */
export function blocksToContent(blocks: NotionBlock[]): ContentBlock[] {
  const out: ContentBlock[] = [];
  for (const b of blocks) {
    const inner = b[b.type] as BlockInner | undefined;
    const line = join(inner?.rich_text).trim();
    switch (b.type) {
      case 'paragraph':
        if (line) out.push({ type: 'paragraph', text: line });
        break;
      case 'heading_1':
      case 'heading_2':
        if (line) out.push({ type: 'heading', level: 2, text: line });
        break;
      case 'heading_3':
        if (line) out.push({ type: 'heading', level: 3, text: line });
        break;
      case 'bulleted_list_item':
      case 'numbered_list_item': {
        if (!line) break;
        const ordered = b.type === 'numbered_list_item';
        const last = out[out.length - 1];
        if (last?.type === 'list' && last.ordered === ordered) last.items.push(line);
        else out.push({ type: 'list', ordered, items: [line] });
        break;
      }
      case 'quote':
        if (line) out.push({ type: 'quote', text: line });
        break;
      case 'callout': {
        if (!line) break;
        const emoji = inner?.icon?.type === 'emoji' ? inner.icon.emoji : undefined;
        out.push({ type: 'callout', text: line, ...(emoji ? { icon: emoji } : {}) });
        break;
      }
      case 'divider':
        out.push({ type: 'divider' });
        break;
      case 'to_do':
        if (line) out.push({ type: 'todo', text: line, checked: inner?.checked === true });
        break;
      case 'image': {
        const src = inner?.type === 'external' ? safeImageSrc(inner.external?.url) : null;
        if (src) out.push({ type: 'image', src, caption: join(inner?.caption).trim() });
        break;
      }
      default:
        break;
    }
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
  if (!type) return skip(db, page, `${NOTICE.type} 는 일반/행사/카드뉴스 중 하나여야 함 (${typeName || '비어 있음'})`);
  const date = singleDate(page, NOTICE.date);
  if (!date) return skip(db, page, `${NOTICE.date} 없음/잘못됨`);
  const event = dateRange(page, NOTICE.event);
  const cards = fileUrls(page, NOTICE.cards, 'notice-images');
  const instagram = safeInstagramUrl(prop(page, NOTICE.instagram)?.url);
  return {
    id,
    type,
    title,
    date,
    ...(event ? { event } : {}),
    body,
    ...(cards.length ? { cards } : {}),
    ...(instagram ? { instagram } : {}),
  };
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

/** 첨부 파일: 업로드는 인덱스별 안정 경로, 외부 링크는 https 만. 이름이 없으면 `첨부 n` (최대 20개) */
function attachments(page: NotionPage): ArchiveAttachment[] {
  const files = (prop(page, ARCHIVE.files)?.files ?? []).slice(0, MAX_FILE_INDEX + 1);
  const out: ArchiveAttachment[] = [];
  files.forEach((f, i) => {
    const href = f.file?.url ? (fileProxyPath(page.id, 'archive-files', i) ?? safeImageSrc(f.file.url)) : safeImageSrc(f.external?.url);
    if (href) out.push({ name: f.name?.trim() || `첨부 ${i + 1}`, href });
  });
  return out;
}

/** 본문(`blocks`)은 상세에서만 읽어 넘긴다 */
export function mapArchive(page: NotionPage, blocks: ContentBlock[] = []): ArchivePost | null {
  const db = DB.archive;
  const id = text(page, ARCHIVE.slug);
  if (!SLUG_RE.test(id)) return skip(db, page, `${ARCHIVE.slug} 형식 오류 (${id || '비어 있음'})`);
  const label = select(page, ARCHIVE.category);
  const category = (ARCHIVE_CATEGORY_LABELS as Record<string, ArchivePost['category'] | undefined>)[label];
  if (!category) return skip(db, page, `${ARCHIVE.category} 는 ${Object.keys(ARCHIVE_CATEGORY_LABELS).join('/')} 중 하나여야 함 (${label || '비어 있음'})`);
  const title = text(page, ARCHIVE.title);
  if (!title) return skip(db, page, `${ARCHIVE.title} 없음`);
  const date = singleDate(page, ARCHIVE.date);
  if (!date) return skip(db, page, `${ARCHIVE.date} 없음/잘못됨`);
  return {
    id,
    category,
    title,
    topic: select(page, ARCHIVE.topic),
    date,
    summary: text(page, ARCHIVE.summary),
    attachments: attachments(page),
    link: url(page, ARCHIVE.link),
    pinned: checked(page, ARCHIVE.pinned),
    blocks,
  };
}

export function mapBanner(page: NotionPage): Banner | null {
  const slogan = text(page, BANNER.slogan);
  const href = safeHref(text(page, BANNER.href));
  if (!slogan || !href) return skip(DB.banners, page, `${BANNER.slogan}/${BANNER.href} 는 필수 (링크는 https:// 또는 /경로)`);
  return {
    image: fileUrl(page, BANNER.image, 'banner-image'),
    imageMobile: fileUrl(page, BANNER.imageMobile, 'banner-image-mobile'),
    href,
    word: text(page, BANNER.word),
    slogan,
    placeLabel: text(page, BANNER.placeLabel),
    place: text(page, BANNER.place),
    links: parseLabelValues(textLines(page, BANNER.links)),
  };
}

export function mapPopup(page: NotionPage): Popup | null {
  const db = DB.popups;
  const id = text(page, POPUP.slug);
  if (!SLUG_RE.test(id)) return skip(db, page, `${POPUP.slug} 형식 오류 (${id || '비어 있음'})`);
  const title = text(page, POPUP.title);
  if (!title) return skip(db, page, `${POPUP.title} 없음`);
  const catName = select(page, POPUP.cat);
  const cat = POPUP_CATEGORIES.find((c) => c === catName);
  if (!cat) return skip(db, page, `${POPUP.cat} 는 ${POPUP_CATEGORIES.join('/')} 중 하나여야 함 (${catName || '비어 있음'})`);
  const period = dateRange(page, POPUP.period);
  if (!period) return skip(db, page, `${POPUP.period} 없음/잘못됨`);
  const order = num(page, POPUP.order);
  return {
    id,
    title,
    cat,
    start: period.start,
    end: period.end,
    desc: text(page, POPUP.desc),
    image: fileUrl(page, POPUP.image, 'popup-image'),
    href: url(page, POPUP.href),
    cta: text(page, POPUP.cta) || POPUP_DEFAULT_CTA,
    ...(order !== null ? { order } : {}),
  };
}

export function mapSuggest(page: NotionPage): SuggestAnswer | null {
  const title = text(page, SUGGEST.title);
  const answer = text(page, SUGGEST.answer);
  const date = singleDate(page, SUGGEST.date);
  if (!title || !answer || !date) return skip(DB.suggest, page, `${SUGGEST.title}/${SUGGEST.answer}/${SUGGEST.date} 는 필수`);
  return { title, answer, date };
}

// ---- 사이트 설정 ----

export type SettingValues = Partial<Record<SettingId, string | string[]>>;

/** 설정 행 하나 -> 항목 id 와 값. 모르는 항목은 경고 후 null, 값이 비어 있으면 조용히 null(기본값 사용) */
export function mapSetting(page: NotionPage): { id: SettingId; value: string | string[] } | null {
  const label = text(page, SETTING.key);
  const found = findSettingKey(label);
  if (!found) {
    return skip(DB.settings, page, `모르는 항목 이름 (${label || '비어 있음'}) — 정해진 이름만 사용: ${SETTING_KEYS.map((k) => k.label).join(', ')}`);
  }
  const { def } = found;
  let value: string | string[] | null;
  switch (def.kind) {
    case 'link':
      value = cleanLink(prop(page, SETTING.link)?.url);
      break;
    case 'text': {
      const v = text(page, SETTING.value);
      value = def.id === 'instagramId' ? normalizeInstagramId(v) : v;
      break;
    }
    case 'lines': {
      const paras = splitParagraphs(join(prop(page, SETTING.value)?.rich_text ?? []));
      value = paras.length ? paras : null;
      break;
    }
    case 'file':
      value = fileUrl(page, SETTING.file, 'settings-file');
      break;
  }
  return value ? { id: def.id, value } : null;
}

/** 설정 행들 -> 항목별 값. 같은 항목이 여러 행이면 먼저 나온 값만 쓴다 */
export function mapSettings(pages: NotionPage[]): SettingValues {
  const out: SettingValues = {};
  for (const p of pages) {
    const s = mapSetting(p);
    if (!s) continue;
    if (out[s.id] !== undefined) {
      console.warn(`[data] ${DB.settings} 중복 건너뜀: ${text(p, SETTING.key)} (먼저 나온 행만 사용)`);
      continue;
    }
    out[s.id] = s.value;
  }
  return out;
}

// ---- 집행부 ----

export interface UnitRow {
  name: string;
  desc: string;
}

export interface MemberRow extends Member {
  /** 부서 이름 (비어 있을 수 있음) */
  unit: string;
}

export function mapUnit(page: NotionPage): UnitRow | null {
  const name = text(page, UNIT.name);
  if (!name) return skip(DB.units, page, `${UNIT.name} 없음`);
  return { name, desc: text(page, UNIT.desc) };
}

export function mapMember(page: NotionPage): MemberRow | null {
  const name = text(page, COUNCIL.name);
  if (!name) return skip(DB.council, page, `${COUNCIL.name} 없음`);
  const major = text(page, COUNCIL.major);
  const role = text(page, COUNCIL.role);
  return {
    name,
    unit: select(page, COUNCIL.unit),
    ...(major ? { major } : {}),
    ...(role ? { role } : {}),
    ...(checked(page, COUNCIL.lead) ? { lead: true } : {}),
  };
}

/** 집행부 행의 부서 값 중 부서 DB 에 없는 이름(중복 제거, 빈 값은 '(비어 있음)'). 순수 함수 */
export function unknownUnitNames(units: { name: string }[], members: { unit: string }[]): string[] {
  const known = new Set(units.map((u) => u.name));
  const out = new Set<string>();
  for (const m of members) if (!known.has(m.unit)) out.add(m.unit || '(비어 있음)');
  return [...out];
}

/**
 * 부서·명단(이미 순서대로) -> 조직도.
 * 부서 목록에 없는 부서의 사람은 "기타" 그룹(경고), 부서마다 부장은 첫 번째만 인정(경고).
 */
export function buildOrg(units: UnitRow[], members: MemberRow[]): OrgUnit[] {
  const result: OrgUnit[] = [];
  const byName = new Map<string, OrgUnit>();
  const add = (name: string, desc: string): OrgUnit => {
    const unit: OrgUnit = { id: `u${result.length + 1}`, name, desc, members: [] };
    byName.set(name, unit);
    result.push(unit);
    return unit;
  };
  for (const u of units) {
    if (byName.has(u.name)) {
      console.warn(`[data] ${DB.units} 중복 건너뜀: ${u.name} (먼저 나온 행만 사용)`);
      continue;
    }
    add(u.name, u.desc);
  }
  for (const { unit: unitName, ...m } of members) {
    let unit = byName.get(unitName);
    if (!unit) {
      console.warn(`[data] ${DB.council} 부서 없음: ${m.name} (${unitName || '비어 있음'}) -> "${UNIT_FALLBACK}" 그룹`);
      unit = byName.get(UNIT_FALLBACK) ?? add(UNIT_FALLBACK, '');
    }
    if (m.lead && unit.members.some((x) => x.lead)) {
      console.warn(`[data] ${DB.council} 부장이 여러 명: ${m.name} (${unit.name}) -> 첫 번째만 부장으로 표시`);
      unit.members.push({ ...m, lead: false });
      continue;
    }
    unit.members.push(m);
  }
  return result;
}

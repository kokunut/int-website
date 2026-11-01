/**
 * 노션 DB 자동 생성(`npm run notion:setup`)에 쓰는 순수 함수들 (네트워크 없음).
 * 스키마(notion-schema.ts)로 속성 payload 를 만들고, 시드용으로 기존 매퍼의 역변환을 제공한다.
 */
import type { Banner, Contest, DocCategory, DocItem, FaqItem, Notice, Partner, SuggestAnswer } from '../types';
import {
  BANNER,
  CONTEST,
  DOC,
  DOC_CATEGORY_LABELS,
  FAQ,
  NOTICE,
  P_PUBLIC,
  PARTNER,
  SUGGEST,
  type DbSpec,
  type PropSpec,
} from './notion-schema';
import { safeHref } from './notion-map';

/** 노션 속성 한 개의 생성 payload */
function propertyPayload(p: PropSpec): unknown {
  switch (p.type) {
    case 'select':
      return { select: { options: (p.options ?? []).map((name) => ({ name })) } };
    case 'number':
      return { number: { format: 'number' } };
    default:
      return { [p.type]: {} };
  }
}

/** DbSpec -> `POST /v1/databases` 의 properties. title 속성은 정확히 1개여야 한다 */
export function buildDatabaseProperties(spec: DbSpec): Record<string, unknown> {
  const titles = spec.props.filter((p) => p.type === 'title');
  if (titles.length !== 1) throw new Error(`${spec.label}: title 속성은 정확히 1개여야 함 (${titles.length}개)`);
  return Object.fromEntries(spec.props.map((p) => [p.name, propertyPayload(p)]));
}

/** DB 제목 (예: `인트 · 공지사항`) */
export const dbTitle = (spec: DbSpec): string => `인트 · ${spec.label}`;

/** URL·하이픈 형식·32자리 id -> 소문자 32자리 id. 못 찾으면 null */
export function parseNotionId(input: string): string | null {
  const path = input.trim().split(/[?#]/)[0] ?? '';
  const last = path.split('/').filter(Boolean).pop() ?? '';
  const m = /([0-9a-f]{32})$/i.exec(last.replace(/-/g, ''));
  return m ? m[1].toLowerCase() : null;
}

/** `.env` 내용에서 updates 의 키만 갱신·추가한다 (다른 줄은 그대로) */
export function mergeEnv(content: string, updates: Record<string, string>): string {
  const pending = new Map(Object.entries(updates));
  const lines = content === '' ? [] : content.replace(/\n$/, '').split('\n');
  const out = lines.map((line) => {
    const key = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line)?.[1];
    if (key && pending.has(key)) {
      const v = pending.get(key) as string;
      pending.delete(key);
      return `${key}=${v}`;
    }
    return line;
  });
  for (const [k, v] of pending) out.push(`${k}=${v}`);
  return out.join('\n') + '\n';
}

// ---- 시드: 도메인 값 -> 노션 페이지 payload (매퍼의 역변환) ----

type Rich = { type: 'text'; text: { content: string } }[];
export interface PagePayload {
  properties: Record<string, unknown>;
  /** 페이지 본문 블록 (공지) */
  children?: unknown[];
}

/** 노션 rich_text 한 항목은 2000자 제한이라 나눠 담는다 */
function rich(s: string): Rich {
  const out: Rich = [];
  for (let i = 0; i < s.length; i += 2000) out.push({ type: 'text', text: { content: s.slice(i, i + 2000) } });
  return out;
}

const title = (s: string) => ({ title: rich(s) });
const richText = (s: string) => ({ rich_text: rich(s) });
const checkbox = (b: boolean) => ({ checkbox: b });
const date = (start: string, end?: string) => ({ date: { start, ...(end && end !== start ? { end } : {}) } });

/** 값이 있을 때만 속성을 넣는다 */
function put(props: Record<string, unknown>, name: string, value: unknown, present: boolean): void {
  if (present) props[name] = value;
}

function putText(props: Record<string, unknown>, name: string, s: string | undefined): void {
  put(props, name, richText(s ?? ''), !!s);
}

function putLines(props: Record<string, unknown>, name: string, lines: string[] | undefined): void {
  put(props, name, richText((lines ?? []).join('\n')), !!lines?.length);
}

/** 매퍼가 받아 주는 링크만 보낸다 (노션이 거부하는 '#' 같은 값 방지) */
function putUrl(props: Record<string, unknown>, name: string, v: string | undefined): void {
  const href = safeHref(v);
  put(props, name, { url: href }, !!href);
}

export type SeedKind = 'notices' | 'contests' | 'partners' | 'faq' | 'docs' | 'banners' | 'suggest';

export interface SeedItems {
  notices: Notice;
  contests: Contest;
  partners: Partner;
  faq: FaqItem;
  docs: { category: DocCategory; item: DocItem };
  banners: Banner;
  suggest: SuggestAnswer;
}

const CATEGORY_LABEL = Object.fromEntries(Object.entries(DOC_CATEGORY_LABELS).map(([label, code]) => [code, label]));

const para = (content: string) => ({
  object: 'block',
  type: 'paragraph',
  paragraph: { rich_text: rich(content) },
});

type Builder<K extends SeedKind> = (item: SeedItems[K], order?: number) => PagePayload;

/** 모든 행은 `공개` 체크 */
const base = (): Record<string, unknown> => ({ [P_PUBLIC]: checkbox(true) });

/** 순서 속성이 있는 DB(제휴·FAQ·배너)에서만 값이 있다 */
function putOrder(props: Record<string, unknown>, name: string, order: number | undefined): void {
  put(props, name, { number: order }, order !== undefined);
}

const BUILDERS: { [K in SeedKind]: Builder<K> } = {
  notices: (n) => {
    const props = base();
    props[NOTICE.title] = title(n.title);
    props[NOTICE.no] = { number: n.id };
    props[NOTICE.type] = { select: { name: n.type } };
    props[NOTICE.date] = date(n.date);
    put(props, NOTICE.event, date(n.event?.start ?? '', n.event?.end), !!n.event);
    return { properties: props, children: n.body.map(para) };
  },
  contests: (c) => {
    const props = base();
    props[CONTEST.title] = title(c.title);
    props[CONTEST.slug] = richText(c.id);
    props[CONTEST.period] = date(c.start, c.end);
    put(props, CONTEST.popup, checkbox(true), c.popup);
    putText(props, CONTEST.desc, c.desc);
    putText(props, CONTEST.target, c.target);
    putText(props, CONTEST.prize, c.prize);
    putText(props, CONTEST.contact, c.contact);
    putLines(props, CONTEST.schedule, c.schedule?.map((s) => `${s.label} | ${s.value}`));
    putLines(props, CONTEST.prizes, c.prizes?.map((p) => `${p.rank} | ${p.count} | ${p.amount}`));
    putLines(props, CONTEST.howTo, c.howTo?.map((h) => `${h.title} | ${h.desc}`));
    putLines(props, CONTEST.notes, c.notes);
    putUrl(props, CONTEST.applyUrl, c.applyUrl);
    putUrl(props, CONTEST.guideUrl, c.guideUrl);
    putText(props, CONTEST.result, c.result);
    return { properties: props };
  },
  partners: (p, order) => {
    const props = base();
    props[PARTNER.name] = title(p.name);
    props[PARTNER.slug] = richText(p.id);
    props[PARTNER.cat] = { select: { name: p.cat } };
    props[PARTNER.benefit] = richText(p.benefit);
    props[PARTNER.place] = richText(p.place);
    putText(props, PARTNER.hours, p.hours);
    putText(props, PARTNER.period, p.period);
    putText(props, PARTNER.address, p.address);
    putLines(props, PARTNER.details, p.details);
    putText(props, PARTNER.condition, p.condition);
    putUrl(props, PARTNER.mapUrl, p.mapUrl);
    putOrder(props, PARTNER.order, order);
    return { properties: props };
  },
  faq: (f, order) => {
    const props = base();
    props[FAQ.q] = title(f.q);
    props[FAQ.a] = richText(f.a);
    putOrder(props, FAQ.order, order);
    return { properties: props };
  },
  docs: ({ category, item: d }) => {
    const props = base();
    props[DOC.title] = title(d.title);
    props[DOC.slug] = richText(d.id);
    props[DOC.category] = { select: { name: CATEGORY_LABEL[category] } };
    props[DOC.date] = date(d.date);
    putText(props, DOC.by, d.by);
    putLines(props, DOC.summary, d.summary);
    putUrl(props, DOC.file, d.file);
    return { properties: props };
  },
  banners: (b, order) => {
    // 이미지는 파일 업로드가 필요해 시드하지 않는다 (글자 배너로 표시됨)
    const props = base();
    props[BANNER.slogan] = title(b.slogan);
    props[BANNER.href] = richText(b.href);
    putText(props, BANNER.word, b.word);
    putText(props, BANNER.placeLabel, b.placeLabel);
    putText(props, BANNER.place, b.place);
    putLines(props, BANNER.links, b.links.map((l) => `${l.label} | ${l.value}`));
    putOrder(props, BANNER.order, order);
    return { properties: props };
  },
  suggest: (s) => {
    const props = base();
    props[SUGGEST.title] = title(s.title);
    props[SUGGEST.answer] = richText(s.answer);
    props[SUGGEST.date] = date(s.date);
    return { properties: props };
  },
};

/** 도메인 값 -> 노션 페이지 payload. `order` 는 순서 속성이 있는 DB 에서 쓴다 */
export function toNotionPage<K extends SeedKind>(kind: K, item: SeedItems[K], order?: number): PagePayload {
  const build: Builder<K> = BUILDERS[kind];
  return build(item, order);
}

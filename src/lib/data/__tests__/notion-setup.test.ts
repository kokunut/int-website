import { describe, expect, it } from 'vitest';
import { banners } from '@/content/banners';
import { contests } from '@/content/contests';
import { docs } from '@/content/docs';
import { faq, suggestAnswers } from '@/content/faq';
import { notices } from '@/content/notices';
import { partners } from '@/content/partners';
import { blocksToLines, mapBanner, mapContest, mapDoc, mapFaq, mapNotice, mapPartner, mapSuggest } from '../notion-map';
import { DB_SPECS } from '../notion-schema';
import type { NotionBlock, NotionPage, NotionProperty } from '../notion-types';
import { buildDatabaseProperties, dbTitle, mergeEnv, parseNotionId, toNotionPage, type PagePayload } from '../notion-setup';
import type { DocCategory } from '@/lib/types';

type Payload = Record<string, Record<string, unknown>>;
type RT = { text: { content: string } }[];

/** 생성 payload 를 노션 조회 응답 모양으로 바꾼다 (plain_text 추가) */
function fakeProps(properties: Record<string, unknown>): NotionPage['properties'] {
  const plain = (rt: RT) => rt.map((r) => ({ plain_text: r.text.content }));
  const out: NotionPage['properties'] = {};
  for (const [name, v] of Object.entries(properties as Payload)) {
    const [type, val] = Object.entries(v)[0];
    const p: Record<string, unknown> = { type };
    p[type] = type === 'title' || type === 'rich_text' ? plain(val as RT) : val;
    out[name] = p as unknown as NotionProperty;
  }
  return out;
}

const fakePage = (payload: PagePayload): NotionPage => ({ id: 'fake', properties: fakeProps(payload.properties) });

const fakeBlocks = (payload: PagePayload): NotionBlock[] =>
  (payload.children ?? []).map((c) => {
    const b = c as { type: string; paragraph: { rich_text: RT } };
    return {
      type: b.type,
      paragraph: { rich_text: b.paragraph.rich_text.map((r) => ({ plain_text: r.text.content })) },
    };
  });

describe('buildDatabaseProperties', () => {
  it.each(DB_SPECS.map((s) => [s.key, s] as const))('%s: title 1개, 모든 속성 포함', (_k, spec) => {
    const props = buildDatabaseProperties(spec);
    expect(Object.keys(props)).toEqual(spec.props.map((p) => p.name));
    expect(Object.values(props).filter((v) => 'title' in (v as object))).toHaveLength(1);
  });

  it('select 는 옵션을 미리 만든다', () => {
    const notice = buildDatabaseProperties(DB_SPECS.find((s) => s.key === 'notices')!);
    expect(notice['유형']).toEqual({ select: { options: [{ name: '일반' }, { name: '행사' }] } });
    const doc = buildDatabaseProperties(DB_SPECS.find((s) => s.key === 'docs')!);
    expect((doc['분류'] as { select: { options: { name: string }[] } }).select.options.map((o) => o.name)).toEqual([
      '회칙',
      '회의록',
      '활동계획서·결산',
      '서식',
    ]);
  });

  it('title 이 없거나 둘이면 오류', () => {
    const base = DB_SPECS[0];
    expect(() => buildDatabaseProperties({ ...base, props: base.props.filter((p) => p.type !== 'title') })).toThrow();
    const t = base.props.find((p) => p.type === 'title')!;
    expect(() => buildDatabaseProperties({ ...base, props: [...base.props, { ...t, name: '둘째' }] })).toThrow();
  });

  it('DB 제목', () => expect(dbTitle(DB_SPECS[0])).toBe('인트 · 공지사항'));
});

describe('parseNotionId', () => {
  const id = 'abcdef1234567890abcdef1234567890';
  it('여러 형식', () => {
    expect(parseNotionId(id)).toBe(id);
    expect(parseNotionId('abcdef12-3456-7890-abcd-ef1234567890')).toBe(id);
    expect(parseNotionId(`https://www.notion.so/workspace/My-Page-${id}?pvs=4`)).toBe(id);
    expect(parseNotionId(`https://www.notion.so/${id}`)).toBe(id);
    expect(parseNotionId(`ABCDEF1234567890ABCDEF1234567890`)).toBe(id);
  });
  it('잘못된 입력은 null', () => {
    expect(parseNotionId('')).toBeNull();
    expect(parseNotionId('https://www.notion.so/abc')).toBeNull();
  });
});

describe('mergeEnv', () => {
  it('지정한 키만 갱신하고 나머지는 보존', () => {
    const before = '# 주석\nNOTION_TOKEN=secret\nNOTION_DB_FAQ=old\nOTHER=1\n';
    expect(mergeEnv(before, { NOTION_DB_FAQ: 'new', NOTION_DB_NOTICES: 'n1' })).toBe(
      '# 주석\nNOTION_TOKEN=secret\nNOTION_DB_FAQ=new\nOTHER=1\nNOTION_DB_NOTICES=n1\n',
    );
  });
  it('빈 파일', () => expect(mergeEnv('', { A: '1' })).toBe('A=1\n'));
});

describe('toNotionPage 왕복 (매퍼의 역변환)', () => {
  it('공지(본문 포함)', () => {
    for (const n of notices) {
      const payload = toNotionPage('notices', n);
      expect(mapNotice(fakePage(payload), blocksToLines(fakeBlocks(payload)))).toEqual(n);
    }
  });

  it('공모전 (노션이 거부하는 링크 `#` 는 제외)', () => {
    for (const c of contests) {
      const { guideUrl, ...rest } = c;
      const expected = guideUrl && guideUrl !== '#' ? c : rest;
      expect(mapContest(fakePage(toNotionPage('contests', c)))).toEqual(expected);
    }
  });

  it('제휴', () => {
    for (const p of partners) expect(mapPartner(fakePage(toNotionPage('partners', p)))).toEqual(p);
  });

  it('FAQ·건의 답변', () => {
    for (const f of faq) expect(mapFaq(fakePage(toNotionPage('faq', f)))).toEqual(f);
    for (const s of suggestAnswers) expect(mapSuggest(fakePage(toNotionPage('suggest', s)))).toEqual(s);
  });

  it('자료실', () => {
    for (const [category, items] of Object.entries(docs) as [DocCategory, (typeof docs)[DocCategory]][]) {
      for (const item of items) expect(mapDoc(fakePage(toNotionPage('docs', { category, item })))).toEqual({ category, item });
    }
  });

  it('배너', () => {
    for (const b of banners) expect(mapBanner(fakePage(toNotionPage('banners', b)))).toEqual(b);
  });

  it('모든 시드 행은 공개 체크, 순서·행사기간 처리', () => {
    expect(toNotionPage('faq', faq[0], 3).properties['순서']).toEqual({ number: 3 });
    expect(toNotionPage('faq', faq[0]).properties['공개']).toEqual({ checkbox: true });
    // 하루짜리 행사는 end 를 생략
    const oneDay = notices.find((n) => n.event && n.event.start === n.event.end)!;
    expect(toNotionPage('notices', oneDay).properties['행사기간']).toEqual({ date: { start: oneDay.event!.start } });
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { org } from '@/content/council';
import { aboutPage } from '@/content/pages';
import { siteLinks } from '@/content/site';
import { DB_SPECS, SETTING_KEYS } from '../notion-schema';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Footer from '@/components/Footer';
import type { SiteLinks } from '@/lib/types';
import {
  buildOrg,
  cleanLink,
  mapMember,
  mapSetting,
  mapSettings,
  mapUnit,
  normalizeInstagramId,
  splitParagraphs,
  unknownUnitNames,
} from '../notion-map';
import { buildDatabaseProperties } from '../notion-setup';
import type { NotionPage } from '../notion-types';
import { seedRows } from '../notion-setup-run';

const rt = (s: string) => (s ? [{ plain_text: s }] : []);
const ID = 'abcdef1234567890abcdef1234567890';

/** 속성 값만 간단히 적어 만드는 가짜 노션 행 */
function page(props: {
  title: [string, string];
  text?: Record<string, string>;
  url?: Record<string, string | null>;
  files?: Record<string, { file?: { url: string }; external?: { url: string } }[]>;
  select?: Record<string, string>;
  checkbox?: Record<string, boolean>;
  number?: Record<string, number>;
}): NotionPage {
  const properties: Record<string, unknown> = { [props.title[0]]: { type: 'title', title: rt(props.title[1]) } };
  for (const [k, v] of Object.entries(props.text ?? {})) properties[k] = { type: 'rich_text', rich_text: rt(v) };
  for (const [k, v] of Object.entries(props.url ?? {})) properties[k] = { type: 'url', url: v };
  for (const [k, v] of Object.entries(props.files ?? {})) properties[k] = { type: 'files', files: v };
  for (const [k, v] of Object.entries(props.select ?? {})) properties[k] = { type: 'select', select: v ? { name: v } : null };
  for (const [k, v] of Object.entries(props.checkbox ?? {})) properties[k] = { type: 'checkbox', checkbox: v };
  for (const [k, v] of Object.entries(props.number ?? {})) properties[k] = { type: 'number', number: v };
  return { id: ID, properties } as unknown as NotionPage;
}

const setting = (label: string, extra: Omit<Parameters<typeof page>[0], 'title'> = {}) => page({ title: ['항목', label], ...extra });
const member = (name: string, unit: string, extra: Omit<Parameters<typeof page>[0], 'title' | 'select'> = {}) =>
  page({ title: ['이름', name], select: { 부서: unit }, ...extra });

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('mapSetting: 항목별 타입', () => {
  it('링크 항목은 `링크` 칸을 safeHref 로 읽는다', () => {
    expect(mapSetting(setting('카카오톡 채널', { url: { 링크: 'https://pf.kakao.com/_abc' } }))).toEqual({
      id: 'kakao',
      value: 'https://pf.kakao.com/_abc',
    });
    expect(mapSetting(setting('건의함 폼', { url: { 링크: 'javascript:alert(1)' } }))).toBeNull();
  });

  it('글자 항목은 `값` 칸을 읽고 링크 칸은 무시한다', () => {
    expect(mapSetting(setting('이메일', { text: { 값: ' int@sejong.ac.kr ' } }))).toEqual({ id: 'email', value: 'int@sejong.ac.kr' });
    expect(mapSetting(setting('인스타그램 아이디', { text: { 값: '' }, url: { 링크: 'https://x.com' } }))).toBeNull();
  });

  it('인사말은 여러 줄을 문단 배열로 읽는다', () => {
    expect(mapSetting(setting('인사말', { text: { 값: '첫 문단\n둘째 문단' } }))).toEqual({
      id: 'greeting',
      value: ['첫 문단', '둘째 문단'],
    });
  });

  it('단체 사진은 업로드 파일이면 안정 경로, 외부 링크는 https 만', () => {
    expect(mapSetting(setting('단체 사진', { files: { 파일: [{ file: { url: 'https://s3/x.png' } }] } }))).toEqual({
      id: 'photo',
      value: `/api/notion-file/${ID}/settings-file/0`,
    });
    expect(mapSetting(setting('단체 사진', { files: { 파일: [{ external: { url: 'https://img.example/a.png' } }] } }))?.value).toBe(
      'https://img.example/a.png',
    );
    expect(mapSetting(setting('단체 사진', { files: { 파일: [{ external: { url: 'http://img.example/a.png' } }] } }))).toBeNull();
  });
});

describe('mapSettings: 모르는 항목·빈 값·중복', () => {
  it('모르는 항목은 무시하고 경고한다', () => {
    const out = mapSettings([setting('없는 항목', { text: { 값: 'x' } }), setting('이메일', { text: { 값: 'a@b.c' } })]);
    expect(out).toEqual({ email: 'a@b.c' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('모르는 항목 이름 (없는 항목)'));
  });

  it('빈 값은 항목을 만들지 않는다 (기본값 사용)', () => {
    expect(mapSettings([setting('이메일'), setting('카카오톡 채널')])).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it('같은 항목이 둘이면 먼저 나온 값만 쓴다', () => {
    const out = mapSettings([setting('인사말 서명', { text: { 값: '첫째' } }), setting('인사말 서명', { text: { 값: '둘째' } })]);
    expect(out).toEqual({ signer: '첫째' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('중복'));
  });
});

describe('설정 스키마·시드', () => {
  it('항목 이름과 id 는 겹치지 않는다', () => {
    expect(new Set(SETTING_KEYS.map((k) => k.label)).size).toBe(SETTING_KEYS.length);
    expect(new Set(SETTING_KEYS.map((k) => k.id)).size).toBe(SETTING_KEYS.length);
  });

  it('시드는 모든 항목 행을 만들고 매퍼로 되읽으면 기본값이 나온다', () => {
    const rows = seedRows('settings');
    expect(rows).toHaveLength(SETTING_KEYS.length);
    const read = (p: (typeof rows)[number]): NotionPage => {
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(p.properties) as [string, Record<string, unknown>][]) {
        if ('title' in v) props[k] = { type: 'title', title: (v.title as { text: { content: string } }[]).map((r) => ({ plain_text: r.text.content })) };
        else if ('rich_text' in v) props[k] = { type: 'rich_text', rich_text: (v.rich_text as { text: { content: string } }[]).map((r) => ({ plain_text: r.text.content })) };
        else if ('url' in v) props[k] = { type: 'url', url: v.url };
      }
      return { id: ID, properties: props } as unknown as NotionPage;
    };
    const out = mapSettings(rows.map(read));
    expect(out.kakao).toBe(siteLinks.kakao);
    expect(out.address).toBe(siteLinks.address);
    expect(out.greeting).toEqual(aboutPage.greeting);
    expect(out.signer).toBe(aboutPage.signer);
    expect(out.email).toBeUndefined();
    expect(out.photo).toBeUndefined();
  });

  it('운영 매뉴얼 표에 모든 항목 이름이 실려 있다', () => {
    const doc = readFileSync(join(process.cwd(), 'docs/brain/06-content-ops.md'), 'utf8');
    for (const k of SETTING_KEYS) expect(doc, k.label).toContain(`| ${k.label} | ${{ link: '링크', text: '값', lines: '값', file: '파일' }[k.kind]} |`);
  });

  it('DB_SPECS 에 설정·부서·집행부가 있다', () => {
    expect(DB_SPECS.map((s) => s.env)).toEqual(expect.arrayContaining(['NOTION_DB_SETTINGS', 'NOTION_DB_UNITS', 'NOTION_DB_COUNCIL']));
  });
});

describe('부서·집행부 매퍼', () => {
  it('부서는 이름이 필수', () => {
    expect(mapUnit(page({ title: ['이름', '홍보부'], text: { 설명: 'SNS' } }))).toEqual({ name: '홍보부', desc: 'SNS' });
    expect(mapUnit(page({ title: ['이름', ''] }))).toBeNull();
  });

  it('명단은 학과·직책·부장을 읽고 빈 값은 생략한다', () => {
    expect(mapMember(member('강현지', '홍보부', { text: { 학과: '디이노' }, checkbox: { 부장: true } }))).toEqual({
      name: '강현지',
      unit: '홍보부',
      major: '디이노',
      lead: true,
    });
    expect(mapMember(member('박상현', '회장단', { text: { 직책: '회장' } }))).toEqual({ name: '박상현', unit: '회장단', role: '회장' });
    expect(mapMember(page({ title: ['이름', ''] }))).toBeNull();
  });
});

describe('buildOrg: 부서 매칭·기타 그룹·부장 중복', () => {
  const units = [
    { name: '회장단', desc: '총괄' },
    { name: '홍보부', desc: 'SNS' },
  ];

  it('부서 순서대로 묶고 총원은 데이터에서 센다', () => {
    const o = buildOrg(units, [
      { name: 'a', unit: '홍보부' },
      { name: 'b', unit: '회장단', role: '회장' },
      { name: 'c', unit: '홍보부' },
    ]);
    expect(o.map((u) => [u.name, u.members.map((m) => m.name)])).toEqual([
      ['회장단', ['b']],
      ['홍보부', ['a', 'c']],
    ]);
    expect(o.reduce((n, u) => n + u.members.length, 0)).toBe(3);
    expect(new Set(o.map((u) => u.id)).size).toBe(o.length);
    expect(warn).not.toHaveBeenCalled();
  });

  it('부서 DB 에 없는 부서·빈 부서는 "기타" 그룹에 모으고 경고한다', () => {
    const o = buildOrg(units, [
      { name: 'a', unit: '없는부서' },
      { name: 'b', unit: '' },
      { name: 'c', unit: '홍보부' },
    ]);
    expect(o.at(-1)).toMatchObject({ name: '기타', members: [{ name: 'a' }, { name: 'b' }] });
    expect(o).toHaveLength(3);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('부서 DB 에 "기타" 가 있으면 그 부서를 쓴다', () => {
    const o = buildOrg([...units, { name: '기타', desc: '그 외' }], [{ name: 'a', unit: '??' }]);
    expect(o).toHaveLength(3);
    expect(o[2]).toMatchObject({ desc: '그 외', members: [{ name: 'a' }] });
  });

  it('부장이 여러 명이면 첫 번째만 부장으로 둔다', () => {
    const o = buildOrg(units, [
      { name: 'a', unit: '홍보부', lead: true },
      { name: 'b', unit: '홍보부', lead: true },
      { name: 'c', unit: '회장단', lead: true },
    ]);
    expect(o[1].members.map((m) => [m.name, !!m.lead])).toEqual([
      ['a', true],
      ['b', false],
    ]);
    expect(o[0].members[0].lead).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('부장이 여러 명: b'));
  });

  it('시드는 현재 25명·6개 부서를 그대로 만든다', () => {
    expect(seedRows('units')).toHaveLength(org.length);
    expect(seedRows('council')).toHaveLength(25);
  });
});

describe('집행부 `부서` 선택지', () => {
  it('집행부 DB 를 만들 때 `부서` 옵션을 현재 부서 목록으로 미리 만든다', () => {
    const spec = DB_SPECS.find((s) => s.key === 'council')!;
    const payload = buildDatabaseProperties(spec) as Record<string, { select?: { options: { name: string }[] } }>;
    expect(payload['부서'].select?.options.map((o) => o.name)).toEqual(org.map((u) => u.name));
  });
});

describe('unknownUnitNames: 집행부 부서 값 중 부서 DB 에 없는 이름', () => {
  const units = [{ name: '회장단' }, { name: '홍보부' }];

  it('모두 있으면 빈 목록', () => {
    expect(unknownUnitNames(units, [{ unit: '회장단' }, { unit: '홍보부' }])).toEqual([]);
  });

  it('없는 이름은 중복 없이 나오고 빈 값은 (비어 있음)', () => {
    expect(unknownUnitNames(units, [{ unit: '홍뽀부' }, { unit: '홍보부' }, { unit: '홍뽀부' }, { unit: '' }])).toEqual(['홍뽀부', '(비어 있음)']);
  });

  it('띄어쓰기가 다르면 다른 이름', () => {
    expect(unknownUnitNames(units, [{ unit: '홍보 부' }])).toEqual(['홍보 부']);
  });
});

describe('설정 값 정리', () => {
  it('값 앞뒤 공백·줄바꿈은 제거한다', () => {
    expect(mapSetting(setting('이메일', { text: { 값: '\n  int@sejong.ac.kr \n' } }))?.value).toBe('int@sejong.ac.kr');
    expect(mapSetting(setting('인사말 서명', { text: { 값: '  학생회장 홍길동\n' } }))?.value).toBe('학생회장 홍길동');
  });

  it('링크는 안에 섞인 공백·줄바꿈도 지운 뒤 safeHref 를 통과해야 한다', () => {
    expect(mapSetting(setting('카카오톡 채널', { url: { 링크: ' https://pf.kakao.com/_ab\nc  ' } }))?.value).toBe('https://pf.kakao.com/_abc');
    expect(cleanLink(' /military ')).toBe('/military');
    expect(cleanLink('java script:alert(1)')).toBe('');
    expect(cleanLink('  ')).toBe('');
    expect(cleanLink(null)).toBe('');
  });

  it('인사말은 한 줄을 한 문단으로 보고 빈 줄(연속 포함)은 무시한다', () => {
    expect(splitParagraphs('\n 첫째 \n둘째\n\n\n  \n셋째\r\n\r\n넷째\n')).toEqual(['첫째', '둘째', '셋째', '넷째']);
    expect(splitParagraphs(' \n \n')).toEqual([]);
    expect(mapSetting(setting('인사말', { text: { 값: ' \n ' } }))).toBeNull();
  });

  it('인스타그램 아이디는 @ 가 없으면 붙인다', () => {
    expect(normalizeInstagramId('int_sejong')).toBe('@int_sejong');
    expect(normalizeInstagramId(' @int_sejong ')).toBe('@int_sejong');
    expect(normalizeInstagramId('@@int_sejong')).toBe('@int_sejong');
    expect(normalizeInstagramId('  ')).toBe('');
    expect(mapSetting(setting('인스타그램 아이디', { text: { 값: ' int_sejong\n' } }))?.value).toBe('@int_sejong');
    expect(mapSetting(setting('인스타그램 아이디', { text: { 값: '@' } }))).toBeNull();
  });
});

describe('푸터 이메일', () => {
  const render = (links: SiteLinks) => renderToStaticMarkup(createElement(Footer, { links }));

  it('이메일이 없으면 이메일 행을 그리지 않는다 (기존 화면과 동일)', () => {
    expect(render(siteLinks)).not.toContain('이메일');
  });

  it('이메일이 있으면 mailto 링크로 보인다', () => {
    const html = render({ ...siteLinks, email: 'int@sejong.ac.kr' });
    expect(html).toContain('이메일');
    expect(html).toContain('href="mailto:int@sejong.ac.kr"');
  });
});

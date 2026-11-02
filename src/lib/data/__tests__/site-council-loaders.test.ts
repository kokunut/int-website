import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { org } from '@/content/council';
import { aboutPage } from '@/content/pages';
import { siteLinks } from '@/content/site';
import type { NotionPage } from '../notion-types';

const listRows = vi.fn<(dbKey: string, dbId: string) => Promise<NotionPage[]>>();
vi.mock('../notion', () => ({ listRows: (k: string, i: string) => listRows(k, i), fetchBlocks: vi.fn(), REMOTE_TAG: 'notion' }));

const ID = 'abcdef1234567890abcdef1234567890';
const rt = (s: string) => [{ plain_text: s }];
const row = (properties: Record<string, unknown>): NotionPage => ({ id: ID, properties }) as unknown as NotionPage;
const title = (name: string, v: string) => ({ [name]: { type: 'title', title: rt(v) } });

async function load() {
  vi.resetModules();
  return import('../index');
}

beforeEach(() => {
  listRows.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('환경변수가 없을 때', () => {
  it('설정·명단은 목 데이터와 같다', async () => {
    const d = await load();
    expect(await d.getSiteLinks()).toEqual(siteLinks);
    expect(await d.getAboutPage()).toEqual(aboutPage);
    expect((await d.getCouncilSummary()).total).toBe(25);
    expect((await d.getOrg()).map((u) => u.name)).toEqual(org.map((u) => u.name));
    expect(listRows).not.toHaveBeenCalled();
  });
});

describe('설정 DB 연결', () => {
  beforeEach(() => {
    vi.stubEnv('NOTION_TOKEN', 't');
    vi.stubEnv('NOTION_DB_SETTINGS', ID);
  });

  it('값이 있는 항목만 덮어쓰고 나머지는 기본값', async () => {
    listRows.mockResolvedValue([
      row({ ...title('항목', '카카오톡 채널'), 링크: { type: 'url', url: 'https://pf.kakao.com/_new' } }),
      row({ ...title('항목', '이메일'), 값: { type: 'rich_text', rich_text: rt('int@sejong.ac.kr') } }),
      row({ ...title('항목', '인사말'), 값: { type: 'rich_text', rich_text: rt('하나\n\n둘') } }),
      row({ ...title('항목', '인스타그램 주소') }),
    ]);
    const d = await load();
    const links = await d.getSiteLinks();
    expect(links.kakao).toBe('https://pf.kakao.com/_new');
    expect(links.email).toBe('int@sejong.ac.kr');
    expect(links.instagram).toBe(siteLinks.instagram);
    expect(links.address).toBe(siteLinks.address);
    const about = await d.getAboutPage();
    expect(about.greeting).toEqual(['하나', '둘']);
    expect(about.signer).toBe(aboutPage.signer);
  });

  it('조회 실패 시 모든 항목 기본값', async () => {
    listRows.mockRejectedValue(new Error('boom'));
    const d = await load();
    expect(await d.getSiteLinks()).toEqual(siteLinks);
    expect(await d.getAboutPage()).toEqual(aboutPage);
  });
});

describe('집행부 DB 연결', () => {
  const councilRows = [
    row({ ...title('이름', '가나다'), 부서: { type: 'select', select: { name: 'B부' } }, 부장: { type: 'checkbox', checkbox: true } }),
    row({ ...title('이름', '라마바'), 부서: { type: 'select', select: { name: 'B부' } } }),
    row({ ...title('이름', '사아자'), 부서: { type: 'select', select: { name: '없음' } } }),
  ];
  const unitRows = [
    row({ ...title('이름', 'B부'), 순서: { type: 'number', number: 2 } }),
    row({ ...title('이름', 'A부'), 순서: { type: 'number', number: 1 } }),
  ];

  beforeEach(() => {
    vi.stubEnv('NOTION_TOKEN', 't');
    vi.stubEnv('NOTION_DB_COUNCIL', ID);
    vi.stubEnv('NOTION_DB_UNITS', 'f'.repeat(32));
    listRows.mockImplementation(async (key) => (key === 'NOTION_DB_UNITS' ? unitRows : councilRows));
  });

  it('부서 순서대로, 없는 부서는 기타, 총원은 계산', async () => {
    const d = await load();
    const o = await d.getOrg();
    expect(o.map((u) => [u.name, u.members.map((m) => m.name)])).toEqual([
      ['A부', []],
      ['B부', ['가나다', '라마바']],
      ['기타', ['사아자']],
    ]);
    expect((await d.getCouncilSummary()).total).toBe(3);
  });

  it('부서 DB 환경변수가 없으면 목 데이터의 부서 목록으로 묶는다', async () => {
    vi.stubEnv('NOTION_DB_UNITS', '');
    const d = await load();
    const o = await d.getOrg();
    expect(o.map((u) => u.name)).toEqual([...org.map((u) => u.name), '기타']);
  });

  it('조회 실패 시 목 데이터 명단', async () => {
    listRows.mockRejectedValue(new Error('boom'));
    const d = await load();
    expect((await d.getCouncilSummary()).total).toBe(25);
  });
});

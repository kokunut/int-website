import { describe, expect, it } from 'vitest';
import { allowedDbIdsFor, fileProxyPath, normalizeId, parseFileProxyParams, pickFileUrl } from '../file-proxy';
import type { NotionPage } from '../notion-types';

const PAGE = '0123456789abcdef0123456789abcdef';
const DB = 'fedcba9876543210fedcba9876543210';

interface Opts {
  pub?: boolean;
  files?: unknown[];
  parent?: NotionPage['parent'];
}

const page = (o: Opts = {}): NotionPage =>
  ({
    id: PAGE,
    parent: o.parent ?? { type: 'database_id', database_id: DB },
    properties: {
      공개: { type: 'checkbox', checkbox: o.pub ?? true },
      이미지: {
        type: 'files',
        files: o.files ?? [{ file: { url: 'https://s3.example/a.png?sig=1' } }, { external: { url: 'https://cdn.example/b.png' } }],
      },
    },
  }) as NotionPage;

describe('file-proxy', () => {
  it('normalizeId: 하이픈 허용, 대문자 정규화, 나머지 null', () => {
    expect(normalizeId('01234567-89AB-cdef-0123-456789abcdef')).toBe(PAGE);
    expect(normalizeId('abc')).toBeNull();
    expect(normalizeId(`${PAGE}zz`)).toBeNull();
  });

  it('fileProxyPath', () => {
    expect(fileProxyPath(PAGE, 'banner-image', 0)).toBe(`/api/notion-file/${PAGE}/banner-image/0`);
    expect(fileProxyPath('b1', 'banner-image', 0)).toBeNull();
    expect(fileProxyPath(PAGE, 'banner-image', 20)).toBeNull();
  });

  it('parseFileProxyParams', () => {
    expect(parseFileProxyParams({ pageId: PAGE, field: 'banner-image-mobile', index: '19' })).toEqual({
      pageId: PAGE,
      field: 'banner-image-mobile',
      index: 19,
    });
    expect(parseFileProxyParams({ pageId: PAGE, field: 'banner-image', index: '20' })).toBeNull();
    expect(parseFileProxyParams({ pageId: PAGE, field: 'banner-image', index: '-1' })).toBeNull();
    expect(parseFileProxyParams({ pageId: PAGE, field: 'banner-image', index: '1.5' })).toBeNull();
    expect(parseFileProxyParams({ pageId: PAGE, field: 'toString', index: '0' })).toBeNull();
    expect(parseFileProxyParams({ pageId: 'x', field: 'banner-image', index: '0' })).toBeNull();
  });

  it('allowedDbIdsFor: 환경변수 없으면 빈 배열', () => {
    expect(allowedDbIdsFor('banner-image', {})).toEqual([]);
    expect(allowedDbIdsFor('banner-image', { NOTION_DB_BANNERS: DB })).toEqual([DB]);
  });

  it('pickFileUrl: 정상(file·external)', () => {
    expect(pickFileUrl(page(), 'banner-image', 0, [DB])).toBe('https://s3.example/a.png?sig=1');
    expect(pickFileUrl(page(), 'banner-image', 1, [DB])).toBe('https://cdn.example/b.png');
  });

  it('pickFileUrl: DB·공개·필드·인덱스·프로토콜 검증', () => {
    expect(pickFileUrl(page(), 'banner-image', 0, [])).toBeNull();
    expect(pickFileUrl(page(), 'banner-image', 0, [PAGE])).toBeNull();
    expect(pickFileUrl(page({ parent: { type: 'page_id' } }), 'banner-image', 0, [DB])).toBeNull();
    expect(pickFileUrl(page({ pub: false }), 'banner-image', 0, [DB])).toBeNull();
    expect(pickFileUrl(page(), 'banner-image-mobile', 0, [DB])).toBeNull();
    expect(pickFileUrl(page(), 'banner-image', 5, [DB])).toBeNull();
    expect(pickFileUrl(page({ files: [{ external: { url: 'http://x.example/a.png' } }] }), 'banner-image', 0, [DB])).toBeNull();
    expect(pickFileUrl(page({ files: [{ external: { url: 'javascript:alert(1)' } }] }), 'banner-image', 0, [DB])).toBeNull();
  });
});

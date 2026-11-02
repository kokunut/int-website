/**
 * 노션 업로드 파일(약 1시간 뒤 만료)을 사이트 내부 안정 경로로 내보내기 위한 순수 함수.
 * 네트워크 없음. 라우트(`/api/notion-file/...`)와 매퍼가 함께 쓴다.
 */
import { BANNER, P_PUBLIC } from './notion-schema';
import type { NotionPage } from './notion-types';

/** 안정 경로가 받는 영문 키 -> 노션 속성 이름과 소속 DB 환경변수 (허용 목록) */
export const FILE_FIELDS = {
  'banner-image': { property: BANNER.image, dbEnv: 'NOTION_DB_BANNERS' },
  'banner-image-mobile': { property: BANNER.imageMobile, dbEnv: 'NOTION_DB_BANNERS' },
} as const;

export type FileField = keyof typeof FILE_FIELDS;

export const MAX_FILE_INDEX = 19;

const HEX32 = /^[0-9a-f]{32}$/;

export const isFileField = (v: string): v is FileField => Object.hasOwn(FILE_FIELDS, v);

/** 하이픈 허용 32자리 hex -> 소문자 32자리. 아니면 null */
export function normalizeId(v: string | null | undefined): string | null {
  const s = (v ?? '').trim().toLowerCase().replace(/-/g, '');
  return HEX32.test(s) ? s : null;
}

/** 안정 경로. 페이지 id 를 정규화할 수 없으면 null */
export function fileProxyPath(pageId: string, field: FileField, index: number): string | null {
  const id = normalizeId(pageId);
  if (!id || !Number.isInteger(index) || index < 0 || index > MAX_FILE_INDEX) return null;
  return `/api/notion-file/${id}/${field}/${index}`;
}

export interface FileProxyParams {
  pageId: string;
  field: FileField;
  index: number;
}

/** 라우트 파라미터 검증. 하나라도 어긋나면 null (-> 404) */
export function parseFileProxyParams(params: { pageId?: string; field?: string; index?: string }): FileProxyParams | null {
  const pageId = normalizeId(params.pageId);
  const { field, index } = params;
  if (!pageId || !field || !isFileField(field) || !index || !/^\d{1,2}$/.test(index)) return null;
  const n = Number(index);
  if (n > MAX_FILE_INDEX) return null;
  return { pageId, field, index: n };
}

/** 설정된 환경변수 중 이 필드의 DB id (정규화). 없으면 빈 배열 */
export function allowedDbIdsFor(field: FileField, env: Record<string, string | undefined>): string[] {
  const id = normalizeId(env[FILE_FIELDS[field].dbEnv]);
  return id ? [id] : [];
}

/**
 * 페이지에서 리다이렉트할 파일 URL 을 고른다.
 * 부모 DB 가 허용 목록에 있고, `공개` 체크된 행이며, 해당 필드·인덱스에 파일이 있고, https 일 때만 반환한다.
 * `allowedDbIds` 는 이 필드가 속한 DB 의 id 들(`allowedDbIdsFor`).
 */
export function pickFileUrl(page: NotionPage, field: FileField, index: number, allowedDbIds: readonly string[]): string | null {
  if (!isFileField(field) || !Number.isInteger(index) || index < 0 || index > MAX_FILE_INDEX) return null;
  const parent = normalizeId(page.parent?.database_id);
  if (!parent || !allowedDbIds.some((id) => normalizeId(id) === parent)) return null;
  if (page.properties[P_PUBLIC]?.checkbox !== true) return null;
  const f = page.properties[FILE_FIELDS[field].property]?.files?.[index];
  const url = f?.file?.url ?? f?.external?.url;
  if (!url) return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

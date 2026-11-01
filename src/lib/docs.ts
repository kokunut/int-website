import type { DocCategory } from './types';

export const DOC_TABS: Record<DocCategory, string> = {
  rules: '회칙',
  minutes: '회의록',
  plans: '활동계획서·결산',
  forms: '서식',
};

export const DOC_CATEGORIES = Object.keys(DOC_TABS) as DocCategory[];

export const isDocCategory = (v: string): v is DocCategory => Object.hasOwn(DOC_TABS, v);

const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);

function parseDriveUrl(file: string | undefined): URL | null {
  if (!file) return null;
  try {
    const u = new URL(file);
    return u.protocol === 'https:' && DRIVE_HOSTS.has(u.hostname) ? u : null;
  } catch {
    return null;
  }
}

export const isDriveUrl = (file: string | undefined): boolean => parseDriveUrl(file) !== null;

export type GoogleFileKind = 'file' | 'document' | 'spreadsheets' | 'presentation';
export interface GoogleFileRef {
  kind: GoogleFileKind;
  id: string;
}

/**
 * 구글 드라이브/문서 링크에서 종류와 ID 를 뽑는다. 알아볼 수 없으면 null.
 * - drive.google.com `/file/d/ID/...`, `/open?id=ID`
 * - docs.google.com `/document|spreadsheets|presentation/d/ID/...` (`/u/0` 같은 접두 허용)
 */
export function parseGoogleFile(file: string | undefined): GoogleFileRef | null {
  const u = parseDriveUrl(file);
  if (!u) return null;
  if (u.hostname === 'drive.google.com') {
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m) return { kind: 'file', id: m[1] };
    const id = u.searchParams.get('id');
    return u.pathname === '/open' && id ? { kind: 'file', id } : null;
  }
  const m = u.pathname.match(/\/(document|spreadsheets|presentation)\/(?:u\/\d+\/)?d\/([^/]+)/);
  return m ? { kind: m[1] as GoogleFileKind, id: m[2] } : null;
}

const base = (kind: GoogleFileKind): string =>
  kind === 'file' ? 'https://drive.google.com/file/d' : `https://docs.google.com/${kind}/d`;

/** iframe 미리보기 URL (`.../preview`). 파싱 불가면 null. */
export function drivePreviewUrl(file: string | undefined): string | null {
  const r = parseGoogleFile(file);
  return r ? `${base(r.kind)}/${encodeURIComponent(r.id)}/preview` : null;
}

/** 직접 다운로드 URL. 드라이브 파일은 `uc?export=download`, 문서류는 `export?format=pdf`. 파싱 불가면 null. */
export function driveDownloadUrl(file: string | undefined): string | null {
  const r = parseGoogleFile(file);
  if (!r) return null;
  const id = encodeURIComponent(r.id);
  return r.kind === 'file'
    ? `https://drive.google.com/uc?export=download&id=${id}`
    : `https://docs.google.com/${r.kind}/d/${id}/export?format=pdf`;
}

/**
 * 노션 API 어댑터 (SDK 없이 fetch, API 버전 고정).
 * 서버 전용. 실패하면 throw 하고, 폴백은 index.ts 가 처리한다.
 */
import type { NotionBlock, NotionPage } from './notion-types';
import { P_PUBLIC } from './notion-schema';

const API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const TIMEOUT_MS = 10_000;

/** 모든 원격 소스(노션·시트·캘린더)가 공유하는 캐시 태그. /api/revalidate 가 이 태그를 무효화한다. */
export const REMOTE_TAG = 'notion';
export const REVALIDATE_SECONDS = 600;

export interface NotionSort {
  property: string;
  direction: 'ascending' | 'descending';
}

interface ListResponse<T> {
  results: T[];
  has_more: boolean;
  next_cursor: string | null;
}

async function notionFetch<T>(path: string, init: { method: 'GET' | 'POST'; body?: unknown; revalidate?: number }): Promise<T> {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN 없음');
  const res = await fetch(`${API}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: init.revalidate ?? REVALIDATE_SECONDS, tags: [REMOTE_TAG] },
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = ((await res.json()) as { message?: string }).message ?? '';
    } catch {
      /* 본문 없음 */
    }
    throw new Error(`Notion ${res.status} ${path.split('?')[0]}${detail ? ` - ${detail}` : ''}`);
  }
  return (await res.json()) as T;
}

/** 공개=true 인 행만, 지정한 정렬로 모두 가져온다 (페이지네이션 포함) */
export async function queryDatabase(dbId: string, sorts: NotionSort[] = []): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const res = await notionFetch<ListResponse<NotionPage>>(`/databases/${encodeURIComponent(dbId)}/query`, {
      method: 'POST',
      body: {
        page_size: 100,
        filter: { property: P_PUBLIC, checkbox: { equals: true } },
        ...(sorts.length ? { sorts } : {}),
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    });
    pages.push(...res.results);
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

/** 페이지 본문 블록 (최상위만) */
export async function fetchBlocks(pageId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;
  do {
    const q = `?page_size=100${cursor ? `&start_cursor=${encodeURIComponent(cursor)}` : ''}`;
    const res = await notionFetch<ListResponse<NotionBlock>>(`/blocks/${encodeURIComponent(pageId)}/children${q}`, {
      method: 'GET',
    });
    blocks.push(...res.results);
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

/** 이미지 안정 경로 전용 페이지 조회. 서명 URL(약 1시간)보다 짧게 5분 캐시 */
export const FILE_REVALIDATE_SECONDS = 300;

export async function fetchPage(pageId: string): Promise<NotionPage> {
  return notionFetch<NotionPage>(`/pages/${encodeURIComponent(pageId)}`, {
    method: 'GET',
    revalidate: FILE_REVALIDATE_SECONDS,
  });
}

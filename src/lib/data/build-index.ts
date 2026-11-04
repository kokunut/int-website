import type { NotionPage } from './notion-types';

/** 목록과 키 -> 노션 페이지 id 색인. 본문은 상세 페이지에서 그 페이지 블록만 읽을 때 쓴다 */
export interface PageIndex<T, K> {
  list: T[];
  pageIds: Map<K, string>;
}

/**
 * 행들을 map 한 뒤 keyOf 가 같은 항목이 겹치면 먼저 나온 행만 남긴다 (경고).
 * 행 순서가 곧 우선순위이므로 조회 정렬이 고정돼 있어야 결과가 매번 같다.
 * @param label 경고에 쓸 키 표기 (기본: 키 그대로)
 */
export function buildIndex<T, K>(
  pages: NotionPage[],
  map: (page: NotionPage) => T | null,
  keyOf: (item: T) => K,
  dbKey: string,
  label: (key: K) => string = String,
): PageIndex<T, K> {
  const list: T[] = [];
  const pageIds = new Map<K, string>();
  for (const p of pages) {
    const item = map(p);
    if (!item) continue;
    const key = keyOf(item);
    if (pageIds.has(key)) {
      console.warn(`[data] ${dbKey} 중복 건너뜀: ${label(key)} (먼저 나온 행만 사용)`);
      continue;
    }
    list.push(item);
    pageIds.set(key, p.id);
  }
  return { list, pageIds };
}

import type { ArchiveCategory, ArchivePost } from './types';

/** 분류 코드 -> 화면 이름 (메뉴·제목·배지) */
export const ARCHIVE_LABELS: Record<ArchiveCategory, string> = {
  career: '취업 아카이브',
  military: '병영 길라잡이',
};

/** 노션 `분류` 선택값(배지에 쓰는 짧은 이름) */
export const ARCHIVE_BADGES: Record<ArchiveCategory, string> = {
  career: '취업',
  military: '병영',
};

export const ARCHIVE_CATEGORIES = Object.keys(ARCHIVE_LABELS) as ArchiveCategory[];

export const isArchiveCategory = (v: string): v is ArchiveCategory => Object.hasOwn(ARCHIVE_LABELS, v);

/** 고정 글 먼저, 그다음 날짜 내림차순(같으면 슬러그 순) */
export function sortArchive(list: ArchivePost[]): ArchivePost[] {
  return [...list].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
  );
}

/** 주제 탭: 정해 둔 주제 순서대로, 그 밖의 주제는 나온 순서대로. 글이 없는 주제는 뺀다 */
export function topicsOf(list: ArchivePost[], preset: readonly string[]): string[] {
  const present = new Set(list.map((p) => p.topic).filter(Boolean));
  const known = preset.filter((t) => present.has(t));
  const extra = [...present].filter((t) => !preset.includes(t));
  return [...known, ...extra];
}

/** 주제 탭 + 제목 검색. topic 이 빈 문자열이면 전체 */
export function filterArchive(list: ArchivePost[], topic: string, query: string): ArchivePost[] {
  const q = query.trim();
  return list.filter((p) => (topic === '' || p.topic === topic) && p.title.includes(q));
}

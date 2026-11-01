import type { Partner } from './types';

export const ALL_CATEGORY = '전체';

/** 필터 탭: '전체' + 제휴에 실제로 쓰인 분류(등장 순서) */
export function partnerCategories(items: Pick<Partner, 'cat'>[]): string[] {
  return [ALL_CATEGORY, ...new Set(items.map((p) => p.cat))];
}

export function filterPartners<T extends Pick<Partner, 'cat'>>(items: T[], category: string): T[] {
  return category === ALL_CATEGORY ? items : items.filter((p) => p.cat === category);
}

/** 지도 링크: mapUrl 이 있으면 그대로, 없으면 이름+위치로 네이버 지도 검색 링크 */
export function partnerMapUrl(p: { name: string; place: string; mapUrl?: string }): string {
  const custom = p.mapUrl?.trim();
  if (custom && custom !== '#') return custom;
  return `https://map.naver.com/p/search/${encodeURIComponent(`${p.name} ${p.place}`.trim())}`;
}

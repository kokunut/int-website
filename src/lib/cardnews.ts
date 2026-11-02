import type { Notice } from './types';

/** 카드뉴스 공지 판정: 유형이 카드뉴스이거나 이미지가 있는 공지 */
export const isCardNews = (n: Pick<Notice, 'type' | 'cards'>): boolean => n.type === '카드뉴스' || (n.cards?.length ?? 0) > 0;

/** 인덱스를 0 ~ total-1 범위로 제한 (total 이 0 이하면 0) */
export function clampIndex(i: number, total: number): number {
  if (total <= 0 || !Number.isFinite(i)) return 0;
  return Math.min(Math.max(Math.round(i), 0), total - 1);
}

/** 현재에서 delta 칸 이동한 인덱스 (양 끝에서 멈춤) */
export const stepIndex = (current: number, delta: number, total: number): number => clampIndex(current + delta, total);

/** 가로 스크롤 위치 -> 보이는 장 인덱스 */
export function indexFromScroll(scrollLeft: number, width: number, total: number): number {
  if (width <= 0) return 0;
  return clampIndex(scrollLeft / width, total);
}

/** 스와이프로 인정할 최소 가로 이동(px) */
export const SWIPE_MIN_DX = 40;

/** 터치 이동량 -> 넘길 방향. 가로가 SWIPE_MIN_DX 초과이면서 세로보다 클 때만 (왼쪽으로 밀면 +1, 오른쪽으로 밀면 -1, 아니면 0) */
export function swipeDelta(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) <= SWIPE_MIN_DX || Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}

/** "2 / 6" 표시 */
export const counterText = (index: number, total: number): string => `${index + 1} / ${total}`;

/** 이미지 대체 텍스트: "제목 카드뉴스 n/총장수" */
export const cardAlt = (title: string, index: number, total: number): string => `${title} 카드뉴스 ${index + 1}/${total}`;

/** OG 이미지용 절대 URL. 사이트 내부 경로(/…)는 기준 URL 을 붙이고, https 는 그대로, 그 외는 null */
export function ogImageUrl(src: string | undefined, absolute: (path: string) => string): string | null {
  if (!src) return null;
  if (/^\/(?![/\\])/.test(src)) return absolute(src);
  return src.startsWith('https://') ? src : null;
}

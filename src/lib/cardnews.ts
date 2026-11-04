import type { Notice } from './types';
import { cleanUrlText, isInternalPath } from './url';

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

/**
 * 목표 장으로 스크롤하는 중인지 판정(true 면 도착). 슬라이드 너비가 소수 픽셀이면 `scrollLeft` 가 목표 위치와
 * 정확히 같아지지 않을 수 있어, 한 장 너비의 절반 미만이면 도착으로 본다.
 */
export function hasReachedTarget(scrollLeft: number, width: number, target: number): boolean {
  if (width <= 0) return true;
  return Math.abs(scrollLeft - target * width) < width / 2;
}

/** "2 / 6" 표시 */
export const counterText = (index: number, total: number): string => `${index + 1} / ${total}`;

/** 이미지 대체 텍스트: "제목 카드뉴스 n/총장수" */
export const cardAlt = (title: string, index: number, total: number): string => `${title} 카드뉴스 ${index + 1}/${total}`;

/** OG 이미지용 절대 URL. 사이트 내부 경로(/…)는 기준 URL 을 붙이고, https 는 그대로, 그 외는 null */
export function ogImageUrl(src: string | undefined, absolute: (path: string) => string): string | null {
  const s = cleanUrlText(src);
  if (!s) return null;
  if (isInternalPath(s)) return absolute(s);
  return s.startsWith('https://') ? s : null;
}

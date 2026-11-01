import { track } from '@vercel/analytics';

/** 커스텀 이벤트 이름 (Vercel Analytics) */
export const EVENTS = {
  popupDetail: 'popup_detail',
  paybackApply: 'payback_apply',
  kakaoFab: 'kakao_fab',
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

/** Vercel 빌드에서만 전송, 그 밖에서는 아무 일도 하지 않는다. 통계 실패가 화면에 영향을 주지 않게 예외도 삼킨다. */
export function trackEvent(name: AnalyticsEvent, enabled: boolean = process.env.NEXT_PUBLIC_VERCEL === '1'): void {
  if (!enabled) return;
  try {
    track(name);
  } catch {
    /* 통계 실패는 무시 */
  }
}

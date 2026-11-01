/** 커스텀 이벤트 이름 (Vercel Analytics) */
export const EVENTS = {
  popupDetail: 'popup_detail',
  paybackApply: 'payback_apply',
  kakaoFab: 'kakao_fab',
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * 운영(Production) 배포에서만 전송, 그 밖에서는 아무 일도 하지 않는다.
 * `track`은 이벤트 발생 시 동적 import 해 초기 JS 에 넣지 않고, 통계 실패가 화면에 영향을 주지 않게 예외도 삼킨다.
 */
export async function trackEvent(
  name: AnalyticsEvent,
  enabled: boolean = process.env.NEXT_PUBLIC_ANALYTICS === '1',
): Promise<void> {
  if (!enabled) return;
  try {
    const { track } = await import('@vercel/analytics');
    track(name);
  } catch {
    /* 통계 실패는 무시 */
  }
}

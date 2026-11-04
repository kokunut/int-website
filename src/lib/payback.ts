export type PaybackState = 'normal' | 'warning' | 'critical';

export const PAYBACK_WARNING_RATE = 80;
export const PAYBACK_CRITICAL_RATE = 95;

/** 예산 소진율(%)로 미터 상태를 정한다. 80 이상 경고, 95 이상 위급 */
export function paybackState(rate: number): PaybackState {
  if (rate >= PAYBACK_CRITICAL_RATE) return 'critical';
  if (rate >= PAYBACK_WARNING_RATE) return 'warning';
  return 'normal';
}

export const PAYBACK_STATE_LABEL: Record<PaybackState, string | null> = {
  normal: null,
  warning: '⚠ 예산이 얼마 남지 않았어요',
  critical: '⛔ 곧 마감돼요',
};

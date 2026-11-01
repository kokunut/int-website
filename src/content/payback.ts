import type { Payback } from '@/lib/types';

// 검정비 페이백 — 구글 시트에서 집계값만 받아옴 (개인정보 X)
export const payback: Payback = {
  budget: 500000,
  paid: 310000,
  recipients: 9,
  applyPeriod: '2026.10.13 ~ 11.07',
  nextPayDate: '2026-11-14',
  updatedAt: '2026-10-27',
};

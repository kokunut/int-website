import type { Rental } from '@/lib/types';

// 대여사업 현황 — 구글 시트(물품, 총수량, 대여중)에서 수량만 받아옴. 대여 장부(이름·학번)는 시트에만 두고 공개하지 않는다.
export const rental: Rental = {
  items: [
    { name: '충전기', total: 6, out: 2 },
    { name: '보조배터리', total: 5, out: 5 },
    { name: '멀티 허브', total: 3, out: 1 },
    { name: '공학용 계산기', total: 4, out: 0 },
    { name: '고데기', total: 2, out: 1 },
    { name: '헤어드라이기', total: 2, out: 0 },
  ],
  updatedAt: '2026-11-08',
};

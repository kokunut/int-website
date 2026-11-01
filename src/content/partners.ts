import type { Partner, ResolvedPartner } from '@/lib/types';

// 제휴 — hours/period/address/details/condition이 없으면 PARTNER_DEFAULT 값 사용
export const partners: Partner[] = [
  {
    id: 'p1',
    name: 'OO식당',
    cat: '식당',
    benefit: '학생증 제시 시 10% 할인',
    place: '정문 앞',
    details: ['전 메뉴 10% 할인', '단체 예약 시 음료 서비스'],
    condition: '1인 1회, 다른 할인과 중복 불가',
  },
  { id: 'p2', name: 'OO카페', cat: '카페', benefit: '음료 사이즈 업', place: '후문 쪽' },
  { id: 'p3', name: 'OO분식', cat: '식당', benefit: '1,000원 할인', place: '정문 앞' },
  { id: 'p4', name: 'OO스터디카페', cat: '생활', benefit: '정기권 15% 할인', place: '어린이대공원역' },
  { id: 'p5', name: 'OO베이커리', cat: '카페', benefit: '5,000원 이상 구매 시 음료 증정', place: '후문 쪽' },
  { id: 'p6', name: 'OO안경', cat: '생활', benefit: '렌즈 20% 할인', place: '건대입구역' },
];

export const PARTNER_DEFAULT: Pick<ResolvedPartner, 'hours' | 'period' | 'address' | 'details' | 'condition'> = {
  hours: '매장 영업시간 (작성 필요)',
  period: '2026.03.01 ~ 2027.02.28',
  address: '상세 주소 (작성 필요)',
  details: [],
  condition: '학생증 또는 모바일 학생증 제시',
};

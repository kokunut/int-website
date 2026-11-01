import type { Banner } from '@/lib/types';

// image가 있으면 이미지, 없으면 텍스트 템플릿으로 표시
// imageMobile: 모바일용 세로형 이미지
export const banners: Banner[] = [
  {
    image: null,
    imageMobile: null,
    href: '/about',
    word: 'INT',
    slogan: '인공지능융합대학 학생회, 인트가 함께합니다.',
    placeLabel: 'PLACE',
    place: '서울특별시 광진구 능동로 209 세종대학교 (학생회실 호실 확인 필요)',
    links: [
      { label: 'Instagram', value: '@인스타그램_아이디 (확인 필요)' },
      { label: 'Kakaotalk', value: '@인트 학생회 (확인 필요)' },
      { label: 'Email', value: 'int@example.com (확인 필요)' },
    ],
  },
  {
    image: null,
    imageMobile: null,
    href: '/contest/c2026-ai',
    word: 'CONTEST',
    slogan: '제1회 인트 AI 아이디어 공모전',
    placeLabel: 'PERIOD',
    place: '2026.10.20 ~ 2026.11.15',
    links: [
      { label: '대상', value: '인공지능융합대학 재학생' },
      { label: '시상', value: '총 OO만 원' },
    ],
  },
  {
    image: null,
    imageMobile: null,
    href: '/payback',
    word: 'PAYBACK',
    slogan: '자격증 검정비, 학생회가 돌려드려요.',
    placeLabel: 'APPLY',
    place: '2026.10.13 ~ 2026.11.07',
    links: [{ label: '남은 예산', value: '페이백 현황에서 확인' }],
  },
];

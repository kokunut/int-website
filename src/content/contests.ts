import type { Contest } from '@/lib/types';

// 공모전 — 학생회 주최만. popup:true + 기간 중일 때만 팝업
export const contests: Contest[] = [
  {
    id: 'c2026-ai',
    title: '제1회 인트 AI 아이디어 공모전',
    start: '2026-10-20',
    end: '2026-11-15',
    popup: true,
    desc: 'AI로 학교생활의 불편을 해결하는 아이디어를 모집합니다. 인공지능융합대학 재학생이라면 누구나 참여할 수 있어요.',
    target: '인공지능융합대학 재학생 (개인 또는 3인 이하 팀)',
    prize: '총 OO만 원',
    contact: '카카오톡 채널 · int@example.com',
    schedule: [
      { label: '접수', value: '2026.10.20 ~ 11.15' },
      { label: '서류 심사', value: '2026.11.16 ~ 11.20' },
      { label: '본선 발표', value: '2026.11.27' },
      { label: '시상', value: '2026.12.04' },
    ],
    prizes: [
      { rank: '대상', count: '1팀', amount: 'OO만 원' },
      { rank: '최우수상', count: '1팀', amount: 'OO만 원' },
      { rank: '우수상', count: '2팀', amount: 'OO만 원' },
    ],
    howTo: [
      { title: '신청서 작성', desc: '구글폼으로 팀 정보 제출' },
      { title: '기획서 제출', desc: '양식에 맞춘 PDF 업로드' },
      { title: '본선 발표', desc: '서류 통과 팀 5분 발표' },
    ],
    notes: [
      '타 공모전 수상작 및 표절작은 심사에서 제외됩니다',
      '제출물의 저작권은 참가자에게 있습니다',
      '심사 결과는 공지사항으로 안내합니다',
    ],
    applyUrl: 'https://forms.gle/',
    guideUrl: '#',
  },
  {
    id: 'c2026-logo',
    title: '인트 학생회 로고 공모전',
    start: '2026-03-04',
    end: '2026-03-31',
    popup: false,
    desc: '인트 학생회를 상징할 로고 디자인을 모집했습니다.',
    target: '인공지능융합대학 재학생',
    prize: '총 OO만 원',
    contact: '카카오톡 채널',
    schedule: [
      { label: '접수', value: '2026.03.04 ~ 03.31' },
      { label: '결과 발표', value: '2026.04.07' },
    ],
    notes: ['수상작은 학생회 로고로 사용됩니다'],
    result: '수상작은 공지사항에서 확인할 수 있어요.',
  },
];

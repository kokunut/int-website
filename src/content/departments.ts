import type { Department } from '@/lib/types';

// 학과 — 지금은 4개 모두 같은 틀. 실제 학과별 내용으로 하나씩 교체
export const departments: Department[] = [1, 2, 3, 4].map((n) => ({
  id: `d${n}`,
  name: `OO학과 ${n}`,
  intro: '학과 한 줄 소개를 적어주세요.',
  body: [
    '학과가 무엇을 배우는 곳인지 2~3문장으로 소개해 주세요.',
    '학과만의 특징(트랙, 연구실, 교류 프로그램 등)을 적어주세요.',
  ],
  subjects: ['과목 A', '과목 B', '과목 C'],
  curriculum: [
    { year: '1학년', subjects: ['기초 과목 A', '기초 과목 B'] },
    { year: '2학년', subjects: ['전공 기초 A', '전공 기초 B'] },
    { year: '3학년', subjects: ['전공 심화 A', '전공 심화 B'] },
    { year: '4학년', subjects: ['캡스톤디자인', '전공 선택'] },
  ],
  career: '주요 진로 분야',
  careers: ['진로 A', '진로 B', '진로 C', '대학원 진학'],
  office: 'OO관 OOO호',
  phone: '02-0000-0000',
  url: '#',
}));

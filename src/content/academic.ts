import type { AcademicEvent } from '@/lib/types';

// 학교 학사일정 (학기 초 1회 입력)
export const academic: AcademicEvent[] = [
  { title: '2학기 중간고사', start: '2026-10-20', end: '2026-10-26' },
  { title: '2학기 중간고사 성적 입력', start: '2026-10-27', end: '2026-11-02' },
  { title: '2학기 기말고사', start: '2026-12-15', end: '2026-12-21' },
];

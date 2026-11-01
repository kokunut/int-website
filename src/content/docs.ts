import type { DocCategory, DocItem } from '@/lib/types';

// 자료실 — 실제 연동 시 file: 구글 드라이브 공유 링크(미리보기는 /preview 임베드)
export const docs: Record<DocCategory, DocItem[]> = {
  rules: [
    { id: 'r1', title: '인공지능융합대학 학생회칙', date: '2026-03-02', by: '사무부', summary: ['학생회의 목적, 조직, 선거, 회계 등에 관한 기본 규정'] },
    { id: 'r2', title: '학생회 세칙', date: '2026-03-02', by: '사무부', summary: ['회칙 시행에 필요한 세부 사항'] },
  ],
  minutes: [
    { id: 'm3', title: '10월 정기 회의록', date: '2026-10-08', by: '사무부', summary: ['안건 1: 학술제 일정 확정', '안건 2: 검정비 페이백 2차 신청 기간 결정', '안건 3: 중간고사 간식 행사 예산 승인'] },
    { id: 'm2', title: '9월 정기 회의록', date: '2026-09-10', by: '사무부', summary: ['안건 1: 2학기 사업 계획 검토', '안건 2: 제휴 매장 추가 논의'] },
    { id: 'm1', title: '개강 전 임시 회의록', date: '2026-08-25', by: '사무부', summary: ['안건 1: 개강 행사 준비'] },
  ],
  plans: [
    { id: 'a3', title: '2026 2학기 활동계획서', date: '2026-09-01', by: '회장단', summary: ['2학기 주요 사업과 예산 계획'] },
    { id: 'a2', title: '2026 1학기 결산안', date: '2026-07-10', by: '사무부', summary: ['1학기 학생회비 수입·지출 내역'] },
    { id: 'a1', title: '2026 1학기 활동계획서', date: '2026-03-02', by: '회장단', summary: ['1학기 주요 사업과 예산 계획'] },
  ],
  forms: [
    { id: 'f2', title: '행사 신청서 양식', date: '2026-03-02', by: '사무부', summary: ['학생회 행사 참여·대관 신청 시 사용'] },
    { id: 'f1', title: '예산 집행 증빙 양식', date: '2026-03-02', by: '사무부', summary: ['예산 사용 후 영수증 첨부용'] },
  ],
};

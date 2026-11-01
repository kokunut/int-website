import type { AboutPage, DepartmentsPage, FaqPage, PartnersPage, PaybackPage, SuggestPage } from '@/lib/types';

// 페이지별 편집용 문구 — 다음 집행부는 이 파일(또는 연동된 노션/시트)만 고치면 된다.

export const aboutPage: AboutPage = {
  desc: '세종대학교 인공지능융합대학 학생회 인트를 소개합니다.',
  greetingTitle: '인사말',
  greeting: ['학생회장 인사말이 들어갈 자리입니다. 올해 학생회의 방향과 약속을 적어주세요.'],
  signer: '학생회장 OOO',
  // photo: { src: '', alt: '' },
};

export const departmentsPage: DepartmentsPage = {
  desc: '인공지능융합대학 소속 학과를 소개합니다.',
};

export const paybackPage: PaybackPage = {
  desc: '자격증 응시료(검정비)를 학생회 예산으로 돌려드립니다.',
  steps: [
    { title: '구글폼 신청', desc: '신청 기간 내 폼 작성' },
    { title: '증빙 제출', desc: '응시료 영수증·응시 확인서 업로드' },
    { title: '학생회 확인', desc: '대상 여부·서류 검토' },
    { title: '지급', desc: '지급일에 일괄 입금' },
  ],
  eligibility: ['인공지능융합대학 재학생', '대상 자격증 목록 (작성 필요)', '1인당 지원 한도 (작성 필요)'],
  notes: ['예산 소진 시 조기 마감됩니다', '허위 증빙 시 지급이 취소됩니다', '현황은 매주 갱신됩니다'],
};

export const suggestPage: SuggestPage = {
  desc: '학교생활 불편 사항이나 학생회에 바라는 점을 자유롭게 남겨주세요. 익명으로 제출돼요.',
  ctaTitle: '건의하기',
  ctaDesc: '구글폼으로 연결됩니다. 답변은 이 페이지와 인스타그램에 공개돼요.',
  steps: [
    { title: '접수', desc: '구글폼 제출' },
    { title: '검토', desc: '정기 회의 안건 상정' },
    { title: '답변 공개', desc: '처리 결과 게시' },
  ],
};

export const partnersPage: PartnersPage = {
  desc: '학생증을 보여주면 받을 수 있는 혜택이에요.',
  footnote: '제휴 문의는 카카오톡 채널로 연락해 주세요.',
  howTo: [
    { title: '매장 방문', desc: '', source: 'place' },
    { title: '학생증 제시', desc: '결제 전에 보여주세요' },
    { title: '혜택 적용', desc: '', source: 'condition' },
  ],
};

export const faqPage: FaqPage = {
  contactTitle: '찾는 답이 없나요?',
  contactDesc: '카카오톡 채널로 문의해 주세요.',
};

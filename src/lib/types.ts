/** 날짜 문자열: 항상 `YYYY-MM-DD` (KST 기준 날짜) */
export type DateString = string;

export interface SiteLinks {
  kakao: string;
  instagram: string;
  instagramId: string;
  notionMilitary: string;
  notionContest: string;
  suggestForm: string;
  paybackForm: string;
  gcalSubscribe: string;
  address: string;
}

export interface LabelValue {
  label: string;
  value: string;
}

export interface Banner {
  image: string | null;
  imageMobile: string | null;
  href: string;
  word: string;
  slogan: string;
  placeLabel: string;
  place: string;
  links: LabelValue[];
}

export interface DateRange {
  start: DateString;
  end: DateString;
}

export interface AcademicEvent {
  title: string;
  start: DateString;
  end: DateString;
}

export type NoticeType = '일반' | '행사';

export interface Notice {
  id: number;
  type: NoticeType;
  title: string;
  date: DateString;
  /** 있으면 캘린더에도 표시된다 */
  event?: DateRange;
  body: string[];
}

export interface ContestPrize {
  rank: string;
  count: string;
  amount: string;
}

export interface ContestStep {
  title: string;
  desc: string;
}

export interface Contest {
  id: string;
  title: string;
  start: DateString;
  end: DateString;
  popup: boolean;
  desc: string;
  target: string;
  prize: string;
  contact: string;
  schedule?: LabelValue[];
  prizes?: ContestPrize[];
  howTo?: ContestStep[];
  notes?: string[];
  applyUrl?: string;
  guideUrl?: string;
  result?: string;
}

export type ContestStatus = '예정' | '진행중' | '마감';

/** 팝업 분류 */
export type PopupCategory = '제휴' | '행사' | '공지' | '공모전';

/** 메인 팝업 한 건 (노션 팝업 DB 또는 공모전 변환). id 는 "보지 않기" 저장 키·중복 판정에 쓰인다 */
export interface Popup {
  id: string;
  title: string;
  cat: PopupCategory;
  start: DateString;
  end: DateString;
  desc: string;
  /** 포스터 이미지 경로(https 또는 /api/notion-file/…). 없으면 자리 표시 */
  image: string | null;
  /** "자세히 보기" 대상 (내부 경로 또는 https). 없으면 버튼 없음 */
  href: string;
  /** 버튼 문구 */
  cta: string;
  /** 작을수록 먼저. 없으면 맨 뒤 */
  order?: number;
}

export interface Payback {
  budget: number;
  paid: number;
  recipients: number;
  applyPeriod: string;
  nextPayDate: DateString;
  updatedAt: DateString;
}

export interface CurriculumYear {
  year: string;
  subjects: string[];
}

export interface Department {
  id: string;
  name: string;
  /** 소속 학부 (예: 창의소프트학부). 보조 표기용 */
  college?: string;
  intro: string;
  body: string[];
  /** 대표 교과. 없거나 비면 숨김 */
  subjects?: string[];
  /** 학년별 교과. 없거나 비면 숨김 */
  curriculum?: CurriculumYear[];
  career: string;
  /** 대표 사진 URL. 없으면 사진 영역을 렌더링하지 않음 */
  photo?: string;
  /** 졸업 후 진로. 없거나 비면 숨김 */
  careers?: string[];
  office: string;
  phone: string;
  url: string;
  /** 출처 URL (세종대학교 홈페이지) */
  source: string;
}

export interface Member {
  name: string;
  /** 학과·전공 약칭 (원문 그대로). 모르면 생략 */
  major?: string;
  /** 직책 (회장단 등) */
  role?: string;
  /** 부장 여부 */
  lead?: boolean;
}

export interface OrgUnit {
  id: string;
  name: string;
  desc: string;
  members: Member[];
}

export interface Partner {
  id: string;
  name: string;
  cat: string;
  benefit: string;
  place: string;
  hours?: string;
  period?: string;
  address?: string;
  details?: string[];
  condition?: string;
  /** 지도 링크. 없으면 이름+위치로 네이버 지도 검색 링크를 만든다 */
  mapUrl?: string;
}

/** PARTNER_DEFAULT 로 빈 값을 채운 제휴 정보 */
export type ResolvedPartner = Omit<Partner, 'hours' | 'period' | 'address' | 'details' | 'condition'> &
  Required<Pick<Partner, 'hours' | 'period' | 'address' | 'details' | 'condition'>>;

export type DocCategory = 'rules' | 'minutes' | 'plans' | 'forms';

export interface DocItem {
  id: string;
  title: string;
  date: DateString;
  by: string;
  summary: string[];
  /** 구글 드라이브 공유 링크(PDF). 없으면 미리보기 자리표시 */
  file?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SuggestAnswer {
  title: string;
  answer: string;
  date: DateString;
}

export type CalendarCategory = 'academic' | 'event' | 'contest';

export interface CalendarEvent {
  cat: CalendarCategory;
  title: string;
  start: DateString;
  end: DateString;
  link?: string;
}

/** 번호 단계 (제목 + 설명) */
export interface StepItem {
  title: string;
  desc: string;
}

export interface AboutPage {
  desc: string;
  greetingTitle: string;
  greeting: string[];
  signer: string;
  /** 단체 사진. 없으면 자리표시 */
  photo?: { src: string; alt: string };
}

export interface PaybackPage {
  desc: string;
  steps: StepItem[];
  eligibility: string[];
  notes: string[];
}

export interface SuggestPage {
  desc: string;
  ctaTitle: string;
  ctaDesc: string;
  steps: StepItem[];
}

export interface PartnersPage {
  desc: string;
  footnote: string;
  /** 상세 '이용 방법'. source 가 있으면 desc 대신 제휴 항목의 해당 값을 쓴다 */
  howTo: (StepItem & { source?: 'place' | 'condition' })[];
}

export interface DepartmentsPage {
  desc: string;
}

export interface FaqPage {
  contactTitle: string;
  contactDesc: string;
}

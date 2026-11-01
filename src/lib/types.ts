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
  intro: string;
  body: string[];
  subjects: string[];
  curriculum: CurriculumYear[];
  career: string;
  careers: string[];
  office: string;
  phone: string;
  url: string;
}

export interface OrgUnit {
  name: string;
  desc: string;
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

/**
 * 노션 DB 속성 이름 — 코드와 운영 매뉴얼(docs/brain/06-content-ops.md)이 같은 이름을 쓰도록 한 곳에 둔다.
 * 노션에서 속성 이름을 바꾸면 여기도 같이 바꿔야 한다.
 */

export type NotionPropType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'url'
  | 'files';

export interface PropSpec {
  /** 노션 속성 이름 */
  name: string;
  type: NotionPropType;
  required: boolean;
  example: string;
  note?: string;
  /** select 속성의 선택지 (DB 자동 생성 시 미리 만든다) */
  options?: string[];
}

export const P_PUBLIC = '공개';

const pub: PropSpec = { name: P_PUBLIC, type: 'checkbox', required: true, example: '체크', note: '체크된 행만 사이트에 나옵니다' };

/** 공지사항 */
export const NOTICE = {
  title: '제목',
  no: '번호',
  type: '유형',
  date: '날짜',
  event: '행사기간',
} as const;

/** 공모전 */
export const CONTEST = {
  title: '제목',
  slug: '슬러그',
  period: '기간',
  popup: '팝업',
  desc: '소개',
  target: '대상',
  prize: '상금',
  contact: '문의',
  schedule: '일정',
  prizes: '시상',
  howTo: '참여방법',
  notes: '유의사항',
  applyUrl: '신청링크',
  guideUrl: '안내링크',
  result: '결과',
} as const;

/** 제휴 */
export const PARTNER = {
  name: '이름',
  slug: '슬러그',
  cat: '분류',
  benefit: '혜택',
  place: '위치',
  hours: '영업시간',
  period: '기간',
  address: '주소',
  details: '상세',
  condition: '조건',
  mapUrl: '지도링크',
  order: '순서',
} as const;

/** 자료실 (4개 분류를 DB 하나에 모으고 '분류' 선택으로 나눈다) */
export const DOC = {
  title: '제목',
  slug: '슬러그',
  category: '분류',
  date: '날짜',
  by: '작성',
  summary: '요약',
  file: '파일링크',
} as const;

/** 분류 선택값 -> 코드 */
export const DOC_CATEGORY_LABELS = {
  회칙: 'rules',
  회의록: 'minutes',
  '활동계획서·결산': 'plans',
  서식: 'forms',
} as const;

/** 예전/약식 이름도 받아 준다 (매뉴얼에는 싣지 않음) */
export const DOC_CATEGORY_ALIASES = { '계획·결산': 'plans', 양식: 'forms' } as const;

/** 자주 묻는 질문 */
export const FAQ = {
  q: '질문',
  a: '답변',
  order: '순서',
} as const;

/** 배너 */
export const BANNER = {
  slogan: '문구',
  image: '이미지',
  imageMobile: '모바일이미지',
  href: '링크',
  word: '큰글자',
  placeLabel: '장소라벨',
  place: '장소',
  links: '정보',
  order: '순서',
} as const;

/** 건의 답변 */
export const SUGGEST = {
  title: '제목',
  answer: '답변',
  date: '날짜',
} as const;

export const NOTICE_TYPES = ['일반', '행사'] as const;

export interface DbSpec {
  key: string;
  label: string;
  env: string;
  props: PropSpec[];
  /** 공지는 본문을 페이지 내용(블록)에서 읽는다 */
  bodyNote?: string;
}

const t = (
  name: string,
  type: NotionPropType,
  required: boolean,
  example: string,
  note?: string,
  options?: string[],
): PropSpec => ({
  name,
  type,
  required,
  example,
  note,
  ...(options ? { options } : {}),
});

/** 제휴 분류 선택지 (목 데이터의 분류) */
export const PARTNER_CATEGORIES = ['식당', '카페', '생활'];

/** 매뉴얼 표 생성용 스키마 (위 상수와 동일한 이름을 사용) */
export const DB_SPECS: DbSpec[] = [
  {
    key: 'notices',
    label: '공지사항',
    env: 'NOTION_DB_NOTICES',
    bodyNote: '본문은 노션 페이지를 열어 그 안에 적습니다 (문단·제목·글머리·번호 목록만 표시, 한 줄이 한 문단).',
    props: [
      t(NOTICE.title, 'title', true, '2026 학술제 참가팀 모집'),
      t(NOTICE.no, 'number', true, '6', '겹치지 않는 양의 정수. 주소(/notice/6)에 쓰입니다'),
      t(NOTICE.type, 'select', true, '행사', '일반 또는 행사', [...NOTICE_TYPES]),
      t(NOTICE.date, 'date', true, '2026-10-26', '게시일'),
      t(NOTICE.event, 'date', false, '2026-11-03 → 2026-11-14', '캘린더에도 표시할 때만. 하루면 시작일만'),
      pub,
    ],
  },
  {
    key: 'contests',
    label: '공모전',
    env: 'NOTION_DB_CONTESTS',
    props: [
      t(CONTEST.title, 'title', true, '제1회 인트 AI 아이디어 공모전'),
      t(CONTEST.slug, 'rich_text', true, 'c2026-ai', '영문 소문자·숫자·하이픈만'),
      t(CONTEST.period, 'date', true, '2026-10-20 → 2026-11-15', '시작일 → 마감일'),
      t(CONTEST.popup, 'checkbox', false, '체크', '기간 중 메인 팝업으로 띄움'),
      t(CONTEST.desc, 'rich_text', false, 'AI로 학교생활의 불편을 해결하는 …'),
      t(CONTEST.target, 'rich_text', false, '인공지능융합대학 재학생'),
      t(CONTEST.prize, 'rich_text', false, '총 100만 원'),
      t(CONTEST.contact, 'rich_text', false, '카카오톡 채널 · int@example.com'),
      t(CONTEST.schedule, 'rich_text', false, '접수 | 2026.10.20 ~ 11.15', '한 줄에 하나: 라벨 | 값'),
      t(CONTEST.prizes, 'rich_text', false, '대상 | 1팀 | 50만 원', '한 줄에 하나: 구분 | 인원 | 상금'),
      t(CONTEST.howTo, 'rich_text', false, '신청서 작성 | 구글폼으로 제출', '한 줄에 하나: 제목 | 설명'),
      t(CONTEST.notes, 'rich_text', false, '표절작은 심사에서 제외됩니다', '한 줄에 하나'),
      t(CONTEST.applyUrl, 'url', false, 'https://forms.gle/xxxx'),
      t(CONTEST.guideUrl, 'url', false, 'https://notion.so/xxxx'),
      t(CONTEST.result, 'rich_text', false, '수상작은 공지사항에서 확인할 수 있어요.'),
      pub,
    ],
  },
  {
    key: 'partners',
    label: '제휴',
    env: 'NOTION_DB_PARTNERS',
    props: [
      t(PARTNER.name, 'title', true, 'OO식당'),
      t(PARTNER.slug, 'rich_text', true, 'oo-restaurant', '영문 소문자·숫자·하이픈만'),
      t(PARTNER.cat, 'select', true, '식당', '식당/카페/생활 등 필터에 쓰임', PARTNER_CATEGORIES),
      t(PARTNER.benefit, 'rich_text', true, '학생증 제시 시 10% 할인'),
      t(PARTNER.place, 'rich_text', true, '정문 앞'),
      t(PARTNER.hours, 'rich_text', false, '11:00 ~ 21:00'),
      t(PARTNER.period, 'rich_text', false, '2026.03.01 ~ 2027.02.28'),
      t(PARTNER.address, 'rich_text', false, '서울 광진구 …'),
      t(PARTNER.details, 'rich_text', false, '전 메뉴 10% 할인', '한 줄에 하나'),
      t(PARTNER.condition, 'rich_text', false, '1인 1회, 다른 할인과 중복 불가'),
      t(PARTNER.mapUrl, 'url', false, 'https://naver.me/xxxx', '없으면 이름+위치로 자동 검색 링크'),
      t(PARTNER.order, 'number', false, '1', '작은 수가 먼저. 비우면 맨 뒤'),
      pub,
    ],
  },
  {
    key: 'faq',
    label: '자주 묻는 질문',
    env: 'NOTION_DB_FAQ',
    props: [
      t(FAQ.q, 'title', true, '페이백은 언제 지급되나요?'),
      t(FAQ.a, 'rich_text', true, '신청 기간 종료 후 지급일에 일괄 지급됩니다.'),
      t(FAQ.order, 'number', false, '1', '작은 수가 먼저. 비우면 맨 뒤'),
      pub,
    ],
  },
  {
    key: 'docs',
    label: '자료실',
    env: 'NOTION_DB_DOCS',
    props: [
      t(DOC.title, 'title', true, '10월 정기 회의록'),
      t(DOC.slug, 'rich_text', true, 'm-2026-10', '영문 소문자·숫자·하이픈만. 같은 분류 안에서 겹치면 안 됩니다'),
      t(DOC.category, 'select', true, '회의록', Object.keys(DOC_CATEGORY_LABELS).join(' / '), Object.keys(DOC_CATEGORY_LABELS)),
      t(DOC.date, 'date', true, '2026-10-08'),
      t(DOC.by, 'rich_text', false, '사무부'),
      t(DOC.summary, 'rich_text', false, '안건 1: 학술제 일정 확정', '한 줄에 하나'),
      t(DOC.file, 'url', false, 'https://drive.google.com/file/d/…/view', '구글 드라이브 공유 링크(PDF)'),
      pub,
    ],
  },
  {
    key: 'banners',
    label: '메인 배너',
    env: 'NOTION_DB_BANNERS',
    props: [
      t(BANNER.slogan, 'title', true, '인공지능융합대학 학생회, 인트가 함께합니다.'),
      t(BANNER.href, 'rich_text', true, '/about', '사이트 안 경로(/…) 또는 https:// 주소'),
      t(BANNER.word, 'rich_text', false, 'INT', '이미지가 없을 때 크게 보이는 글자'),
      t(BANNER.placeLabel, 'rich_text', false, 'PLACE'),
      t(BANNER.place, 'rich_text', false, '세종대학교 OO관 OOO호'),
      t(BANNER.links, 'rich_text', false, 'Instagram | @int_sejong', '한 줄에 하나: 라벨 | 값'),
      t(BANNER.image, 'files', false, '(파일 업로드)', '첫 번째 파일 사용. 없으면 글자 배너'),
      t(BANNER.imageMobile, 'files', false, '(파일 업로드)', '모바일용 세로 이미지'),
      t(BANNER.order, 'number', false, '1', '작은 수가 먼저. 비우면 맨 뒤'),
      pub,
    ],
  },
  {
    key: 'suggest',
    label: '건의 답변',
    env: 'NOTION_DB_SUGGEST',
    props: [
      t(SUGGEST.title, 'title', true, '열람실 연장 운영 요청'),
      t(SUGGEST.answer, 'rich_text', true, '학교 측에 전달했으며 …'),
      t(SUGGEST.date, 'date', true, '2026-10-20'),
      pub,
    ],
  },
];

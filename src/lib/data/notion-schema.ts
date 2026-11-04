/**
 * 노션 DB 속성 이름 — 코드와 운영 매뉴얼(docs/brain/06-content-ops.md)이 같은 이름을 쓰도록 한 곳에 둔다.
 * 노션에서 속성 이름을 바꾸면 여기도 같이 바꿔야 한다.
 */

import { org } from '../../content/council';

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
  cards: '카드뉴스',
  instagram: '인스타그램',
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

/** 팝업 (메인 첫 화면 모달) */
export const POPUP = {
  title: '제목',
  slug: '슬러그',
  cat: '분류',
  period: '기간',
  desc: '내용',
  image: '이미지',
  href: '링크',
  cta: '버튼문구',
  order: '순서',
} as const;

/** 팝업 분류 선택값 */
export const POPUP_CATEGORIES = ['제휴', '행사', '공지', '공모전'] as const;

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

/** 아카이브 (취업 아카이브·병영 길라잡이를 DB 하나에 모으고 '분류'로 나눈다) */
export const ARCHIVE = {
  title: '제목',
  slug: '슬러그',
  category: '분류',
  topic: '주제',
  date: '날짜',
  summary: '요약',
  files: '첨부',
  link: '링크',
  pinned: '고정',
} as const;

/** 분류 선택값 -> 코드 */
export const ARCHIVE_CATEGORY_LABELS = { 취업: 'career', 병영: 'military' } as const;

/** 분류별 주제 선택지 (노션에서 자유롭게 더 추가할 수 있다) */
export const ARCHIVE_TOPICS = {
  career: ['채용공고', '취업후기', '자격증', '대외활동', '특강'],
  military: ['입대준비', '복무', '전역', '병역특례', '예비군'],
} as const;

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

/** 사이트 설정 (항목 이름이 정해져 있고, 항목마다 값·링크·파일 중 하나를 쓴다) */
export const SETTING = {
  key: '항목',
  value: '값',
  link: '링크',
  file: '파일',
} as const;

export type SettingKind = 'text' | 'lines' | 'link' | 'file';

/** 정해진 설정 항목. `label` 이 노션 `항목` 칸의 글자(정확히 같아야 함)이고 `kind` 가 채울 칸을 정한다 */
export const SETTING_KEYS = [
  { id: 'kakao', label: '카카오톡 채널', kind: 'link', note: '푸터·문의 버튼·플로팅 버튼' },
  { id: 'instagram', label: '인스타그램 주소', kind: 'link', note: '푸터 인스타그램 링크' },
  { id: 'instagramId', label: '인스타그램 아이디', kind: 'text', note: '푸터에 보이는 글자(예: @int_sejong)' },
  { id: 'email', label: '이메일', kind: 'text', note: '푸터 문의 칸. 비우면 표시 안 함' },
  { id: 'address', label: '학생회실 주소', kind: 'text', note: '푸터 주소' },
  { id: 'suggestForm', label: '건의함 폼', kind: 'link', note: '건의함 구글폼' },
  { id: 'paybackForm', label: '페이백 신청 폼', kind: 'link', note: '검정비 페이백 신청 구글폼' },
  { id: 'notionMilitaryGuide', label: '병역 길라잡이', kind: 'link', note: '병영 길라잡이 목록 위 링크 카드(노션)', aliases: ['군입대 백서'] },
  { id: 'notionInterview', label: '인융 인터뷰 아카이브', kind: 'link', note: '취업 아카이브 목록 위 링크 카드(노션)·메인 바로가기', aliases: ['공모전 정보'] },
  { id: 'gcalSubscribe', label: '구글 캘린더 구독', kind: 'link', note: '캘린더 구독 버튼' },
  { id: 'greeting', label: '인사말', kind: 'lines', note: '학생회 소개 인사말. 여러 문단 가능(줄을 바꿀 때마다 새 문단)' },
  { id: 'signer', label: '인사말 서명', kind: 'text', note: '인사말 아래 서명(예: 학생회장 OOO)' },
  { id: 'photo', label: '단체 사진', kind: 'file', note: '학생회 소개 단체 사진(첫 번째 파일)' },
] as const satisfies readonly { id: string; label: string; kind: SettingKind; note: string; aliases?: readonly string[] }[];

export type SettingId = (typeof SETTING_KEYS)[number]['id'];

type SettingDef = { id: SettingId; label: string; kind: SettingKind; note: string; aliases?: readonly string[] };

/** 노션 `항목` 칸의 글자로 설정 항목을 찾는다. 옛 이름(별칭)도 인식하며 `legacy` 로 알려 준다 */
export function findSettingKey(label: string): { def: SettingDef; legacy: boolean } | null {
  for (const def of SETTING_KEYS as readonly SettingDef[]) {
    if (def.label === label) return { def, legacy: false };
    if (def.aliases?.includes(label)) return { def, legacy: true };
  }
  return null;
}

/** 마지막 글자의 받침에 맞는 조사 "로/으로" 를 돌려준다 (받침 없음·ㄹ받침 → 로). 한글이 아니면 "(으)로" */
export function withRo(word: string): string {
  const code = word.trim().slice(-1).charCodeAt(0);
  if (!(code >= 0xac00 && code <= 0xd7a3)) return '(으)로';
  const jong = (code - 0xac00) % 28;
  return jong === 0 || jong === 8 ? '로' : '으로';
}

/** 옛 이름 행을 발견했을 때 비개발자도 따라 할 수 있는 안내 문구 */
export function legacySettingMessage(oldLabel: string, newLabel: string): string {
  return `노션 '사이트 설정'의 '${oldLabel}' 행 이름을 '${newLabel}'${withRo(newLabel)} 바꿔 주세요 (지금은 옛 이름도 그대로 인식됩니다)`;
}

/** 부서 (집행부 명단의 묶음) */
export const UNIT = {
  name: '이름',
  desc: '설명',
  order: '순서',
} as const;

/** 집행부 명단 */
export const COUNCIL = {
  name: '이름',
  major: '학과',
  unit: '부서',
  role: '직책',
  lead: '부장',
  order: '순서',
} as const;

/** 부서 DB 에 없는 부서의 사람을 모으는 그룹 이름 */
export const UNIT_FALLBACK = '기타';

/** 건의 답변 */
export const SUGGEST = {
  title: '제목',
  answer: '답변',
  date: '날짜',
} as const;

export const NOTICE_TYPES = ['일반', '행사', '카드뉴스'] as const;

/**
 * DB 환경변수 이름별 노션 조회 인자(정렬). 데이터 로더와 이미지 프록시가 같은 값을 써야
 * 요청 본문이 같아져 Next 데이터 캐시를 공유한다. 여기에 없는 DB 는 `DEFAULT_SORTS`(먼저 만든 행 먼저)로 조회해,
 * 슬러그가 중복일 때 어느 행이 쓰일지가 실행마다 바뀌지 않게 한다.
 */
export type NotionSort =
  | { property: string; direction: 'ascending' | 'descending' }
  | { timestamp: 'created_time' | 'last_edited_time'; direction: 'ascending' | 'descending' };

export const DEFAULT_SORTS: NotionSort[] = [{ timestamp: 'created_time', direction: 'ascending' }];

export const DB_QUERY: Record<string, { sorts: NotionSort[] }> = {
  NOTION_DB_NOTICES: { sorts: [{ property: NOTICE.date, direction: 'descending' }] },
  NOTION_DB_SUGGEST: { sorts: [{ property: SUGGEST.date, direction: 'descending' }] },
};

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
      t(NOTICE.type, 'select', true, '행사', '일반·행사·카드뉴스 중 하나', [...NOTICE_TYPES]),
      t(NOTICE.date, 'date', true, '2026-10-26', '게시일'),
      t(NOTICE.event, 'date', false, '2026-11-03 → 2026-11-14', '캘린더에도 표시할 때만. 하루면 시작일만'),
      t(NOTICE.cards, 'files', false, '(이미지 여러 장 업로드)', '카드뉴스 이미지를 인스타그램 업로드 순서대로, 최대 20장. 없으면 일반 공지'),
      t(NOTICE.instagram, 'url', false, 'https://www.instagram.com/p/xxxx', '인스타그램 원본 게시물 링크(instagram.com 주소만 허용)'),
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
    key: 'archive',
    label: '아카이브',
    env: 'NOTION_DB_ARCHIVE',
    bodyNote: '본문은 노션 페이지를 열어 그 안에 적습니다 (문단·제목·글머리·번호 목록·인용·콜아웃·구분선·체크리스트, 외부 주소 이미지).',
    props: [
      t(ARCHIVE.title, 'title', true, '자격증 준비 로드맵 (예시)'),
      t(ARCHIVE.slug, 'rich_text', true, 'cert-roadmap', '영문 소문자·숫자·하이픈만. 같은 분류 안에서 겹치면 안 됩니다. 주소는 /archive/<분류>/<슬러그>'),
      t(ARCHIVE.category, 'select', true, '취업', Object.keys(ARCHIVE_CATEGORY_LABELS).join(' / '), Object.keys(ARCHIVE_CATEGORY_LABELS)),
      t(
        ARCHIVE.topic,
        'select',
        false,
        '자격증',
        '취업: 채용공고·취업후기·자격증·대외활동·특강 / 병영: 입대준비·복무·전역·병역특례·예비군 (새 주제를 만들어도 됩니다)',
        [...ARCHIVE_TOPICS.career, ...ARCHIVE_TOPICS.military],
      ),
      t(ARCHIVE.date, 'date', true, '2026-10-20', '게시일'),
      t(ARCHIVE.summary, 'rich_text', false, '준비 순서를 한눈에 정리했어요.', '목록에 보이는 1~2줄'),
      t(ARCHIVE.files, 'files', false, '(PDF·이미지 여러 개 업로드)', '최대 20개. 상세 페이지에서 내려받기'),
      t(ARCHIVE.link, 'url', false, 'https://www.mma.go.kr/', '외부 원문(채용공고, 병무청 등) 링크'),
      t(ARCHIVE.pinned, 'checkbox', false, '체크', '목록 맨 위에 고정'),
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
    key: 'popups',
    label: '팝업',
    env: 'NOTION_DB_POPUPS',
    props: [
      t(POPUP.title, 'title', true, '○○카페 제휴 오픈'),
      t(POPUP.slug, 'rich_text', true, 'p-cafe-open', '영문 소문자·숫자·하이픈만. "보지 않기" 저장 키라 겹치면 안 됩니다'),
      t(POPUP.cat, 'select', true, '제휴', POPUP_CATEGORIES.join(' / '), [...POPUP_CATEGORIES]),
      t(POPUP.period, 'date', true, '2026-11-01 → 2026-11-14', '시작일 → 종료일(한국 시간). 이 기간에만 메인에 뜹니다'),
      t(POPUP.desc, 'rich_text', false, '학생증 제시 시 전 메뉴 10% 할인', '2~3줄 요약'),
      t(POPUP.image, 'files', false, '(파일 업로드)', '포스터 1장(첫 번째 파일). 없으면 자리 표시'),
      t(POPUP.href, 'url', false, '/partners/oo-restaurant', '"자세히 보기" 대상. 사이트 안 경로(/…) 또는 https:// 주소. 없으면 버튼 없음'),
      t(POPUP.cta, 'rich_text', false, '자세히 보기', '버튼 글자. 비우면 "자세히 보기"'),
      t(POPUP.order, 'number', false, '1', '작은 수가 먼저. 비우면 맨 뒤'),
      pub,
    ],
  },
  {
    key: 'settings',
    label: '사이트 설정',
    env: 'NOTION_DB_SETTINGS',
    bodyNote: '`항목`은 아래 정해진 이름 중 하나여야 합니다(모르는 이름은 무시). 행이 없거나 값이 비어 있으면 그 항목만 기본값을 씁니다.',
    props: [
      t(SETTING.key, 'title', true, '카카오톡 채널', '정해진 이름 중 하나(아래 항목 표)'),
      t(SETTING.value, 'rich_text', false, '@int_sejong', '글자 값 항목(인스타그램 아이디·이메일·학생회실 주소·인사말·인사말 서명). 인사말은 줄마다 한 문단입니다'),
      t(SETTING.link, 'url', false, 'https://pf.kakao.com/_xxxx', '링크 항목(카카오톡 채널·인스타그램 주소·폼·백서 등). https:// 또는 / 로 시작하는 주소만 허용'),
      t(SETTING.file, 'files', false, '(파일 업로드)', '이미지 항목(단체 사진). 첫 번째 파일 사용'),
      pub,
    ],
  },
  {
    key: 'units',
    label: '부서',
    env: 'NOTION_DB_UNITS',
    props: [
      t(UNIT.name, 'title', true, '홍보부', '집행부 DB 의 `부서` 선택값과 같은 이름'),
      t(UNIT.desc, 'rich_text', false, 'SNS·웹사이트 운영, 디자인'),
      t(UNIT.order, 'number', false, '1', '작은 수가 먼저. 비우면 맨 뒤'),
      pub,
    ],
  },
  {
    key: 'council',
    label: '집행부',
    env: 'NOTION_DB_COUNCIL',
    props: [
      t(COUNCIL.name, 'title', true, '홍길동'),
      t(COUNCIL.major, 'rich_text', false, '컴공', '학과·전공 약칭'),
      t(
        COUNCIL.unit,
        'select',
        true,
        '홍보부',
        '부서 DB 의 이름과 같게. 부서 DB 에 없는 이름이면 "기타" 그룹에 보입니다',
        org.map((u) => u.name),
      ),
      t(COUNCIL.role, 'rich_text', false, '회장', '회장·부회장 등. 일반 부원은 비웁니다'),
      t(COUNCIL.lead, 'checkbox', false, '체크', '부장. 부서마다 한 명(여러 명이면 순서가 앞선 사람만 부장 표시)'),
      t(COUNCIL.order, 'number', false, '1', '작은 수가 먼저(부서 안 표시 순서). 비우면 맨 뒤'),
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

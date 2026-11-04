import type { Metadata } from 'next';
import type { ArchiveCategory, ContentBlock, Contest, DocCategory, FaqItem, SiteLinks } from './types';
import { absoluteUrl } from './site';

/** 공백·줄바꿈을 한 칸으로 합치고, `max` 글자(말줄임표 포함)를 넘으면 잘라 "…" 를 붙인다. */
export function summarize(text: string | null | undefined, max = 120): string {
  const flat = (text ?? '').replace(/\s+/g, ' ').trim();
  const chars = Array.from(flat); // 이모지 같은 서로게이트 쌍을 가운데서 자르지 않는다
  if (chars.length <= max) return flat;
  return `${chars.slice(0, Math.max(max - 1, 0)).join('').trimEnd()}…`;
}

/** 노션 본문 블록에서 글자만 뽑아 한 줄로 (설명 요약용). 이미지·구분선은 건너뛴다. */
export function blocksText(blocks: ContentBlock[] | undefined): string {
  return (blocks ?? [])
    .map((b) => {
      if (b.type === 'list') return b.items.join(' ');
      if (b.type === 'image' || b.type === 'divider') return '';
      return b.text;
    })
    .filter(Boolean)
    .join(' ');
}

const ORG = '세종대학교 인공지능융합대학 학생회';

/** 정적 페이지 설명 (50~120자, 서로 다르게). 테스트가 길이와 중복을 확인한다. */
export const PAGE_DESCRIPTIONS = {
  home: `${ORG} 인트의 공식 웹사이트입니다. 공지사항, 학사·행사 일정, 공모전, 검정비 페이백과 제휴 혜택을 한곳에서 확인하세요.`,
  about: `${ORG} 인트의 인사말과 조직도, 부서별 집행부 구성을 소개합니다. 학생회가 어떤 일을 하는지, 누가 함께하는지 한곳에서 확인하세요.`,
  notice: `${ORG} 인트의 공지사항과 행사·카드뉴스 소식을 모았습니다. 학생회가 전하는 최신 안내와 지난 소식을 놓치지 말고 한곳에서 확인하세요.`,
  calendar: `${ORG} 인트가 정리한 학사일정과 학생회 행사, 공모전 일정을 달력으로 한눈에 확인하고 내 캘린더에 손쉽게 구독할 수 있습니다.`,
  contest: `${ORG} 인트가 진행하는 공모전의 접수 기간, 대상, 시상 내역과 참가 방법을 안내합니다. 마감된 공모전도 목록에서 볼 수 있어요.`,
  payback: `${ORG} 인트의 검정비 페이백 제도입니다. 자격증 응시료 지원 대상과 신청 방법, 예산 집행 현황과 다음 지급일을 한눈에 안내합니다.`,
  partners: `${ORG} 인트와 제휴한 매장 목록입니다. 매장별 혜택과 이용 조건, 위치를 미리 확인하고 방문해 보세요.`,
  suggest: `${ORG} 인트에 학교생활 불편 사항과 바라는 점을 건의하세요. 접수된 건의와 학생회의 답변도 확인할 수 있습니다.`,
  faq: `${ORG} 인트에 자주 들어오는 질문과 답변을 모았습니다. 원하는 답이 없다면 학생회 카카오톡 채널로 언제든 편하게 문의해 주세요.`,
  departments: `세종대학교 인공지능융합대학에 속한 학과를 소개합니다. 학생회 인트가 학과별 교육과정과 졸업 후 진로를 한곳에 정리했어요.`,
} as const;

export const DOC_DESCRIPTIONS: Record<DocCategory, string> = {
  rules: `${ORG} 인트의 회칙을 공개합니다. 학생회 운영의 근거가 되는 규정을 학생 누구나 언제든 문서로 확인하고 내려받을 수 있습니다.`,
  minutes: `${ORG} 인트의 회의록을 공개합니다. 정기 회의에서 논의하고 결정한 내용을 날짜별 문서로 누구나 언제든 확인할 수 있습니다.`,
  plans: `${ORG} 인트의 활동계획서와 결산 문서를 공개합니다. 예산이 어떻게 계획되고 쓰였는지 누구나 투명하게 확인하고 내려받을 수 있습니다.`,
  forms: `${ORG} 인트가 사용하는 각종 서식을 모았습니다. 필요한 양식을 내려받아 학생회 업무와 신청에 활용하세요.`,
};

export const ARCHIVE_DESCRIPTIONS: Record<ArchiveCategory, string> = {
  career: `${ORG} 인트의 취업 아카이브입니다. 선배들의 취업 후기와 준비 자료를 주제별로 모아 한곳에서 편하게 확인할 수 있습니다.`,
  military: `${ORG} 인트의 병영 길라잡이입니다. 입대 전 알아둘 병역 제도와 준비 사항을 학생 눈높이에 맞춰 정리했습니다.`,
};

const DETAIL_MIN = 40;

/** 상세 페이지 설명: 본문 요약이 비면 `fallback`, 40자 미만이면 "{요약} · {fallback}" 로 이어 붙인다(최대 120자). */
export function detailDescription(text: string | null | undefined, fallback: string): string {
  const body = summarize(text);
  if (!body) return summarize(fallback);
  if (Array.from(body).length >= DETAIL_MIN) return body;
  return summarize(`${body} · ${fallback}`);
}

/** 기본 공유 이미지(`src/app/opengraph-image.tsx`). 페이지가 openGraph 를 지정하면 루트의 파일 규칙 이미지가 상속되지 않으므로 직접 넣는다. */
const DEFAULT_OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630 };

type PageMetaInput = {
  title: string | { absolute: string };
  description: string;
  /** 사이트 내부 경로(`/about`). `metadataBase` 로 절대 URL 이 된다 */
  path: string;
  image?: { url: string; width: number; height: number };
};

/** 페이지 공통 metadata: 설명·canonical·OG·트위터. 페이지가 openGraph 를 지정하면 layout 값이 통째로 대체되므로 공통 항목을 다시 채운다. */
export function pageMetadata({ title, description, path, image = DEFAULT_OG_IMAGE }: PageMetaInput): Metadata {
  const ogTitle = typeof title === 'string' ? `${title} | 인트` : title.absolute;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: '인트',
      locale: 'ko_KR',
      type: 'website',
      title: ogTitle,
      description,
      url: path,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: ogTitle, description, images: [image.url] },
  };
}

/** 검색 엔진 소유 확인 메타. 값이 있는 것만 넣고, 하나도 없으면 undefined. */
export function verificationMeta(
  google: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  naver: string | undefined = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
): Metadata['verification'] | undefined {
  const g = google?.trim();
  const n = naver?.trim();
  if (!g && !n) return undefined;
  return { ...(g ? { google: g } : {}), ...(n ? { other: { 'naver-site-verification': n } } : {}) };
}

// 줄 구분(U+2028)·문단 구분(U+2029) 문자. 소스에 직접 쓰지 않고 코드 값으로 만든다.
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

/** JSON-LD 직렬화. `<` 를 유니코드 이스케이프(백슬래시 u003c)로 바꿔 `</script>` 로 태그가 닫히는 것을 막고, 줄 구분 문자도 이스케이프한다. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replaceAll('<', '\\' + 'u003c')
    .replaceAll(LINE_SEP, '\\' + 'u2028')
    .replaceAll(PARA_SEP, '\\' + 'u2029');
}

/** 자리표시자(호스트만 있는 주소)가 아닌 실제 주소만 돌려준다. 아니면 null */
export function realUrl(raw: string | undefined): string | null {
  try {
    const u = new URL((raw ?? '').trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.pathname.replace(/\/+$/, '') ? u.href : null;
  } catch {
    return null;
  }
}

const ORG_NAME = '인트';

export function organizationJsonLd(links: Pick<SiteLinks, 'instagram' | 'kakao'>, base?: string) {
  const sameAs = [links.instagram, links.kakao].map(realUrl).filter((u): u is string => u !== null);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG_NAME,
    alternateName: ORG,
    url: absoluteUrl('/', base),
    logo: absoluteUrl('/brand/logo.svg', base),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd(base?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ORG_NAME,
    url: absoluteUrl('/', base),
    inLanguage: 'ko-KR',
  };
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** 공모전 -> schema.org Event. 접수 링크가 있으면 온라인, 없으면 학교를 장소로 쓴다. */
export function contestJsonLd(c: Contest, base?: string) {
  const online = realUrl(c.applyUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: c.title,
    description: summarize(c.desc),
    startDate: c.start,
    endDate: c.end,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location: online
      ? { '@type': 'VirtualLocation', url: online }
      : {
          '@type': 'Place',
          name: '세종대학교',
          address: { '@type': 'PostalAddress', streetAddress: '능동로 209', addressLocality: '광진구', addressRegion: '서울특별시', addressCountry: 'KR' },
        },
    organizer: { '@type': 'Organization', name: ORG_NAME, alternateName: ORG, url: absoluteUrl('/', base) },
    url: absoluteUrl(`/contest/${c.id}`, base),
  };
}

import type { SiteLinks } from './types';

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface NavGroup {
  key: string;
  label: string;
  /** 하위 메뉴가 없으면 상위 메뉴 자체의 링크 */
  href?: string;
  items: NavItem[];
}

/** 외부 링크(군입대 백서)는 사이트 링크 설정에서 가져온다. */
export function buildNav(links: Pick<SiteLinks, 'notionMilitary'>): NavGroup[] {
  return [
    {
      key: 'intro',
      label: '소개',
      items: [
        { label: '학생회 소개', href: '/about' },
        { label: '소속 학과', href: '/departments' },
      ],
    },
    {
      key: 'news',
      label: '소식',
      items: [
        { label: '공지사항', href: '/notice' },
        { label: '캘린더', href: '/calendar' },
        { label: '공모전', href: '/contest' },
      ],
    },
    {
      key: 'welfare',
      label: '복지',
      items: [
        { label: '검정비 페이백', href: '/payback' },
        { label: '제휴', href: '/partners' },
        { label: '군입대 백서', href: links.notionMilitary, external: true },
        { label: '건의함', href: '/suggest' },
      ],
    },
    {
      key: 'docs',
      label: '자료실',
      items: [
        { label: '회칙', href: '/docs/rules' },
        { label: '회의록', href: '/docs/minutes' },
        { label: '활동계획서·결산', href: '/docs/plans' },
        { label: '서식', href: '/docs/forms' },
      ],
    },
    { key: 'faq', label: 'FAQ', href: '/faq', items: [] },
  ];
}

export const ROUTE_GROUP: Record<string, string> = {
  about: 'intro',
  departments: 'intro',
  notice: 'news',
  calendar: 'news',
  contest: 'news',
  payback: 'welfare',
  partners: 'welfare',
  suggest: 'welfare',
  docs: 'docs',
  faq: 'faq',
};

/** `/notice/3` -> 'news', 알 수 없는 경로/홈 -> null */
export function groupForPath(pathname: string): string | null {
  const first = pathname.split('/').filter(Boolean)[0];
  return first ? (ROUTE_GROUP[first] ?? null) : null;
}

/** 상위 메뉴 클릭 시 이동할 링크 (하위가 있으면 첫 항목) */
export function topHref(g: NavGroup): string {
  return g.href ?? g.items[0].href;
}

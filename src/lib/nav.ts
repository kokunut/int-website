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

export function buildNav(): NavGroup[] {
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
    {
      key: 'archive',
      label: '아카이브',
      items: [
        { label: '취업 아카이브', href: '/archive/career' },
        { label: '병영 길라잡이', href: '/archive/military' },
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
  archive: 'archive',
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

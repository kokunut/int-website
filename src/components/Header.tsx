'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { groupForPath, topHref, type NavGroup } from '@/lib/nav';

const isCurrent = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(href + '/');

export default function Header({ nav }: { nav: NavGroup[] }) {
  const pathname = usePathname();
  // 메뉴를 연 시점의 경로를 기억해 두면, 경로가 바뀌는 순간 자동으로 닫힌다.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const activeGroup = groupForPath(pathname);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenedAt(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className={`gnb${open ? ' open' : ''}`} id="gnb">
      <div className="container gnb-inner">
        <Link href="/" className="logo" aria-label="인트 홈">
          <span className="logo-mark">int</span>
          <span className="logo-sub">인공지능융합대학 학생회</span>
        </Link>
        <nav id="gnb-nav" aria-label="주 메뉴" onClick={() => setOpenedAt(null)}>
          <ul className="menu" id="menu">
            {nav.map((g) => (
              <li key={g.key}>
                <Link
                  className={`menu-top${activeGroup === g.key ? ' active' : ''}`}
                  data-key={g.key}
                  href={topHref(g)}
                  aria-current={g.items.length === 0 && isCurrent(pathname, topHref(g)) ? 'page' : undefined}
                >
                  {g.label}
                </Link>
                {g.items.length > 0 && (
                  <ul className="sub">
                    {g.items.map((it) => (
                      <li key={it.href}>
                        {it.external ? (
                          <a className="ext" href={it.href} target="_blank" rel="noopener noreferrer">
                            {it.label}
                          </a>
                        ) : (
                          <Link href={it.href} aria-current={isCurrent(pathname, it.href) ? 'page' : undefined}>
                            {it.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="burger"
          id="burger"
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          aria-controls="gnb-nav"
          aria-expanded={open}
          onClick={() => setOpenedAt(open ? null : pathname)}
        >
          <span></span>
        </button>
      </div>
    </header>
  );
}

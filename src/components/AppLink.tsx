import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  href: string;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
  title?: string;
  onClick?: () => void;
}

const isExternal = (href: string): boolean => /^https?:\/\//.test(href);
/** 비어 있거나 '#' 인 링크는 아직 준비되지 않은 자리표시자 */
export const isPlaceholderHref = (href: string | undefined): boolean => !href || href === '#';

/** 내부 경로는 next/link, 외부는 새 탭 앵커. 자리표시자('#')는 이동하지 않는 비활성 요소로 그린다. */
export default function AppLink({ href, className, children, ...rest }: Props) {
  if (isPlaceholderHref(href)) {
    return (
      <span className={className} aria-disabled="true" {...rest}>
        {children}
      </span>
    );
  }
  if (isExternal(href)) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={href} {...rest}>
      {children}
    </Link>
  );
}

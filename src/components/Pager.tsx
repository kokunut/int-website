import Link from 'next/link';

export interface PagerItem {
  href: string;
  title: string;
}

/** 이전·다음 이동. list 는 화면에 보이는 순서. */
export default function Pager({
  prev,
  next,
  labels = ['이전', '다음'],
}: {
  prev?: PagerItem;
  next?: PagerItem;
  labels?: [string, string];
}) {
  if (!prev && !next) return null;
  return (
    <nav className="pager" aria-label="이전·다음 항목">
      {prev ? (
        <Link href={prev.href}>
          <small>← {labels[0]}</small>
          <span>{prev.title}</span>
        </Link>
      ) : (
        <span></span>
      )}
      {next ? (
        <Link className="nx" href={next.href}>
          <small>{labels[1]} →</small>
          <span>{next.title}</span>
        </Link>
      ) : (
        <span></span>
      )}
    </nav>
  );
}

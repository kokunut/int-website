import Link from 'next/link';
import { contestStatus, dday, full, md } from '@/lib/date';
import type { Contest } from '@/lib/types';

export default function ContestList({ items, emptyText = '진행 중인 공모전이 없어요' }: { items: Contest[]; emptyText?: string }) {
  if (items.length === 0) return <p className="empty">{emptyText}</p>;
  return (
    <ul className="list">
      {items.map((c) => {
        const s = contestStatus(c);
        const dd = dday(c.end);
        return (
          <li key={c.id}>
            <Link href={`/contest/${c.id}`}>
              <span className={`badge${s === '진행중' ? ' solid' : ''}`}>{s}</span>
              <span className="t">{c.title}</span>
              <span className="d">
                {s === '진행중' ? (dd === 0 ? 'D-DAY' : `D-${dd}`) : `${full(c.start)} ~ ${md(c.end)}`}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

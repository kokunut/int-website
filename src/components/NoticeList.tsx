import Link from 'next/link';
import { isCardNews } from '@/lib/cardnews';
import { md, range } from '@/lib/date';
import type { Notice } from '@/lib/types';

export default function NoticeList({ items, emptyText = '공지사항이 없어요' }: { items: Notice[]; emptyText?: string }) {
  if (items.length === 0) return <p className="empty">{emptyText}</p>;
  return (
    <ul className="list">
      {items.map((n) => (
        <li key={n.id}>
          <Link href={`/notice/${n.id}`}>
            <span className="badge">{isCardNews(n) ? '카드뉴스' : n.type}</span>
            <span className="t">{n.title}</span>
            {n.cards && n.cards.length > 0 && <span className="cards-n">{n.cards.length}장</span>}
            {n.event && (
              <span className="cal-chip">
                <i className="mk mk-event"></i>
                {range(n.event.start, n.event.end)}
              </span>
            )}
            <span className="d">{md(n.date)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

'use client';

import { useState } from 'react';
import { isCardNews } from '@/lib/cardnews';
import type { Notice } from '@/lib/types';
import NoticeList from './NoticeList';

const FILTERS = ['전체', '행사', '일반', '카드뉴스'] as const;
type Filter = (typeof FILTERS)[number];

/** 공지 목록 + 유형 탭 + 제목 검색 */
export default function NoticeBrowser({ notices }: { notices: Notice[] }) {
  const [filter, setFilter] = useState<Filter>('전체');
  const [query, setQuery] = useState('');
  const q = query.trim();
  const matches = (n: Notice) => (filter === '전체' ? true : filter === '카드뉴스' ? isCardNews(n) : n.type === filter);
  const shown = notices.filter((n) => matches(n) && n.title.includes(q));

  return (
    <>
      <div className="toolbar">
        <div className="tabs" role="group" aria-label="공지 유형">
          {FILTERS.map((t) => (
            <button key={t} type="button" className={filter === t ? 'on' : undefined} aria-pressed={filter === t} onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="제목 검색"
          aria-label="공지 제목 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <NoticeList items={shown} emptyText={notices.length === 0 ? '공지사항이 없어요' : '검색 결과가 없어요'} />
    </>
  );
}

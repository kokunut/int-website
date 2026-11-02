'use client';

import Link from 'next/link';
import { useState } from 'react';
import { filterArchive, topicsOf } from '@/lib/archive';
import { md } from '@/lib/date';
import type { ArchivePost } from '@/lib/types';

/** 아카이브 목록 + 주제 탭 + 제목 검색. 글 목록은 서버에서 고정 → 날짜 순으로 정렬해 받는다 */
export default function ArchiveBrowser({ posts, presetTopics }: { posts: ArchivePost[]; presetTopics: readonly string[] }) {
  const [topic, setTopic] = useState('');
  const [query, setQuery] = useState('');
  const tabs = topicsOf(posts, presetTopics);
  const shown = filterArchive(posts, topic, query);

  return (
    <>
      <div className="toolbar">
        <div className="tabs" role="group" aria-label="주제">
          {['', ...tabs].map((t) => (
            <button key={t || 'all'} type="button" className={topic === t ? 'on' : undefined} aria-pressed={topic === t} onClick={() => setTopic(t)}>
              {t || '전체'}
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="제목 검색"
          aria-label="제목 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {shown.length === 0 ? (
        <p className="empty">{posts.length === 0 ? '아직 올라온 글이 없어요' : '검색 결과가 없어요'}</p>
      ) : (
        <ul className="list archive-list">
          {shown.map((p) => (
            <li key={p.id}>
              <Link href={`/archive/${p.category}/${p.id}`}>
                <span className="a-badges">
                  {p.pinned && <span className="badge solid">고정</span>}
                  {p.topic && <span className="badge">{p.topic}</span>}
                </span>
                <span className="t">
                  {p.title}
                  {p.summary && <small className="sum">{p.summary}</small>}
                </span>
                <span className="a-meta">
                  {p.attachments.length > 0 && <span className="cards-n">첨부 {p.attachments.length}</span>}
                  <span className="d">{md(p.date)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

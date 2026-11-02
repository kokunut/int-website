import type { ContentBlock } from '@/lib/types';

/** body(문단 줄 배열)만 있는 글을 블록으로 바꾼다 */
export const linesToBlocks = (lines: string[]): ContentBlock[] => lines.map((text) => ({ type: 'paragraph', text }));

/** 노션 본문 블록을 구조 그대로 그린다. 공지·아카이브가 함께 쓴다 (서버 컴포넌트) */
export default function NotionBlocks({ blocks }: { blocks: ContentBlock[] }) {
  if (blocks.length === 0) return null;
  return (
    <div className="body blocks">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'paragraph':
            return <p key={i}>{b.text}</p>;
          case 'heading':
            return b.level === 2 ? <h2 key={i}>{b.text}</h2> : <h3 key={i}>{b.text}</h3>;
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul';
            return (
              <Tag key={i} className={b.ordered ? 'nb-list ol' : 'nb-list ul'}>
                {b.items.map((it, k) => (
                  <li key={k}>{it}</li>
                ))}
              </Tag>
            );
          }
          case 'quote':
            return <blockquote key={i}>{b.text}</blockquote>;
          case 'callout':
            return (
              <div key={i} className="nb-callout" role="note">
                {b.icon && <span aria-hidden="true">{b.icon}</span>}
                <p>{b.text}</p>
              </div>
            );
          case 'divider':
            return <hr key={i} />;
          case 'todo':
            return (
              <p key={i} className={`nb-todo${b.checked ? ' done' : ''}`}>
                <span aria-hidden="true">{b.checked ? '☑' : '☐'}</span>
                <span className="sr-only">{b.checked ? '완료: ' : '할 일: '}</span>
                {b.text}
              </p>
            );
          case 'image':
            return (
              <figure key={i} className="nb-image">
                {/* eslint-disable-next-line @next/next/no-img-element -- 외부 주소 이미지, 크기를 알 수 없다 */}
                <img src={b.src} alt={b.caption} loading="lazy" />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
        }
      })}
    </div>
  );
}

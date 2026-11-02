import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppLink from '@/components/AppLink';
import NotionBlocks from '@/components/NotionBlocks';
import Pager from '@/components/Pager';
import { ARCHIVE_BADGES, ARCHIVE_CATEGORIES, ARCHIVE_LABELS, isArchiveCategory } from '@/lib/archive';
import { getArchive, getArchivePost } from '@/lib/data';
import { full } from '@/lib/date';

export const revalidate = 600;
export const dynamicParams = false;

type Props = { params: Promise<{ category: string; id: string }> };

export async function generateStaticParams() {
  const lists = await Promise.all(ARCHIVE_CATEGORIES.map(async (category) => ({ category, items: await getArchive(category) })));
  return lists.flatMap(({ category, items }) => items.map((p) => ({ category, id: p.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, id } = await params;
  const post = isArchiveCategory(category) ? await getArchivePost(category, id) : undefined;
  return { title: post ? post.title : '아카이브' };
}

export default async function ArchiveDetailPage({ params }: Props) {
  const { category, id } = await params;
  if (!isArchiveCategory(category)) notFound();
  const [post, list] = await Promise.all([getArchivePost(category, id), getArchive(category)]);
  if (!post) notFound();

  const i = list.findIndex((x) => x.id === post.id);
  const toItem = (x: typeof post) => ({ href: `/archive/${category}/${x.id}`, title: x.title });

  return (
    <section className="container page">
      <div className="article">
        <Link className="more back" href={`/archive/${category}`}>
          ← {ARCHIVE_LABELS[category]} 목록
        </Link>
        <p className="mt-24">
          <span className="badge solid">{ARCHIVE_BADGES[category]}</span> {post.topic && <span className="badge">{post.topic}</span>}
        </p>
        <h1>{post.title}</h1>
        <p className="meta">{full(post.date)} 게시</p>
        {post.link && (
          <div className="btn-row">
            <AppLink className="btn ghost" href={post.link}>
              원문 보기 ↗
            </AppLink>
          </div>
        )}
        <NotionBlocks blocks={post.blocks} />
        {post.attachments.length > 0 && (
          <section className="d-sec" aria-labelledby="attach-title">
            <h2 id="attach-title">첨부 파일</h2>
            <ul className="attach-list">
              {post.attachments.map((a) => (
                <li key={a.href} className="doc-row">
                  <span className="t">{a.name}</span>
                  <a className="btn ghost" href={a.href} target="_blank" rel="noopener noreferrer">
                    열기·다운로드
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        <Pager prev={list[i - 1] && toItem(list[i - 1])} next={list[i + 1] && toItem(list[i + 1])} labels={['이전 글', '다음 글']} />
      </div>
    </section>
  );
}

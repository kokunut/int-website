import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AppLink from '@/components/AppLink';
import ArchiveBrowser from '@/components/ArchiveBrowser';
import { ARCHIVE_CATEGORIES, ARCHIVE_LABELS, isArchiveCategory } from '@/lib/archive';
import { getArchive, getSiteLinks } from '@/lib/data';
import { ARCHIVE_TOPICS } from '@/lib/data/notion-schema';

export const revalidate = 600;
export const dynamicParams = false;

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return ARCHIVE_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return { title: isArchiveCategory(category) ? ARCHIVE_LABELS[category] : '아카이브' };
}

export default async function ArchiveListPage({ params }: Props) {
  const { category } = await params;
  if (!isArchiveCategory(category)) notFound();
  const [posts, links] = await Promise.all([getArchive(category), getSiteLinks()]);

  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">아카이브</p>
        <h1>{ARCHIVE_LABELS[category]}</h1>
        <p className="page-desc">
          {category === 'career' ? '채용공고, 취업 후기, 자격증 정보를 모아 두었어요.' : '입대 준비부터 전역, 병역특례까지 필요한 정보를 모아 두었어요.'}
        </p>
      </div>
      {category === 'military' && (
        <AppLink className="qk archive-ext" href={links.notionMilitary}>
          <div>
            <small>노션 바로가기</small>
            <strong>군입대 백서(노션)</strong>
          </div>
          <span className="arr">↗</span>
        </AppLink>
      )}
      <ArchiveBrowser posts={posts} presetTopics={ARCHIVE_TOPICS[category]} />
    </section>
  );
}

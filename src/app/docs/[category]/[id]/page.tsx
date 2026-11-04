import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppLink from '@/components/AppLink';
import DetailSection from '@/components/DetailSection';
import Pager from '@/components/Pager';
import { getDoc, getDocs } from '@/lib/data';
import { full } from '@/lib/date';
import { DOC_CATEGORIES, DOC_TABS, driveDownloadUrl, drivePreviewUrl, isDocCategory } from '@/lib/docs';
import { DOC_DESCRIPTIONS, detailDescription, pageMetadata } from '@/lib/seo';
import type { DocCategory } from '@/lib/types';

export const revalidate = 600;
export const dynamicParams = false;

type Props = { params: Promise<{ category: string; id: string }> };

export async function generateStaticParams() {
  const lists = await Promise.all(DOC_CATEGORIES.map(async (category) => ({ category, items: await getDocs(category) })));
  return lists.flatMap(({ category, items }) => items.map((d) => ({ category, id: d.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, id } = await params;
  const doc = isDocCategory(category) ? await getDoc(category, id) : undefined;
  if (!doc) return { title: '자료실' };
  return pageMetadata({
    title: doc.title,
    description: detailDescription(doc.summary.join(' '), `${doc.title} - ${DOC_DESCRIPTIONS[category as DocCategory]}`),
    path: `/docs/${category}/${id}`,
  });
}

export default async function DocDetailPage({ params }: Props) {
  const { category, id } = await params;
  if (!isDocCategory(category)) notFound();
  const [doc, list] = await Promise.all([getDoc(category, id), getDocs(category)]);
  if (!doc) notFound();

  const i = list.findIndex((x) => x.id === doc.id);
  const toItem = (x: typeof doc) => ({ href: `/docs/${category}/${x.id}`, title: x.title });
  const preview = drivePreviewUrl(doc.file);
  const file = doc.file ?? '#';
  const download = driveDownloadUrl(doc.file) ?? file;

  return (
    <section className="container page">
      <div className="article">
        <Link className="more back" href={`/docs/${category}`}>
          ← {DOC_TABS[category]} 목록
        </Link>
        <p>
          <span className="badge">{DOC_TABS[category]}</span>
        </p>
        <h1>{doc.title}</h1>
        <p className="meta">
          {full(doc.date)} · {doc.by}
        </p>
        <div className="doc-actions">
          <AppLink className="btn" href={download}>
            PDF 다운로드
          </AppLink>
          <AppLink className="btn ghost" href={file}>
            새 창에서 열기 ↗
          </AppLink>
        </div>
        {doc.summary.length > 0 && (
          <DetailSection title={category === 'minutes' ? '주요 안건' : '요약'}>
            <ul className="bullets">
              {doc.summary.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </DetailSection>
        )}
        {preview ? (
          <iframe className="doc-viewer-frame" src={preview} title={`${doc.title} 미리보기`} loading="lazy" referrerPolicy="no-referrer" allow="autoplay" />
        ) : (
          <div className="placeholder doc-viewer">
            PDF 미리보기 자리
            <br />
            <small>구글 드라이브 /preview 링크를 iframe으로 임베드</small>
          </div>
        )}
        <Pager prev={list[i - 1] && toItem(list[i - 1])} next={list[i + 1] && toItem(list[i + 1])} labels={['최신', '이전']} />
      </div>
    </section>
  );
}

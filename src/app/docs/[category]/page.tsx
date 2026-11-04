import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDocs } from '@/lib/data';
import { full } from '@/lib/date';
import { DOC_CATEGORIES, DOC_TABS, isDocCategory } from '@/lib/docs';
import { DOC_DESCRIPTIONS, pageMetadata } from '@/lib/seo';

export const revalidate = 600;
export const dynamicParams = false;

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return DOC_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isDocCategory(category)) return { title: '자료실' };
  return pageMetadata({ title: `자료실 · ${DOC_TABS[category]}`, description: DOC_DESCRIPTIONS[category], path: `/docs/${category}` });
}

export default async function DocsCategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isDocCategory(category)) notFound();
  const items = await getDocs(category);

  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">자료실</p>
        <h1>{DOC_TABS[category]}</h1>
      </div>
      <nav className="tabs" aria-label="자료실 분류">
        {DOC_CATEGORIES.map((k) => (
          <Link key={k} href={`/docs/${k}`} className={k === category ? 'on' : undefined} aria-current={k === category ? 'page' : undefined}>
            {DOC_TABS[k]}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? (
        <p className="note">등록된 자료가 없어요</p>
      ) : (
        <div className="list">
          {items.map((d) => (
            <div key={d.id} className="doc-row">
              <span className="badge">PDF</span>
              <Link className="t" href={`/docs/${category}/${d.id}`}>
                {d.title}
              </Link>
              <span className="note">{full(d.date)}</span>
              <Link className="btn ghost" href={`/docs/${category}/${d.id}`} aria-label={`${d.title} 보기`}>
                보기
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

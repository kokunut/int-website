import type { Metadata } from 'next';
import AppLink from '@/components/AppLink';
import JsonLd from '@/components/JsonLd';
import { getFaq, getFaqPage, getSiteLinks } from '@/lib/data';
import { PAGE_DESCRIPTIONS, faqJsonLd, pageMetadata } from '@/lib/seo';

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({ title: 'FAQ', description: PAGE_DESCRIPTIONS.faq, path: '/faq' });

export default async function FaqPage() {
  const [faq, page, links] = await Promise.all([getFaq(), getFaqPage(), getSiteLinks()]);
  return (
    <section className="container page">
      {faq.length > 0 && <JsonLd data={faqJsonLd(faq)} />}
      <div className="page-head">
        <p className="crumb">FAQ</p>
        <h1>자주 묻는 질문</h1>
      </div>
      <div className="faq faq-top">
        {faq.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <div className="a">{f.a}</div>
          </details>
        ))}
      </div>
      <div className="card box cta-card mt-32">
        <div>
          <h2>{page.contactTitle}</h2>
          <p>{page.contactDesc}</p>
        </div>
        <AppLink className="btn" href={links.kakao}>
          카카오톡 문의 ↗
        </AppLink>
      </div>
    </section>
  );
}

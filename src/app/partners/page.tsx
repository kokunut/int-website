import type { Metadata } from 'next';
import PartnerBrowser from '@/components/PartnerBrowser';
import { getPartners, getPartnersPage } from '@/lib/data';
import { PAGE_DESCRIPTIONS, pageMetadata } from '@/lib/seo';

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({ title: '제휴', description: PAGE_DESCRIPTIONS.partners, path: '/partners' });

export default async function PartnersPage() {
  const [partners, page] = await Promise.all([getPartners(), getPartnersPage()]);
  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">복지</p>
        <h1>제휴</h1>
        <p className="page-desc">{page.desc}</p>
      </div>
      <PartnerBrowser partners={partners} />
      <p className="note mt-24">{page.footnote}</p>
    </section>
  );
}

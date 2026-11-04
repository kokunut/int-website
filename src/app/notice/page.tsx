import type { Metadata } from 'next';
import NoticeBrowser from '@/components/NoticeBrowser';
import { getNotices } from '@/lib/data';
import { PAGE_DESCRIPTIONS, pageMetadata } from '@/lib/seo';

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({ title: '공지사항', description: PAGE_DESCRIPTIONS.notice, path: '/notice' });

export default async function NoticePage() {
  const notices = await getNotices();
  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">소식</p>
        <h1>공지사항</h1>
      </div>
      <NoticeBrowser notices={notices} />
    </section>
  );
}

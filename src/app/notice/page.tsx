import type { Metadata } from 'next';
import NoticeBrowser from '@/components/NoticeBrowser';
import { getNotices } from '@/lib/data';

export const revalidate = 600;

export const metadata: Metadata = { title: '공지사항' };

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

import type { MetadataRoute } from 'next';
import { ARCHIVE_CATEGORIES } from '@/lib/archive';
import { getArchive, getContests, getDepartments, getNotices, getPartners, getDocs } from '@/lib/data';
import { DOC_CATEGORIES } from '@/lib/docs';
import { sitemapEntry } from '@/lib/sitemap-entries';

export const revalidate = 600;

const STATIC_PATHS = ['/', '/about', '/departments', '/notice', '/calendar', '/contest', '/payback', '/partners', '/suggest', '/faq'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [notices, contests, departments, partners, docLists, archiveLists] = await Promise.all([
    getNotices(),
    getContests(),
    getDepartments(),
    getPartners(),
    Promise.all(DOC_CATEGORIES.map(async (category) => ({ category, items: await getDocs(category) }))),
    Promise.all(ARCHIVE_CATEGORIES.map(async (category) => ({ category, items: await getArchive(category) }))),
  ]);

  // 날짜 필드가 있는 항목에만 lastModified 를 넣는다 (정적 페이지·목록·학과·제휴는 생략)
  return [
    ...STATIC_PATHS.map((p) => sitemapEntry(p)),
    ...DOC_CATEGORIES.map((c) => sitemapEntry(`/docs/${c}`)),
    ...ARCHIVE_CATEGORIES.map((c) => sitemapEntry(`/archive/${c}`)),
    ...archiveLists.flatMap(({ category, items }) => items.map((p) => sitemapEntry(`/archive/${category}/${p.id}`, p.date))),
    ...notices.map((n) => sitemapEntry(`/notice/${n.id}`, n.date)),
    ...contests.map((c) => sitemapEntry(`/contest/${c.id}`, c.start)),
    ...departments.map((d) => sitemapEntry(`/departments/${d.id}`)),
    ...partners.map((p) => sitemapEntry(`/partners/${p.id}`)),
    ...docLists.flatMap(({ category, items }) => items.map((d) => sitemapEntry(`/docs/${category}/${d.id}`, d.date))),
  ];
}

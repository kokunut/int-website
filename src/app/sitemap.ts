import type { MetadataRoute } from 'next';
import { getContests, getDepartments, getNotices, getPartners, getDocs } from '@/lib/data';
import { DOC_CATEGORIES } from '@/lib/docs';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 600;

const STATIC_PATHS = ['/', '/about', '/departments', '/notice', '/calendar', '/contest', '/payback', '/partners', '/suggest', '/faq'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [notices, contests, departments, partners, docLists] = await Promise.all([
    getNotices(),
    getContests(),
    getDepartments(),
    getPartners(),
    Promise.all(DOC_CATEGORIES.map(async (category) => ({ category, items: await getDocs(category) }))),
  ]);

  const paths = [
    ...STATIC_PATHS,
    ...DOC_CATEGORIES.map((c) => `/docs/${c}`),
    ...notices.map((n) => `/notice/${n.id}`),
    ...contests.map((c) => `/contest/${c.id}`),
    ...departments.map((d) => `/departments/${d.id}`),
    ...partners.map((p) => `/partners/${p.id}`),
    ...docLists.flatMap(({ category, items }) => items.map((d) => `/docs/${category}/${d.id}`)),
  ];
  return paths.map((p) => ({ url: absoluteUrl(p) }));
}

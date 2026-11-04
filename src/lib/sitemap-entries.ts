import type { MetadataRoute } from 'next';
import { absoluteUrl } from './site';
import type { DateString } from './types';

type SitemapEntry = MetadataRoute.Sitemap[number];

/** `YYYY-MM-DD` 이면서 실제로 있는 날짜일 때만 그대로 돌려준다. 아니면 undefined */
export function validLastModified(date: DateString | undefined | null): string | undefined {
  if (typeof date !== 'string') return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  const real = t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
  return real ? date : undefined;
}

/** 경로와 (있다면) 날짜로 사이트맵 항목을 만든다. 날짜가 없거나 잘못되면 lastModified 를 생략한다 */
export function sitemapEntry(path: string, date?: DateString | null): SitemapEntry {
  const lastModified = validLastModified(date);
  return lastModified ? { url: absoluteUrl(path), lastModified } : { url: absoluteUrl(path) };
}

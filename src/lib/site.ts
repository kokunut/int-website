const DEFAULT_SITE_URL = 'https://int-website.vercel.app';

/** 사이트 기준 URL (끝 슬래시 없음). NEXT_PUBLIC_SITE_URL 이 없거나 잘못되면 기본값. */
export function getSiteUrl(raw: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  const v = raw?.trim();
  if (!v) return DEFAULT_SITE_URL;
  try {
    const u = new URL(v);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return DEFAULT_SITE_URL;
    return u.origin + u.pathname.replace(/\/+$/, '');
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** 경로를 절대 URL 로 (`/` -> 기준 URL + '/') */
export function absoluteUrl(path: string, base: string = getSiteUrl()): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

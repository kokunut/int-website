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

/** Vercel 운영(Production) 배포 여부. 로컬·CI 는 `/_vercel/insights/*` 가 404 이고 미리보기 배포는 통계가 섞이므로, 운영에서만 통계를 켠다. */
export function isVercelProduction(raw: string | undefined = process.env.VERCEL_ENV): boolean {
  return raw === 'production';
}

/** 경로를 절대 URL 로 (`/` -> 기준 URL + '/') */
export function absoluteUrl(path: string, base: string = getSiteUrl()): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

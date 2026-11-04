import type { MetadataRoute } from 'next';
import { absoluteUrl, isPreviewDeploy } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeploy()) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}

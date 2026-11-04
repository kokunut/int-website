import { describe, expect, it } from 'vitest';
import { absoluteUrl, getSiteUrl, isPreviewDeploy, isVercelProduction } from '../site';

describe('isPreviewDeploy', () => {
  it('is true only when VERCEL_ENV is set and not production', () => {
    for (const v of ['preview', 'development']) expect(isPreviewDeploy(v)).toBe(true);
    for (const v of [undefined, '', 'production']) expect(isPreviewDeploy(v)).toBe(false);
  });
});

describe('isVercelProduction', () => {
  it('is true only for VERCEL_ENV=production', () => {
    expect(isVercelProduction('production')).toBe(true);
    for (const v of [undefined, '', '1', 'preview', 'development']) expect(isVercelProduction(v)).toBe(false);
  });
});

describe('getSiteUrl', () => {
  it('falls back when unset, blank or invalid', () => {
    for (const v of [undefined, '', '  ', 'nope', 'javascript:alert(1)']) {
      expect(getSiteUrl(v)).toBe('https://int-website.vercel.app');
    }
  });
  it('strips trailing slashes', () => {
    expect(getSiteUrl('https://example.com/')).toBe('https://example.com');
    expect(getSiteUrl(' https://example.com/base// ')).toBe('https://example.com/base');
  });
});

describe('absoluteUrl', () => {
  it('joins base and path', () => {
    expect(absoluteUrl('/about', 'https://a.com')).toBe('https://a.com/about');
    expect(absoluteUrl('about', 'https://a.com')).toBe('https://a.com/about');
    expect(absoluteUrl('/', 'https://a.com')).toBe('https://a.com/');
  });
});

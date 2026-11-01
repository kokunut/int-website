import { describe, expect, it } from 'vitest';
import { absoluteUrl, getSiteUrl, isVercel } from '../site';

describe('isVercel', () => {
  it('is true only for VERCEL=1', () => {
    expect(isVercel('1')).toBe(true);
    for (const v of [undefined, '', '0', 'true']) expect(isVercel(v)).toBe(false);
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

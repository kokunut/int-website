import { describe, expect, it } from 'vitest';
import { cleanUrlText, isInternalPath } from '../url';

describe('cleanUrlText', () => {
  it('앞뒤 공백과 탭·개행을 지운다', () => {
    expect(cleanUrlText('  /a\tb\nc\r ')).toBe('/abc');
    expect(cleanUrlText(null)).toBe('');
    expect(cleanUrlText(undefined)).toBe('');
  });
});

describe('isInternalPath', () => {
  it('/ 한 개로 시작하는 경로만 내부 경로', () => {
    expect(isInternalPath('/notice/1')).toBe(true);
    expect(isInternalPath('/')).toBe(true);
    expect(isInternalPath('//evil.example')).toBe(false);
    expect(isInternalPath('/\\evil.example')).toBe(false);
    expect(isInternalPath('https://a.b')).toBe(false);
    expect(isInternalPath('')).toBe(false);
  });
});

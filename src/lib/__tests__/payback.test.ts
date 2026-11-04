import { describe, expect, it } from 'vitest';
import { paybackState } from '../payback';

describe('paybackState', () => {
  it('80 미만은 보통', () => {
    expect(paybackState(0)).toBe('normal');
    expect(paybackState(62)).toBe('normal');
    expect(paybackState(79.9)).toBe('normal');
  });
  it('80 이상 95 미만은 경고', () => {
    expect(paybackState(80)).toBe('warning');
    expect(paybackState(94.9)).toBe('warning');
  });
  it('95 이상은 위급', () => {
    expect(paybackState(95)).toBe('critical');
    expect(paybackState(100)).toBe('critical');
  });
});

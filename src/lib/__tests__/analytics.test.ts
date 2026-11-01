import { beforeEach, describe, expect, it, vi } from 'vitest';

const track = vi.hoisted(() => vi.fn());
vi.mock('@vercel/analytics', () => ({ track }));

import { EVENTS, trackEvent } from '../analytics';

describe('trackEvent', () => {
  beforeEach(() => track.mockClear());
  it('is a no-op outside Vercel', () => {
    trackEvent(EVENTS.kakaoFab, false);
    expect(track).not.toHaveBeenCalled();
  });
  it('sends the event name on Vercel', () => {
    trackEvent(EVENTS.paybackApply, true);
    expect(track).toHaveBeenCalledWith('payback_apply');
  });
  it('keeps stable event names', () => {
    expect(Object.values(EVENTS)).toEqual(['popup_detail', 'payback_apply', 'kakao_fab']);
  });
});

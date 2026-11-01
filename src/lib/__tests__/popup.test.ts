import { describe, expect, it } from 'vitest';
import { addDays, isSuppressed, pickPopupContest, popupStorageKey, suppressUntil } from '../popup';
import type { PopupContest } from '../popup';

const c = (id: string, start: string, end: string, popup = true): PopupContest => ({
  id,
  title: id,
  desc: '',
  start,
  end,
  popup,
});

describe('pickPopupContest', () => {
  const list = [c('off', '2026-10-01', '2026-12-01', false), c('a', '2026-10-20', '2026-11-15'), c('b', '2026-11-01', '2026-11-30')];

  it('popup:true 이면서 기간 안인 첫 공모전', () => {
    expect(pickPopupContest(list, '2026-11-01')?.id).toBe('a');
  });
  it('시작일·마감일 당일 포함', () => {
    expect(pickPopupContest(list, '2026-10-20')?.id).toBe('a');
    expect(pickPopupContest(list, '2026-11-15')?.id).toBe('a');
  });
  it('기간 밖이면 없음', () => {
    expect(pickPopupContest(list, '2026-10-19')).toBeUndefined();
    expect(pickPopupContest(list, '2026-12-01')).toBeUndefined();
  });
  it('숨김 처리된 공모전은 건너뛰고 다음 후보를 고른다', () => {
    expect(pickPopupContest(list, '2026-11-01', (x) => x.id === 'a')?.id).toBe('b');
    expect(pickPopupContest(list, '2026-11-01', () => true)).toBeUndefined();
  });
  it('popup:false 는 제외', () => {
    expect(pickPopupContest([list[0]], '2026-11-01')).toBeUndefined();
  });
});

describe('suppressUntil / addDays', () => {
  it('하루 / 일주일', () => {
    expect(suppressUntil('2026-11-01', 1)).toBe('2026-11-02');
    expect(suppressUntil('2026-11-01', 7)).toBe('2026-11-08');
  });
  it('월·연 넘김', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('isSuppressed', () => {
  it('만료일 전에는 숨김, 만료일부터 다시 노출', () => {
    expect(isSuppressed('2026-11-02', '2026-11-01')).toBe(true);
    expect(isSuppressed('2026-11-02', '2026-11-02')).toBe(false);
    expect(isSuppressed('2026-11-02', '2026-11-03')).toBe(false);
  });
  it('값이 없거나 잘못되면 숨기지 않음', () => {
    expect(isSuppressed(null, '2026-11-01')).toBe(false);
    expect(isSuppressed(undefined, '2026-11-01')).toBe(false);
    expect(isSuppressed('', '2026-11-01')).toBe(false);
    expect(isSuppressed('1999999999999', '2026-11-01')).toBe(false);
  });
});

describe('popupStorageKey', () => {
  it('공모전 id 별 키', () => {
    expect(popupStorageKey('c1')).toBe('int_popup_hide_c1');
  });
});

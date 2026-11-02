import { afterEach, describe, expect, it, vi } from 'vitest';
import { addDays, popupHideScript, isSuppressed, pickPopupContest, popupStorageKey, suppressUntil } from '../popup';
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

describe('popupHideScript', () => {
  const run = (id: string, stored: string | null | 'throw', now: string) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    const doc = { documentElement: { dataset: {} as Record<string, string> } };
    const storage = {
      getItem: (k: string) => {
        if (stored === 'throw') throw new Error('denied');
        return k === `int_popup_hide_${id}` ? stored : null;
      },
    };
    const noop = () => {};
    new Function('localStorage', 'document', popupHideScript(id))(storage, { ...doc, addEventListener: noop });
    vi.useRealTimers();
    return doc.documentElement.dataset.popupHidden;
  };
  afterEach(() => vi.useRealTimers());

  it('만료일 이전(KST 기준)이면 data-popup-hidden 을 id 로 표시한다', () => {
    expect(run('c1', '2026-11-02', '2026-11-01T14:59:00Z')).toBe('c1');
  });
  it('KST 자정이 지나면(UTC 15시) 표시하지 않는다', () => {
    expect(run('c1', '2026-11-02', '2026-11-01T15:00:00Z')).toBeUndefined();
  });
  it('값이 없거나 형식이 틀리거나 저장소 접근이 막히면 표시하지 않는다', () => {
    expect(run('c1', null, '2026-11-01T00:00:00Z')).toBeUndefined();
    expect(run('c1', 'abc', '2026-11-01T00:00:00Z')).toBeUndefined();
    expect(run('c1', 'throw', '2026-11-01T00:00:00Z')).toBeUndefined();
  });
  it('isSuppressed 와 같은 결과를 낸다', () => {
    for (const stored of ['2026-11-01', '2026-11-02', '2026-10-31']) {
      expect(run('c1', stored, '2026-11-01T03:00:00Z') === 'c1').toBe(isSuppressed(stored, '2026-11-01'));
    }
  });
  it('id 의 태그 종료 문자가 이스케이프된다', () => {
    const s = popupHideScript('a"</script>');
    expect(s).not.toContain('</script>');
    expect(s).toContain('\\u003c');
  });
});

describe('popupHideScript — 하이드레이션 전 닫기', () => {
  type Handler = (e: unknown) => void;
  const setup = (opts: { ready?: boolean; checked?: 'day' | 'week' | null } = {}) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T03:00:00Z')); // KST 2026-11-01
    const handlers: Record<string, Handler> = {};
    const saved: Record<string, string> = {};
    const doc = {
      documentElement: { dataset: {} as Record<string, string> },
      addEventListener: (type: string, fn: Handler) => {
        handlers[type] = fn;
      },
      querySelector: (sel: string) => {
        if (sel === '.modal:not([data-ready])') return opts.ready ? null : {};
        if (sel === '.modal input[data-hide]:checked')
          return opts.checked ? { getAttribute: () => opts.checked } : null;
        return null;
      },
    };
    const storage = { getItem: () => null, setItem: (k: string, v: string) => (saved[k] = v) };
    new Function('localStorage', 'document', popupHideScript('c1'))(storage, doc);
    const target = (match: 'close' | 'backdrop' | 'other') => ({
      closest: (s: string) => (match === 'close' && s === '.modal .close' ? {} : null),
      classList: { contains: (c: string) => match === 'backdrop' && c === 'modal' },
    });
    return { handlers, saved, hidden: () => doc.documentElement.dataset.popupHidden, target };
  };
  afterEach(() => vi.useRealTimers());

  it('닫기 버튼·배경 클릭·Esc 로 data-popup-hidden 을 표시한다', () => {
    for (const fire of [
      (s: ReturnType<typeof setup>) => s.handlers.click({ target: s.target('close') }),
      (s: ReturnType<typeof setup>) => s.handlers.click({ target: s.target('backdrop') }),
      (s: ReturnType<typeof setup>) => s.handlers.keydown({ key: 'Escape' }),
    ]) {
      const s = setup();
      fire(s);
      expect(s.hidden()).toBe('c1');
      expect(s.saved).toEqual({});
    }
  });
  it('다른 클릭·다른 키는 무시한다', () => {
    const s = setup();
    s.handlers.click({ target: s.target('other') });
    s.handlers.keydown({ key: 'Enter' });
    expect(s.hidden()).toBeUndefined();
  });
  it('모달에 data-ready 가 붙은 뒤에는 컴포넌트에 맡기고 처리하지 않는다', () => {
    const s = setup({ ready: true });
    s.handlers.click({ target: s.target('close') });
    s.handlers.keydown({ key: 'Escape' });
    expect(s.hidden()).toBeUndefined();
  });
  it('체크박스 선택값을 suppressUntil 과 같은 규칙으로 저장한다', () => {
    const day = setup({ checked: 'day' });
    day.handlers.click({ target: day.target('close') });
    expect(day.saved).toEqual({ int_popup_hide_c1: suppressUntil('2026-11-01', 1) });
    const week = setup({ checked: 'week' });
    week.handlers.keydown({ key: 'Escape' });
    expect(week.saved).toEqual({ int_popup_hide_c1: suppressUntil('2026-11-01', 7) });
    expect(week.hidden()).toBe('c1');
  });
});

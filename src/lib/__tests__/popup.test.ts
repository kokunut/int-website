import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  activePopups,
  buildPopups,
  contestToPopup,
  isSuppressed,
  mergeSuppress,
  popupHideScript,
  popupStorageKey,
  suppressUntil,
} from '../popup';
import type { PopupContest } from '../popup';
import type { Popup } from '../types';

const c = (id: string, start: string, end: string, popup = true): PopupContest => ({
  id,
  title: id,
  desc: '',
  start,
  end,
  popup,
});

const p = (id: string, start: string, end: string, order?: number): Popup => ({
  id,
  title: id,
  cat: '제휴',
  start,
  end,
  desc: '',
  image: null,
  href: '',
  cta: '자세히 보기',
  ...(order !== undefined ? { order } : {}),
});

describe('buildPopups', () => {
  it('공모전은 popup:true 만 분류 "공모전"으로 변환해 합친다', () => {
    const out = buildPopups([], [c('a', '2026-10-20', '2026-11-15'), c('off', '2026-10-01', '2026-12-01', false)]);
    expect(out).toEqual([contestToPopup(c('a', '2026-10-20', '2026-11-15'))]);
    expect(out[0]).toMatchObject({ cat: '공모전', href: '/contest/a', cta: '자세히 보기', image: null });
  });
  it('슬러그가 겹치면 팝업 DB 가 우선', () => {
    const out = buildPopups([p('x', '2026-11-01', '2026-11-02', 1)], [c('x', '2026-10-20', '2026-11-15')]);
    expect(out).toHaveLength(1);
    expect(out[0].cat).toBe('제휴');
  });
  it('순서 오름차순, 비어 있으면(공모전 포함) 맨 뒤, 같으면 입력 순서', () => {
    const d = ['2026-11-01', '2026-11-02'] as const;
    const out = buildPopups(
      [p('none', ...d), p('b', ...d, 2), p('a', ...d, 1), p('b2', ...d, 2)],
      [c('contest', '2026-10-20', '2026-11-15')],
    );
    expect(out.map((x) => x.id)).toEqual(['a', 'b', 'b2', 'none', 'contest']);
  });
});

describe('activePopups', () => {
  const list = [p('a', '2026-10-20', '2026-11-15'), p('b', '2026-11-01', '2026-11-30')];

  it('기간 안인 팝업들을 순서대로', () => {
    expect(activePopups(list, '2026-11-01').map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('시작일·마감일 당일 포함', () => {
    expect(activePopups(list, '2026-10-20').map((x) => x.id)).toEqual(['a']);
    expect(activePopups(list, '2026-11-15').map((x) => x.id)).toEqual(['a', 'b']);
    expect(activePopups(list, '2026-11-30').map((x) => x.id)).toEqual(['b']);
  });
  it('기간 밖이면 없음', () => {
    expect(activePopups(list, '2026-10-19')).toEqual([]);
    expect(activePopups(list, '2026-12-01')).toEqual([]);
  });
  it('숨김 처리된 팝업은 건너뛴다', () => {
    expect(activePopups(list, '2026-11-01', (x) => x.id === 'a').map((x) => x.id)).toEqual(['b']);
    expect(activePopups(list, '2026-11-01', () => true)).toEqual([]);
  });
});

describe('suppressUntil', () => {
  it('하루 / 일주일', () => {
    expect(suppressUntil('2026-11-01', 1)).toBe('2026-11-02');
    expect(suppressUntil('2026-11-01', 7)).toBe('2026-11-08');
  });
  it('월·연 넘김', () => {
    expect(suppressUntil('2026-11-30', 1)).toBe('2026-12-01');
    expect(suppressUntil('2026-12-31', 1)).toBe('2027-01-01');
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

describe('mergeSuppress', () => {
  it('더 늦은 만료일이 이미 있으면 유지, 아니면 새 값', () => {
    expect(mergeSuppress('2026-11-08', '2026-11-02')).toBe('2026-11-08');
    expect(mergeSuppress('2026-11-02', '2026-11-02')).toBe('2026-11-02');
    expect(mergeSuppress('2026-11-01', '2026-11-02')).toBe('2026-11-02');
    expect(mergeSuppress(null, '2026-11-02')).toBe('2026-11-02');
    expect(mergeSuppress('abc', '2026-11-02')).toBe('2026-11-02');
  });
});

describe('popupStorageKey', () => {
  it('팝업 슬러그별 키', () => {
    expect(popupStorageKey('c1')).toBe('int_popup_hide_c1');
  });
});

describe('popupHideScript', () => {
  /** stored: 슬러그 -> 저장값. 'throw' 면 저장소 접근 거부 */
  const run = (ids: string[], stored: Record<string, string> | 'throw', now: string) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    const doc = { documentElement: { dataset: {} as Record<string, string> } };
    const storage = {
      getItem: (k: string) => {
        if (stored === 'throw') throw new Error('denied');
        return stored[k.replace('int_popup_hide_', '')] ?? null;
      },
    };
    const noop = () => {};
    const style = { appendChild: noop };
    new Function('localStorage', 'document', popupHideScript(ids))(storage, {
      ...doc,
      head: style,
      createElement: () => ({}),
      addEventListener: noop,
    });
    vi.useRealTimers();
    return doc.documentElement.dataset.popupHidden;
  };
  afterEach(() => vi.useRealTimers());

  it('묶음의 모든 슬러그가 만료일 이전(KST 기준)이면 data-popup-hidden 을 슬러그들로 표시한다', () => {
    expect(run(['c1', 'c2'], { c1: '2026-11-02', c2: '2026-11-08' }, '2026-11-01T14:59:00Z')).toBe('c1,c2');
    expect(run(['c1'], { c1: '2026-11-02' }, '2026-11-01T14:59:00Z')).toBe('c1');
  });
  it('하나라도 숨김이 아니면(새 팝업) 표시하지 않는다', () => {
    expect(run(['c1', 'c2'], { c1: '2026-11-02' }, '2026-11-01T03:00:00Z')).toBeUndefined();
  });
  it('KST 자정이 지나면(UTC 15시) 표시하지 않는다', () => {
    expect(run(['c1'], { c1: '2026-11-02' }, '2026-11-01T15:00:00Z')).toBeUndefined();
  });
  it('값이 없거나 형식이 틀리거나 저장소 접근이 막히면 표시하지 않는다', () => {
    expect(run(['c1'], {}, '2026-11-01T00:00:00Z')).toBeUndefined();
    expect(run(['c1'], { c1: 'abc' }, '2026-11-01T00:00:00Z')).toBeUndefined();
    expect(run(['c1'], 'throw', '2026-11-01T00:00:00Z')).toBeUndefined();
  });
  it('슬러그가 없으면 표시하지 않는다', () => {
    expect(run([], {}, '2026-11-01T00:00:00Z')).toBeUndefined();
  });
  it('isSuppressed 와 같은 결과를 낸다', () => {
    for (const stored of ['2026-11-01', '2026-11-02', '2026-10-31']) {
      expect(run(['c1'], { c1: stored }, '2026-11-01T03:00:00Z') === 'c1').toBe(isSuppressed(stored, '2026-11-01'));
    }
  });
  it('슬러그의 태그 종료 문자가 이스케이프된다', () => {
    const s = popupHideScript(['a"</script>']);
    expect(s).not.toContain('</script>');
    expect(s).toContain('\\u003c');
  });
});

describe('popupHideScript — 묶음 일부만 숨김', () => {
  const run = (ids: string[], stored: Record<string, string>) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T03:00:00Z')); // KST 2026-11-01
    const styles: { textContent: string }[] = [];
    const dataset: Record<string, string> = {};
    const doc = {
      documentElement: { dataset },
      head: { appendChild: (el: { textContent: string }) => styles.push(el) },
      createElement: () => ({ textContent: '' }),
      addEventListener: () => {},
    };
    const storage = { getItem: (k: string) => stored[k.replace('int_popup_hide_', '')] ?? null };
    new Function('localStorage', 'document', popupHideScript(ids))(storage, doc);
    vi.useRealTimers();
    return { dataset, css: styles.map((s) => s.textContent).join('') };
  };
  afterEach(() => vi.useRealTimers());

  it('일부만 숨김이면 data-popup-hidden-ids 에 기록하고 모달 전체는 숨기지 않는다', () => {
    const { dataset } = run(['a', 'b', 'c'], { a: '2026-11-02' });
    expect(dataset.popupHiddenIds).toBe('a');
    expect(dataset.popupHidden).toBeUndefined();
  });
  it('숨김 슬라이드는 감추고 숨김이 아닌 첫 슬라이드만 보이게 하는 규칙을 만든다', () => {
    const { css } = run(['a', 'b', 'c'], { a: '2026-11-02' });
    const S = '.modal:not([data-ready]) .modal-slide';
    expect(css).toContain(`${S}[data-popup-id="a"]{display:none}`);
    expect(css).toContain(`${S}[data-popup-id="b"]{display:block}`);
    expect(css).not.toContain('[data-popup-id="c"]');
  });
  it('가운데·마지막이 숨김이어도 첫 번째 숨김 아닌 슬라이드를 고른다', () => {
    const { css, dataset } = run(['a', 'b', 'c'], { a: '2026-11-02', b: '2026-11-02' });
    expect(dataset.popupHiddenIds).toBe('a,b');
    expect(css).toContain('[data-popup-id="c"]{display:block}');
  });
  it('슬러그의 따옴표·역슬래시는 CSS 문자열로 이스케이프한다', () => {
    const { css } = run(['a"b', 'c\\d'], { 'a"b': '2026-11-02' });
    expect(css).toContain('[data-popup-id="a\\"b"]{display:none}');
    expect(css).toContain('[data-popup-id="c\\\\d"]{display:block}');
  });
  it('아무것도 숨김이 아니면 아무 것도 표시하지 않는다', () => {
    const { dataset, css } = run(['a', 'b'], {});
    expect(dataset.popupHiddenIds).toBeUndefined();
    expect(css).toBe('');
  });
  it('모두 숨김이면 모달 전체 표시(data-popup-hidden)만 쓴다', () => {
    const { dataset, css } = run(['a', 'b'], { a: '2026-11-02', b: '2026-11-02' });
    expect(dataset.popupHidden).toBe('a,b');
    expect(dataset.popupHiddenIds).toBeUndefined();
    expect(css).toBe('');
  });
});

describe('popupHideScript — 하이드레이션 전 닫기', () => {
  type Handler = (e: unknown) => void;
  const setup = (opts: { ready?: boolean; checked?: 'day' | 'week' | null; stored?: Record<string, string> } = {}) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T03:00:00Z')); // KST 2026-11-01
    const handlers: Record<string, Handler> = {};
    const saved: Record<string, string> = { ...(opts.stored ?? {}) };
    const doc = {
      documentElement: { dataset: {} as Record<string, string> },
      head: { appendChild: () => {} },
      createElement: () => ({}),
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
    const storage = { getItem: (k: string) => saved[k] ?? null, setItem: (k: string, v: string) => (saved[k] = v) };
    new Function('localStorage', 'document', popupHideScript(['c1', 'c2']))(storage, doc);
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
      expect(s.hidden()).toBe('c1,c2');
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
  it('체크박스 선택값을 묶음의 모든 슬러그에 suppressUntil 과 같은 규칙으로 저장한다', () => {
    const day = setup({ checked: 'day' });
    day.handlers.click({ target: day.target('close') });
    const d1 = suppressUntil('2026-11-01', 1);
    expect(day.saved).toEqual({ int_popup_hide_c1: d1, int_popup_hide_c2: d1 });
    const week = setup({ checked: 'week' });
    week.handlers.keydown({ key: 'Escape' });
    const d7 = suppressUntil('2026-11-01', 7);
    expect(week.saved).toEqual({ int_popup_hide_c1: d7, int_popup_hide_c2: d7 });
    expect(week.hidden()).toBe('c1,c2');
  });
  it('이미 더 늦은 만료일이 저장돼 있으면 줄이지 않는다', () => {
    const s = setup({ checked: 'day', stored: { int_popup_hide_c1: '2026-11-08' } });
    s.handlers.click({ target: s.target('close') });
    expect(s.saved).toEqual({ int_popup_hide_c1: '2026-11-08', int_popup_hide_c2: '2026-11-02' });
  });
});

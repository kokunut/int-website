'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CAT_KEYS, CAT_LABEL, monthBounds, parseDateParam, monthGrid, shiftMonth, ymOf } from '@/lib/calendar';
import { WEEK, range, toDate, todayKST } from '@/lib/date';
import type { CalendarCategory, CalendarEvent, DateString } from '@/lib/types';
import AppLink from './AppLink';

interface Props {
  events: CalendarEvent[];
  /** 서버에서 계산한 오늘(KST, YYYY-MM-DD). 렌더 중 Date 를 쓰지 않기 위해 props 로 받는다. */
  today: DateString;
  id?: string;
  title?: string;
  plusHref?: string;
  plusLabel?: string;
  compact?: boolean;
  /** `?date=` 쿼리로 월·날짜를 지정할 수 있는지 (전체 캘린더 페이지에서만) */
  deepLink?: boolean;
}

type CatFilter = 'all' | CalendarCategory;

export default function Calendar({
  events,
  today: serverToday,
  id,
  title = '캘린더',
  plusHref = '/calendar',
  plusLabel = '캘린더 전체 보기',
  compact = false,
  deepLink = false,
}: Props) {
  const [today, setToday] = useState(serverToday);
  const initial = ymOf(serverToday);
  const [y, setY] = useState(initial.y);
  const [m, setM] = useState(initial.m);
  const [sel, setSel] = useState<DateString | null>(null);
  const [cat, setCat] = useState<CatFilter>('all');

  // 마운트 후 보정: ISR 캐시가 오래된 경우 서버가 넘긴 today 가 지난 날일 수 있어 KST 오늘을 다시 확인한다.
  // 딥링크(?date=YYYY-MM-DD)가 있으면 그 달·날짜를, 없으면 (아직 아무 조작 전이므로) 오늘이 속한 달을 보여준다.
  useEffect(() => {
    const real = todayKST();
    const ds = deepLink ? parseDateParam(new URLSearchParams(window.location.search).get('date')) : null;
    /* eslint-disable react-hooks/set-state-in-effect -- 오늘·URL 은 클라이언트에서만 정확히 알 수 있다 */
    if (real !== serverToday) setToday(real);
    if (ds) {
      const next = ymOf(ds);
      setY(next.y);
      setM(next.m);
      setSel(ds);
    } else if (real !== serverToday) {
      const next = ymOf(real);
      setY(next.y);
      setM(next.m);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [deepLink, serverToday]);

  const evs = events.filter((e) => cat === 'all' || e.cat === cat);
  const grid = monthGrid(y, m);

  const move = (delta: number) => {
    const next = shiftMonth(y, m, delta);
    setY(next.y);
    setM(next.m);
    setSel(null);
  };
  const pick = (ds: DateString) => {
    if (sel === ds) {
      setSel(null);
      return;
    }
    const next = ymOf(ds);
    setSel(ds);
    setY(next.y);
    setM(next.m);
  };

  let items: CalendarEvent[];
  let head: string;
  if (sel) {
    const d = toDate(sel);
    items = evs.filter((e) => e.start <= sel && sel <= e.end);
    head = `${d.getMonth() + 1}.${d.getDate()} (${WEEK[d.getDay()]}) 일정`;
  } else {
    const { first, last } = monthBounds(y, m);
    items = evs.filter((e) => e.start <= last && e.end >= first);
    head = `${m + 1}월 일정`;
  }

  return (
    <div id={id} className={compact ? 'cal-compact' : undefined}>
      <div className="sec-head">
        <h2>{title}</h2>
        <div className="cal-tools">
          <label className="select">
            <span className="sr-only">일정 분류</span>
            <select value={cat} onChange={(e) => setCat(e.target.value as CatFilter)}>
              <option value="all">전체</option>
              {CAT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {CAT_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <AppLink className="plus" href={plusHref} aria-label={plusLabel} title={plusLabel}>
            +
          </AppLink>
        </div>
      </div>
      <div className="cal">
        <div className="cal-grid-wrap">
          <div className="cal-head">
            <strong className="cal-title" aria-live="polite">
              {y}. {String(m + 1).padStart(2, '0')}
            </strong>
            <div className="cal-nav">
              <button type="button" aria-label="이전 달" onClick={() => move(-1)}>
                ‹
              </button>
              <button type="button" aria-label="다음 달" onClick={() => move(1)}>
                ›
              </button>
            </div>
          </div>
          <div className="cal-week" aria-hidden="true">
            {WEEK.map((w, k) => (
              <span key={w} className={k === 0 ? 'sun' : k === 6 ? 'sat' : undefined}>
                {w}
              </span>
            ))}
          </div>
          <div className="cal-days">
            {grid.map((d) => {
              const on = evs.filter((e) => e.start <= d.date && d.date <= e.end);
              const cats = [...new Set(on.map((e) => e.cat))];
              const cls = [
                'day',
                !d.inMonth && 'out',
                d.date === today && 'today',
                sel === d.date && 'sel',
                d.weekday === 0 && 'sun',
                d.weekday === 6 && 'sat',
              ]
                .filter(Boolean)
                .join(' ');
              const mm = Number(d.date.slice(5, 7));
              return (
                <button
                  key={d.date}
                  type="button"
                  className={cls}
                  aria-pressed={sel === d.date}
                  aria-current={d.date === today ? 'date' : undefined}
                  aria-label={`${d.date.slice(0, 4)}년 ${mm}월 ${d.day}일${on.length ? `, 일정 ${on.length}개` : ''}`}
                  onClick={() => pick(d.date)}
                >
                  <span className="num">{d.day}</span>
                  <span className="dots">
                    {cats.map((c) => (
                      <i key={c} className={`mk mk-${c}`}></i>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="cal-legend">
            {CAT_KEYS.map((k) => (
              <span key={k}>
                <i className={`mk mk-${k}`}></i>
                {CAT_LABEL[k]}
              </span>
            ))}
          </div>
        </div>
        <div className="cal-panel">
          <div className="cal-panel-head">
            <span className="cal-panel-title" aria-live="polite">
              {head}
            </span>
            <span className="reset-slot">
              {sel && (
                <button type="button" className="link-btn" onClick={() => setSel(null)}>
                  {m + 1}월 전체 보기
                </button>
              )}
            </span>
          </div>
          <ul className="cal-list">
            {items.length > 0 ? (
              items.map((e) => {
                const inner = (
                  <>
                    <i className={`mk mk-${e.cat}`}></i>
                    <div>
                      <strong>{range(e.start, e.end)}</strong>
                      <p>{e.title}</p>
                      <small>{CAT_LABEL[e.cat]}</small>
                    </div>
                  </>
                );
                return (
                  <li key={`${e.cat}-${e.start}-${e.title}`}>
                    {e.link ? (
                      <Link className="ev" href={e.link}>
                        {inner}
                      </Link>
                    ) : (
                      <div className="ev">{inner}</div>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="cal-empty">등록된 일정이 없어요</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

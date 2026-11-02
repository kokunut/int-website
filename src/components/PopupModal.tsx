'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EVENTS, trackEvent } from '@/lib/analytics';
import { dday, full, todayKST } from '@/lib/date';
import { activePopups, isSuppressed, mergeSuppress, popupStorageKey, suppressUntil } from '@/lib/popup';
import type { Popup } from '@/lib/types';
import AppLink from './AppLink';

type HideChoice = 'day' | 'week' | null;

interface Shown {
  items: Popup[];
  today: string;
  index: number;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * 메인 팝업(제휴·행사·공지·공모전). 서버가 고른 묶음(`serverToday` 기준 노출 대상)을 초기 HTML에 포함해 LCP를 앞당기고,
 * "보지 않기"는 page.tsx의 인라인 스크립트(`data-popup-hidden`)가 첫 페인트 전에 CSS로 숨긴다.
 * 하이드레이션 전 "닫기"·Esc·배경 클릭도 같은 스크립트가 처리하며(`popupHidden` 표시), 마운트되면 `data-ready="true"` 로 넘겨받는다.
 * 하이드레이션 후에는 클라이언트 날짜·localStorage로 다시 판정한다(서버와 다르면 클라이언트 우선, ADR-006).
 * 여러 개면 한 모달 안에서 이전/다음(←/→)으로 넘기고, "보지 않기"는 지금 열린 묶음 전체에 적용한다(ADR-014).
 * 초기 상태는 서버와 같은 입력(localStorage 미사용)으로만 계산해 하이드레이션 불일치가 없다.
 */
export default function PopupModal({ popups, serverToday }: { popups: Popup[]; serverToday: string }) {
  const [shown, setShown] = useState<Shown | null>(() => {
    const items = activePopups(popups, serverToday);
    return items.length ? { items, today: serverToday, index: 0 } : null;
  });
  const [hide, setHide] = useState<HideChoice>(null);
  const [ready, setReady] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // 하이드레이션 후 클라이언트 기준으로 재판정 (숨겨야 하면 언마운트, 서버와 달라도 클라이언트 우선)
  useEffect(() => {
    const today = todayKST();
    // 하이드레이션 전에 인라인 스크립트가 닫은 묶음(`data-popup-hidden`: 슬러그를 쉼표로 이은 값)은 닫힌 채로 시작한다
    const closedEarly = new Set((document.documentElement.dataset.popupHidden ?? '').split(',').filter(Boolean));
    const isHidden = (p: Popup): boolean => {
      if (closedEarly.has(p.id)) return true;
      try {
        return isSuppressed(localStorage.getItem(popupStorageKey(p.id)), today);
      } catch {
        return false; // 저장소 접근이 막힌 환경에서는 매번 보여준다
      }
    };
    const items = activePopups(popups, today, isHidden);
    if (items.length) {
      // 인라인 스크립트가 다른 묶음 기준으로 남긴 숨김 표시는 클라이언트 판정이 우선하므로 지운다
      delete document.documentElement.dataset.popupHidden;
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    // 외부 상태(localStorage·클라이언트 시계)와의 동기화이므로 마운트 후 전환이 의도된 동작이다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(items.length ? { items, today, index: 0 } : null);
    setReady(true);
  }, [popups]);

  const close = useCallback(() => {
    if (shown && hide) {
      const until = suppressUntil(shown.today, hide === 'day' ? 1 : 7);
      for (const p of shown.items) {
        try {
          const key = popupStorageKey(p.id);
          localStorage.setItem(key, mergeSuppress(localStorage.getItem(key), until));
        } catch {
          // 저장 실패는 무시 (다음 방문에 다시 보일 뿐)
        }
      }
    }
    setShown(null);
    setHide(null);
    returnFocus.current?.focus();
  }, [shown, hide]);

  const total = shown?.items.length ?? 0;
  const go = useCallback(
    (to: number) => setShown((s) => (s && to >= 0 && to < s.items.length ? { ...s, index: to } : s)),
    [],
  );

  const open = shown !== null;
  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && total > 1) {
        e.preventDefault();
        setShown((s) => {
          if (!s) return s;
          const to = s.index + (e.key === 'ArrowRight' ? 1 : -1);
          return to >= 0 && to < s.items.length ? { ...s, index: to } : s;
        });
        return;
      }
      if (e.key !== 'Tab' || !boxRef.current) return;
      const nodes = [...boxRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!boxRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, total]);

  if (!shown) return null;
  const { items, today, index } = shown;
  const p = items[index];
  const dd = dday(p.end, today);
  const toggle = (v: Exclude<HideChoice, null>) => setHide((cur) => (cur === v ? null : v));

  return (
    <div
      className="modal"
      data-ready={ready ? 'true' : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-box" ref={boxRef}>
        <div className="modal-scroll">
        {p.image && (
          // 노션 이미지(안정 경로·외부 URL)라 next/image 최적화 대상이 아니다
          // eslint-disable-next-line @next/next/no-img-element
          <img className="modal-photo" src={p.image} alt={`${p.title} 포스터`} />
        )}
        <div className="modal-body">
          <span className="badge solid">
            {p.cat} · {dd === 0 ? 'D-DAY' : `D-${dd}`}
          </span>
          <h2 id="popup-title">{p.title}</h2>
          {p.desc && <p>{p.desc}</p>}
          <p className="note">
            {p.cat === '공모전' ? '접수' : '기간'} {full(p.start)} ~ {full(p.end)}
          </p>
          {p.href && (
            <AppLink
              className="btn"
              href={p.href}
              onClick={() => {
                trackEvent(EVENTS.popupDetail);
                close();
              }}
            >
              {p.cta}
              <span className="sr-only"> · {p.title}</span>
            </AppLink>
          )}
        </div>
        </div>
        {total > 1 && (
          <div className="modal-nav">
            <button type="button" className="nav-btn" onClick={() => go(index - 1)} disabled={index === 0} aria-label="이전 팝업">
              ‹
            </button>
            <div className="dots" role="group" aria-label="팝업 선택">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  className="dot"
                  aria-label={`${i + 1}번째 팝업 · ${it.title}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => go(i)}
                />
              ))}
            </div>
            <span className="count" aria-live="polite">
              {index + 1} / {total}
            </span>
            <button type="button" className="nav-btn" onClick={() => go(index + 1)} disabled={index === total - 1} aria-label="다음 팝업">
              ›
            </button>
          </div>
        )}
        <div className="modal-foot">
          <label>
            <input type="checkbox" data-hide="day" checked={hide === 'day'} onChange={() => toggle('day')} /> 오늘 하루 보지 않기
          </label>
          <label>
            <input type="checkbox" data-hide="week" checked={hide === 'week'} onChange={() => toggle('week')} /> 일주일간 보지 않기
          </label>
          <button type="button" className="close" ref={closeBtnRef} onClick={close}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

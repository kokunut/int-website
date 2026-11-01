'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { dday, full, todayKST } from '@/lib/date';
import { isSuppressed, pickPopupContest, popupStorageKey, suppressUntil, type PopupContest } from '@/lib/popup';

type HideChoice = 'day' | 'week' | null;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * 공모전 팝업. 서버가 고른 후보(`serverToday` 기준)를 초기 HTML에 포함해 LCP를 앞당기고,
 * "보지 않기"는 page.tsx의 인라인 스크립트(`data-popup-hidden`)가 첫 페인트 전에 CSS로 숨긴다.
 * 하이드레이션 후에는 클라이언트 날짜·localStorage로 다시 판정한다(서버와 다르면 클라이언트 우선, ADR-006).
 * 초기 상태는 서버와 같은 입력(localStorage 미사용)으로만 계산해 하이드레이션 불일치가 없다.
 */
export default function ContestPopup({ contests, serverToday }: { contests: PopupContest[]; serverToday: string }) {
  const [shown, setShown] = useState<{ contest: PopupContest; today: string } | null>(() => {
    const contest = pickPopupContest(contests, serverToday);
    return contest ? { contest, today: serverToday } : null;
  });
  const [hide, setHide] = useState<HideChoice>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // 하이드레이션 후 클라이언트 기준으로 재판정 (숨겨야 하면 언마운트, 서버와 달라도 클라이언트 우선)
  useEffect(() => {
    const today = todayKST();
    const isHidden = (c: PopupContest): boolean => {
      try {
        return isSuppressed(localStorage.getItem(popupStorageKey(c.id)), today);
      } catch {
        return false; // 저장소 접근이 막힌 환경에서는 매번 보여준다
      }
    };
    const contest = pickPopupContest(contests, today, isHidden);
    if (contest) {
      // 인라인 스크립트가 다른 공모전 기준으로 남긴 숨김 표시는 클라이언트 판정이 우선하므로 지운다
      delete document.documentElement.dataset.popupHidden;
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    // 외부 상태(localStorage·클라이언트 시계)와의 동기화이므로 마운트 후 전환이 의도된 동작이다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(contest ? { contest, today } : null);
  }, [contests]);

  const close = useCallback(() => {
    if (shown && hide) {
      try {
        localStorage.setItem(popupStorageKey(shown.contest.id), suppressUntil(shown.today, hide === 'day' ? 1 : 7));
      } catch {
        // 저장 실패는 무시 (다음 방문에 다시 보일 뿐)
      }
    }
    setShown(null);
    setHide(null);
    returnFocus.current?.focus();
  }, [shown, hide]);

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
  }, [open, close]);

  if (!shown) return null;
  const { contest: c, today } = shown;
  const dd = dday(c.end, today);
  const toggle = (v: Exclude<HideChoice, null>) => setHide((cur) => (cur === v ? null : v));

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-box" ref={boxRef}>
        <div className="placeholder modal-img">공모전 포스터 자리</div>
        <div className="modal-body">
          <span className="badge solid">{dd === 0 ? 'D-DAY' : `D-${dd}`}</span>
          <h2 id="popup-title">{c.title}</h2>
          <p>{c.desc}</p>
          <p className="note">
            접수 {full(c.start)} ~ {full(c.end)}
          </p>
          <Link className="btn" href={`/contest/${c.id}`} onClick={close}>
            자세히 보기<span className="sr-only"> · {c.title}</span>
          </Link>
        </div>
        <div className="modal-foot">
          <label>
            <input type="checkbox" checked={hide === 'day'} onChange={() => toggle('day')} /> 오늘 하루 보지 않기
          </label>
          <label>
            <input type="checkbox" checked={hide === 'week'} onChange={() => toggle('week')} /> 일주일간 보지 않기
          </label>
          <button type="button" className="close" ref={closeBtnRef} onClick={close}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

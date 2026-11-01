'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { dday, full, todayKST } from '@/lib/date';
import { isSuppressed, pickPopupContest, popupStorageKey, suppressUntil, type PopupContest } from '@/lib/popup';

type HideChoice = 'day' | 'week' | null;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * 공모전 팝업. 서버에는 popup:true 후보만 받고,
 * 노출 여부(기간·"보지 않기")는 마운트 후 클라이언트에서 KST 기준으로 판정한다.
 */
export default function ContestPopup({ contests }: { contests: PopupContest[] }) {
  const [shown, setShown] = useState<{ contest: PopupContest; today: string } | null>(null);
  const [hide, setHide] = useState<HideChoice>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // 마운트 후 판정 (SSR 마크업과 달라지지 않도록 서버에서는 아무것도 그리지 않는다)
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
    if (!contest) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 클라이언트 전용 값(localStorage)으로 마운트 후 1회 결정
    setShown({ contest, today });
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
            자세히 보기
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

import type { Contest, DateString } from './types';
import { toDate, ymd } from './date';

export type PopupContest = Pick<Contest, 'id' | 'title' | 'desc' | 'start' | 'end' | 'popup'>;

/** localStorage 키 (공모전별) */
export const popupStorageKey = (id: string): string => `int_popup_hide_${id}`;

/** popup:true 이고 today 가 [start, end] 안에 있으며 숨김 처리되지 않은 첫 공모전 */
export function pickPopupContest<T extends PopupContest>(
  contests: T[],
  today: DateString,
  isHidden?: (contest: T) => boolean,
): T | undefined {
  return contests.find((c) => c.popup && c.start <= today && today <= c.end && !isHidden?.(c));
}

/** today 로부터 days 일 뒤 날짜 */
export function addDays(today: DateString, days: number): DateString {
  const d = toDate(today);
  return ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

/** "오늘 하루" = 1, "일주일간" = 7. 저장 값은 팝업을 다시 보여줄 첫 날짜(만료일). */
export function suppressUntil(today: DateString, days: number): DateString {
  return addDays(today, days);
}

/** 저장된 만료일 이전이면 숨김. 값이 없거나 형식이 틀리면 숨기지 않는다. */
export function isSuppressed(stored: string | null | undefined, today: DateString): boolean {
  if (!stored || !/^\d{4}-\d{2}-\d{2}$/.test(stored)) return false;
  return today < stored;
}

/**
 * 첫 페인트 전에 실행하는 인라인 스크립트 본문.
 * `isSuppressed`·`todayKST` 와 같은 규칙(저장값 형식 검사, KST 날짜, today < 만료일이면 숨김)으로
 * 숨김 대상이면 `<html data-popup-hidden="<id>">` 를 표시한다. 저장소 접근 오류는 무시한다.
 * 규칙을 바꾸면 `__tests__/popup.test.ts` 의 스크립트 테스트도 함께 고쳐야 한다.
 */
export function popupHideScript(id: string): string {
  const lit = (v: string) => JSON.stringify(v).replace(/</g, '\\u003c');
  return (
    '(function(){try{' +
    `var s=localStorage.getItem(${lit(popupStorageKey(id))});` +
    'if(!s||!/^\\d{4}-\\d{2}-\\d{2}$/.test(s))return;' +
    "var t=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());" +
    `if(t<s)document.documentElement.dataset.popupHidden=${lit(id)};` +
    '}catch(e){}})();'
  );
}

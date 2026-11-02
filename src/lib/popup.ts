import type { Contest, DateString, Popup } from './types';
import { toDate, ymd } from './date';

export type PopupContest = Pick<Contest, 'id' | 'title' | 'desc' | 'start' | 'end' | 'popup'>;

/** localStorage 키 (팝업 슬러그별) */
export const popupStorageKey = (id: string): string => `int_popup_hide_${id}`;

/** "자세히 보기" 기본 문구 */
export const POPUP_DEFAULT_CTA = '자세히 보기';

/** 공모전 -> 팝업 (분류 "공모전", 상세 페이지로 연결, 순서 없음) */
export function contestToPopup(c: PopupContest): Popup {
  return {
    id: c.id,
    title: c.title,
    cat: '공모전',
    start: c.start,
    end: c.end,
    desc: c.desc,
    image: null,
    href: `/contest/${c.id}`,
    cta: POPUP_DEFAULT_CTA,
  };
}

/**
 * 팝업 DB 행 + `팝업` 체크된 공모전을 합쳐 노출 순서대로 정렬한다 (기간·숨김 판정은 `activePopups`).
 * 슬러그가 겹치면 팝업 DB 가 우선. 순서가 작을수록 먼저, 비어 있으면(공모전 포함) 맨 뒤이고 같으면 입력 순서를 지킨다.
 */
export function buildPopups(popups: Popup[], contests: PopupContest[]): Popup[] {
  const seen = new Set(popups.map((p) => p.id));
  const merged = [...popups, ...contests.filter((c) => c.popup && !seen.has(c.id)).map(contestToPopup)];
  const key = (p: Popup): number => p.order ?? Number.POSITIVE_INFINITY;
  return merged
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (key(a.p) === key(b.p) ? a.i - b.i : key(a.p) < key(b.p) ? -1 : 1))
    .map((x) => x.p);
}

/** today(KST) 가 [start, end] 안에 있고 숨김 처리되지 않은 팝업들 (순서 유지) */
export function activePopups<T extends Pick<Popup, 'id' | 'start' | 'end'>>(
  items: T[],
  today: DateString,
  isHidden?: (item: T) => boolean,
): T[] {
  return items.filter((p) => p.start <= today && today <= p.end && !isHidden?.(p));
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 저장된 만료일 이전이면 숨김. 값이 없거나 형식이 틀리면 숨기지 않는다. */
export function isSuppressed(stored: string | null | undefined, today: DateString): boolean {
  if (!stored || !DATE_RE.test(stored)) return false;
  return today < stored;
}

/** 이미 더 늦은 만료일이 저장돼 있으면 그대로 두고(숨김 기간을 줄이지 않음), 아니면 until */
export function mergeSuppress(stored: string | null | undefined, until: DateString): DateString {
  return stored && DATE_RE.test(stored) && stored >= until ? stored : until;
}

/**
 * 팝업 앞에 두는 인라인 스크립트 본문 (ADR-010, ADR-014). ids 는 서버가 오늘 노출 대상으로 고른 팝업 슬러그들(묶음).
 * 1) 첫 페인트 전: 묶음의 **모든** 슬러그가 `isSuppressed`·`todayKST` 와 같은 규칙(저장값 형식 검사, KST 날짜, today < 만료일)으로
 *    숨김이면 `<html data-popup-hidden="<id>,<id>…">` 를 표시한다. 일부만 숨김이면 그대로 두고 하이드레이션 후 컴포넌트가 걸러낸다.
 * 2) 하이드레이션 전: 모달에 `data-ready` 가 붙기 전까지 "닫기"·배경 클릭·Esc 를 위임 이벤트로 처리한다.
 *    `.modal input[data-hide]:checked` 값(day=1일, week=7일)이 있으면 묶음의 모든 슬러그에 `suppressUntil` 과 같은 규칙으로
 *    저장(더 늦은 만료일이 이미 있으면 유지, `mergeSuppress`)하고 `data-popup-hidden` 을 표시해 CSS 가 즉시 숨긴다. 이후는 컴포넌트가 이어받는다.
 * 저장소 접근 오류는 무시한다. 규칙을 바꾸면 `__tests__/popup.test.ts` 의 스크립트 테스트도 함께 고쳐야 한다.
 */
export function popupHideScript(ids: string[]): string {
  const lit = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');
  return (
    `(function(){var D=document,H=D.documentElement,I=${lit(ids)},P=${lit(popupStorageKey(''))},R=/^\\d{4}-\\d{2}-\\d{2}$/;` +
    "function kst(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}" +
    'function sup(i){try{var s=localStorage.getItem(P+i);return!!s&&R.test(s)&&kst()<s}catch(e){return false}}' +
    'function all(){for(var j=0;j<I.length;j++)if(!sup(I[j]))return false;return I.length>0}' +
    'if(all())H.dataset.popupHidden=I.join(",");' +
    'function hide(){try{var c=D.querySelector(".modal input[data-hide]:checked");' +
    'if(c){var d=new Date(kst()+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+(c.getAttribute("data-hide")==="week"?7:1));' +
    'var v=d.toISOString().slice(0,10);' +
    'for(var j=0;j<I.length;j++){var k=P+I[j],o=localStorage.getItem(k);if(!(o&&R.test(o)&&o>=v))localStorage.setItem(k,v)}}}catch(e){}' +
    'H.dataset.popupHidden=I.join(",")}' +
    'function pending(){return D.querySelector(".modal:not([data-ready])")}' +
    'D.addEventListener("click",function(e){var t=e.target;if(!t||!t.closest||!pending())return;' +
    'if(t.closest(".modal .close")||t.classList.contains("modal"))hide()},true);' +
    'D.addEventListener("keydown",function(e){if(e.key==="Escape"&&pending())hide()});' +
    '})();'
  );
}

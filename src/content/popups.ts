import type { Popup } from '@/lib/types';

// 팝업 — 제휴·행사·공지. 기간(start~end, KST) 안에서만 메인에 뜬다. 공모전 팝업은 contests.ts 의 popup:true 에서 합쳐진다.
// 목 기준 날짜(2026-11-01)를 포함하도록 둔다. 날짜를 바꾸면 e2e/fixtures.ts 의 FIXED_NOW 도 확인할 것.
export const popups: Popup[] = [
  {
    id: 'p-partner-open',
    title: 'OO식당 제휴 오픈',
    cat: '제휴',
    start: '2026-10-28',
    end: '2026-11-14',
    desc: '학생증을 보여주면 전 메뉴 10% 할인! 정문 앞 OO식당과 제휴를 맺었어요.',
    image: null,
    href: '/partners/p1',
    cta: '제휴 보러가기',
    order: 1,
  },
  {
    id: 'p-event-lab',
    title: '오픈랩 탐방 신청',
    cat: '행사',
    start: '2026-10-30',
    end: '2026-11-10',
    desc: '인공지능융합대학 연구실을 직접 둘러보는 오픈랩 탐방에 참여해 보세요.',
    image: '/mock/popup-lab.svg', // 이미지 있는 상태 확인용 (제휴 팝업은 이미지 없는 상태로 둔다)
    href: '/notice',
    cta: '공지 확인하기',
    order: 2,
  },
];

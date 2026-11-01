import { test as base, expect } from '@playwright/test';

/** 모든 테스트가 쓰는 고정 시각: 2026-11-01 12:00 KST */
export const FIXED_NOW = new Date('2026-11-01T03:00:00Z');

export const test = base.extend<{ errors: string[]; showPopup: boolean }>({
  /** 기본 false: 공모전 팝업이 다른 테스트의 클릭을 가리지 않도록 숨김 처리한다. */
  showPopup: [false, { option: true }],
  errors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await provide(errors);
  },
  page: async ({ page, showPopup }, provide) => {
    // 외부 폰트(CDN) 요청은 빈 CSS 로 응답 — 네트워크 의존 제거, 콘솔 에러도 없음
    await page.route(/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/, (route) =>
      route.fulfill({ status: 200, body: '', contentType: 'text/css' }),
    );
    if (!showPopup) {
      await page.addInitScript(() => {
        const orig = Storage.prototype.getItem;
        Storage.prototype.getItem = function (key: string) {
          return key.startsWith('int_popup_hide_') ? '2099-01-01' : orig.call(this, key);
        };
      });
    }
    // 팝업·캘린더는 클라이언트에서 오늘을 다시 판정하므로 시계를 고정하면 결정적이다.
    await page.clock.setFixedTime(FIXED_NOW);
    await provide(page);
  },
});

export { expect };

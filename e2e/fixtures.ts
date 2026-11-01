import { test as base, expect } from '@playwright/test';

/** 모든 테스트가 쓰는 고정 시각: 2026-11-01 12:00 KST */
export const FIXED_NOW = new Date('2026-11-01T03:00:00Z');

export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await provide(errors);
  },
  page: async ({ page }, provide) => {
    // 외부 폰트(CDN) 요청 차단 — 네트워크 의존 제거
    await page.route(/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    // 팝업·캘린더는 클라이언트에서 오늘을 다시 판정하므로 시계를 고정하면 결정적이다.
    await page.clock.setFixedTime(FIXED_NOW);
    await provide(page);
  },
});

export { expect };

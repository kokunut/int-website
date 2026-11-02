import { test, expect } from './fixtures';

test.use({ showPopup: true });

const TITLE = '제1회 인트 AI 아이디어 공모전';

test('팝업 노출 → 오늘 하루 보지 않기 → 새로고침 시 미노출 → 다음 날 다시 노출', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: TITLE });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('오늘 하루 보지 않기').check();
  await dialog.getByRole('button', { name: '닫기' }).click();
  await expect(dialog).toBeHidden();

  // 새로고침 중 팝업 요소가 한 번도 화면에 나타나지 않아야 한다 (첫 페인트 전 숨김)
  await page.addInitScript(() => {
    const w = window as unknown as { __popupSeen: boolean };
    w.__popupSeen = false;
    const check = () => {
      const m = document.querySelector('.modal');
      if (m && getComputedStyle(m).display !== 'none') w.__popupSeen = true;
    };
    new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true });
    document.addEventListener('DOMContentLoaded', check);
    window.addEventListener('load', check);
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible();
  await expect(dialog).toBeHidden();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as unknown as { __popupSeen: boolean }).__popupSeen)).toBe(false);

  await page.clock.setFixedTime(new Date('2026-11-02T03:00:00Z'));
  await page.reload();
  await expect(dialog).toBeVisible();
});

test('다른 페이지(/about)에서는 팝업이 뜨지 않는다', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('#app')).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Esc 로 닫힌다', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: TITLE });
  await expect(dialog).toBeVisible();
  await page.locator('.modal[data-ready=true]').waitFor();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('하이드레이션 전에도 닫기·Esc 가 동작하고 하이드레이션 후에도 닫힌 채 유지된다', async ({ page }) => {
  // JS 청크 응답을 붙잡아 하이드레이션을 막는다
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/_next\/static\/.*\.js/, async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog', { name: TITLE });
  await expect(dialog).toBeVisible();
  await expect(page.locator('.modal[data-ready=true]')).toHaveCount(0);

  await dialog.getByLabel('오늘 하루 보지 않기').check();
  await dialog.getByRole('button', { name: '닫기' }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.dataset.popupHidden)).toBeTruthy();
  expect(await page.evaluate(() => localStorage.getItem('int_popup_hide_c2026-ai'))).toBe('2026-11-02');

  release();
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);
  await expect(dialog).toBeHidden();
});

test('하이드레이션 전 Esc 로 닫으면(체크 없음) 하이드레이션 후에도 닫힌 채 유지된다', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/_next\/static\/.*\.js/, async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog', { name: TITLE });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  release();
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);
  await expect(dialog).toBeHidden();
});

test('포커스가 팝업 안에서만 순환한다', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: TITLE });
  await expect(dialog).toBeVisible();
  await page.locator('.modal[data-ready=true]').waitFor();
  await expect(dialog.getByRole('button', { name: '닫기' })).toBeFocused();
  const inside = () => dialog.evaluate((el) => el.contains(document.activeElement));
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await inside()).toBe(true);
  }
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Shift+Tab');
    expect(await inside()).toBe(true);
  }
});

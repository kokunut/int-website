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

  await page.reload();
  await expect(page.locator('#app')).toBeVisible();
  await expect(dialog).toBeHidden();

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
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('포커스가 팝업 안에서만 순환한다', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: TITLE });
  await expect(dialog).toBeVisible();
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

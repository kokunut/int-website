import { test, expect } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('int_popup_hide_c2026-ai', '2026-11-02'));
});

test('제휴 분류 필터', async ({ page }) => {
  await page.goto('/partners');
  const cards = page.locator('a.card[href^="/partners/"]');
  const all = await cards.count();
  expect(all).toBeGreaterThan(1);
  const group = page.getByRole('group', { name: '제휴 분류' });
  await group.getByRole('button', { name: '카페' }).click();
  await expect(group.getByRole('button', { name: '카페' })).toHaveAttribute('aria-pressed', 'true');
  await expect(cards).not.toHaveCount(all);
  for (const badge of await cards.locator('.badge').allTextContents()) expect(badge).toBe('카페');
  await group.getByRole('button', { name: '전체' }).click();
  await expect(cards).toHaveCount(all);
});

test('FAQ 아코디언이 열린다', async ({ page }) => {
  await page.goto('/faq');
  const first = page.locator('.faq details').first();
  await expect(first).not.toHaveAttribute('open', '');
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('.a')).toBeVisible();
});

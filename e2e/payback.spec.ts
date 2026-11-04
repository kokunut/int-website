import { test, expect } from './fixtures';

test('/payback 미터는 금액을 포함한 값 설명을 가진다 (목 데이터 62%)', async ({ page }) => {
  await page.goto('/payback');
  const meter = page.getByRole('meter', { name: '예산 소진율' });
  await expect(meter).toBeVisible();
  await expect(meter).toHaveAttribute('aria-valuetext', /62\.0%, 500,000원 중 310,000원 지급/);
  await expect(page.locator('.pb-state')).toHaveCount(0);
});

test('미터에 포커스하면 지급·남은 금액 툴팁이 보인다', async ({ page }) => {
  await page.goto('/payback');
  const meter = page.getByRole('meter', { name: '예산 소진율' });
  await meter.focus();
  await expect(meter.locator('.meter-tip')).toBeVisible();
  await expect(meter.locator('.meter-tip')).toHaveText('지급 310,000원 · 남은 190,000원');
});

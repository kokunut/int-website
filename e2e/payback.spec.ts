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

for (const width of [1280, 390]) {
  test(`툴팁은 큰 숫자를 가리지 않고 카드 안에 머문다 (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/payback');
    const meter = page.getByRole('meter', { name: '예산 소진율' });
    await meter.focus();
    const tip = await meter.locator('.meter-tip').boundingBox();
    const num = await page.locator('.pb-num').boundingBox();
    const bar = await meter.locator('.bar').boundingBox();
    const card = await page.locator('.pb').boundingBox();
    expect(tip && num && bar && card).toBeTruthy();
    expect(tip!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height - 1);
    expect(tip!.y).toBeGreaterThanOrEqual(num!.y + num!.height);
    expect(tip!.x).toBeGreaterThanOrEqual(card!.x);
    expect(tip!.x + tip!.width).toBeLessThanOrEqual(card!.x + card!.width);
  });
}

test('미터 포커스 링은 막대 둘레 2px 외곽선이다', async ({ page }) => {
  await page.goto('/payback');
  const meter = page.getByRole('meter', { name: '예산 소진율' });
  await meter.focus();
  await expect(meter.locator('.bar')).toHaveCSS('outline-width', '2px');
  await expect(meter.locator('.bar')).toHaveCSS('outline-offset', '3px');
});

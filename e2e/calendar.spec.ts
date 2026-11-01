import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

// 팝업이 화면을 가리지 않도록 오늘 하루 숨김 처리 후 시작한다.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('int_popup_hide_c2026-ai', '2026-11-02'));
});

const dayBtn = (page: Page, label: RegExp) => page.getByRole('button', { name: label });

test('날짜 클릭 → 그날 일정, 재클릭 → 그 달 전체', async ({ page }) => {
  await page.goto('/calendar');
  const title = page.locator('.cal-panel-title');
  await expect(title).toHaveText('11월 일정');

  const day = dayBtn(page, /^2026년 11월 3일/);
  await day.click();
  await expect(title).toHaveText('11.3 (화) 일정');
  await expect(page.locator('.cal-list')).toContainText('2026 인융대 학술제 참가팀 모집');

  await day.click();
  await expect(title).toHaveText('11월 일정');
});

test('다음 달로 이동하면 월 제목과 목록 제목이 바뀐다', async ({ page }) => {
  await page.goto('/calendar');
  await expect(page.locator('.cal-title')).toHaveText('2026. 11');
  await page.getByRole('button', { name: '다음 달' }).click();
  await expect(page.locator('.cal-title')).toHaveText('2026. 12');
  await expect(page.locator('.cal-panel-title')).toHaveText('12월 일정');
});

test('분류 필터를 바꾸면 목록이 줄어든다', async ({ page }) => {
  await page.goto('/calendar');
  const items = page.locator('.cal-list .ev');
  await expect(items.first()).toBeVisible();
  const before = await items.count();
  const select = page.getByLabel('일정 분류');
  const values = await select.locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  let narrowed = false;
  for (const value of values.filter((v) => v !== 'all')) {
    await select.selectOption(value);
    if ((await items.count()) < before) narrowed = true;
  }
  expect(narrowed).toBe(true);
  await select.selectOption('all');
  await expect(items).toHaveCount(before);
});

test('딥링크 ?date= 는 해당 월·날짜를 선택한다', async ({ page }) => {
  await page.goto('/calendar?date=2026-12-15');
  await expect(page.locator('.cal-title')).toHaveText('2026. 12');
  await expect(page.locator('.cal-panel-title')).toHaveText('12.15 (화) 일정');
  await expect(dayBtn(page, /^2026년 12월 15일/)).toHaveAttribute('aria-pressed', 'true');
});

test('공지 상세 → 캘린더 보기 → 해당 날짜 선택 상태', async ({ page }) => {
  await page.goto('/notice/1');
  await page.getByRole('link', { name: '캘린더 보기' }).click();
  await expect(page).toHaveURL(/\/calendar\?date=2026-11-03$/);
  await expect(page.locator('.cal-panel-title')).toHaveText('11.3 (화) 일정');
  await expect(dayBtn(page, /^2026년 11월 3일/)).toHaveAttribute('aria-pressed', 'true');
});

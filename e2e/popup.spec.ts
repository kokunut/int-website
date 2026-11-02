import { test, expect } from './fixtures';

test.use({ showPopup: true });

// 목 데이터: 제휴(순서 1) → 행사(순서 2) → 공모전(순서 없음, 맨 뒤). 모두 2026-11-01 을 포함한다.
const PARTNER_TITLE = 'OO식당 제휴 오픈';
const EVENT_TITLE = '오픈랩 탐방 신청';
const TITLE = '제1회 인트 AI 아이디어 공모전';
const SLUGS = ['p-partner-open', 'p-event-lab', 'c2026-ai'];

test('팝업 노출 → 오늘 하루 보지 않기 → 새로고침 시 미노출 → 다음 날 다시 노출', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog');
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
  const dialog = page.getByRole('dialog');
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
  const dialog = page.getByRole('dialog');
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
  const dialog = page.getByRole('dialog');
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
  const dialog = page.getByRole('dialog');
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

test('여러 팝업은 이전/다음·점·방향키로 넘긴다 (순서: 제휴 → 행사 → 공모전)', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.locator('.modal[data-ready=true]').waitFor();

  await expect(dialog.getByRole('heading', { name: PARTNER_TITLE })).toBeVisible();
  await expect(dialog.getByText('1 / 3')).toBeVisible();
  await expect(dialog.getByRole('button', { name: '이전 팝업' })).toBeDisabled();

  await dialog.getByRole('button', { name: '다음 팝업' }).click();
  await expect(dialog.getByRole('heading', { name: EVENT_TITLE })).toBeVisible();
  await expect(dialog.getByText('2 / 3')).toBeVisible();

  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading', { name: TITLE })).toBeVisible();
  await expect(dialog.getByText('3 / 3')).toBeVisible();
  await expect(dialog.getByRole('button', { name: '다음 팝업' })).toBeDisabled();

  await page.keyboard.press('ArrowLeft');
  await expect(dialog.getByRole('heading', { name: EVENT_TITLE })).toBeVisible();

  await dialog.getByRole('button', { name: /^1번째 팝업/ }).click();
  await expect(dialog.getByRole('heading', { name: PARTNER_TITLE })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /^1번째 팝업/ })).toHaveAttribute('aria-current', 'true');
});

test('공모전 슬라이드의 "자세히 보기"는 공모전 상세로 이동한다', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await page.locator('.modal[data-ready=true]').waitFor();
  await dialog.getByRole('button', { name: /^3번째 팝업/ }).click();
  await expect(dialog.getByRole('heading', { name: TITLE })).toBeVisible();
  await dialog.getByRole('link', { name: /자세히 보기/ }).click();
  await expect(page).toHaveURL(/\/contest\/c2026-ai$/);
});

test('제휴 슬라이드의 링크는 사이트 내부 경로로 이동한다', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await page.locator('.modal[data-ready=true]').waitFor();
  await dialog.getByRole('link', { name: /제휴 보러가기/ }).click();
  await expect(page).toHaveURL(/\/partners\/p1$/);
});

test('보지 않기는 지금 열린 팝업 묶음 전체에 적용된다', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await page.locator('.modal[data-ready=true]').waitFor();
  await dialog.getByRole('button', { name: '다음 팝업' }).click();
  await dialog.getByLabel('오늘 하루 보지 않기').check();
  await dialog.getByRole('button', { name: '닫기' }).click();
  await expect(dialog).toBeHidden();

  const stored = await page.evaluate((slugs) => slugs.map((s) => localStorage.getItem(`int_popup_hide_${s}`)), SLUGS);
  expect(stored).toEqual(['2026-11-02', '2026-11-02', '2026-11-02']);

  await page.reload();
  await expect(page.locator('#app')).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('새 팝업이 추가되면 숨긴 팝업은 그대로 두고 새 팝업만 다시 뜬다', async ({ page }) => {
  // 제휴·행사만 숨김 처리된 상태 → 공모전만 남는다
  await page.addInitScript(() => {
    localStorage.setItem('int_popup_hide_p-partner-open', '2026-11-08');
    localStorage.setItem('int_popup_hide_p-event-lab', '2026-11-08');
  });
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await page.locator('.modal[data-ready=true]').waitFor();
  await expect(dialog.getByRole('heading', { name: TITLE })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '다음 팝업' })).toHaveCount(0);
});

test('"오늘 하루"를 골라도 더 길게 숨긴 팝업의 기간을 줄이지 않는다', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('int_popup_hide_p-partner-open', '2026-11-08'));
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await page.locator('.modal[data-ready=true]').waitFor();
  await expect(dialog.getByText('1 / 2')).toBeVisible();
  await dialog.getByLabel('오늘 하루 보지 않기').check();
  await dialog.getByRole('button', { name: '닫기' }).click();
  const keys = await page.evaluate(() => [
    localStorage.getItem('int_popup_hide_p-partner-open'),
    localStorage.getItem('int_popup_hide_p-event-lab'),
  ]);
  expect(keys).toEqual(['2026-11-08', '2026-11-02']);
});

test('기간이 끝난 팝업은 뜨지 않는다', async ({ page }) => {
  // 제휴·행사·공모전 모두 11월 중순 이전에 끝난다
  await page.clock.setFixedTime(new Date('2026-12-01T03:00:00Z'));
  await page.goto('/');
  await expect(page.locator('#app')).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('기간 중간에 끝난 팝업만 빠진다 (11/12: 행사 종료 후 제휴·공모전)', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T03:00:00Z'));
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await page.locator('.modal[data-ready=true]').waitFor();
  await expect(dialog.getByText('1 / 2')).toBeVisible();
  await expect(dialog.getByRole('heading', { name: PARTNER_TITLE })).toBeVisible();
  await dialog.getByRole('button', { name: '다음 팝업' }).click();
  await expect(dialog.getByRole('heading', { name: TITLE })).toBeVisible();
});

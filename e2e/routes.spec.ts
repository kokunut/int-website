import { test, expect } from './fixtures';

const ROUTES = [
  '/', '/about', '/departments', '/departments/aixee', '/notice', '/notice/1', '/calendar', '/contest',
  '/contest/c2026-ai', '/payback', '/partners', '/partners/p1', '/suggest', '/faq',
  '/docs/rules', '/docs/minutes', '/docs/plans', '/docs/forms',
];

for (const path of ROUTES) {
  test(`${path} 은 200 이고 콘솔 에러가 없다`, async ({ page, errors }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
    // 외부 폰트는 일부러 차단하므로 리소스 로드 실패 메시지는 제외한다.
    expect(errors.filter((e) => !/Failed to load resource|ERR_FAILED/.test(e))).toEqual([]);
  });
}

test('없는 주소는 404 화면을 보여 준다', async ({ page }) => {
  const res = await page.goto('/no-such-page');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible();
  await page.getByRole('link', { name: '홈으로' }).click();
  await expect(page).toHaveURL('/');
});

test('첫 Tab 은 본문 바로가기 링크에 포커스된다', async ({ page }) => {
  await page.goto('/faq');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '본문 바로가기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#app$/);
});

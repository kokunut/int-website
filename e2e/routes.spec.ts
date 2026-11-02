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
    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors).toEqual([]);
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

test('Vercel 밖에서는 /_vercel/ 요청이 한 건도 없다', async ({ page }) => {
  const paths: string[] = [];
  page.on('request', (r) => paths.push(new URL(r.url()).pathname));
  for (const path of ['/', '/about']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  expect(paths.filter((p) => p.startsWith('/_vercel/'))).toEqual([]);
});

test('카카오톡 FAB 클릭은 새 탭을 열고 콘솔 에러·통계 요청이 없다', async ({ page, context, errors }) => {
  await page.goto('/');
  const fab = page.getByRole('link', { name: '카카오톡으로 문의하기' });
  const href = await fab.getAttribute('href');
  // 외부 사이트 접속 없이 새 탭만 확인한다.
  await context.route(href!, (route) => route.fulfill({ status: 200, body: '', contentType: 'text/html' }));
  const vercelRequests: string[] = [];
  context.on('request', (r) => {
    if (new URL(r.url()).pathname.startsWith('/_vercel/')) vercelRequests.push(r.url());
  });
  const [popup] = await Promise.all([context.waitForEvent('page'), fab.click()]);
  await popup.close();
  expect(vercelRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('노션 이미지 안정 경로는 환경변수가 없으면 404', async ({ request }) => {
  const res = await request.get('/api/notion-file/0123456789abcdef0123456789abcdef/banner-image/0', { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});

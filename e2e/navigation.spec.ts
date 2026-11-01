import { test, expect } from './fixtures';

test.describe('데스크톱 내비게이션', () => {
  test.skip(({ isMobile }) => isMobile, '데스크톱 전용');

  test('드롭다운 링크로 이동하고 활성 메뉴가 표시된다', async ({ page }) => {
    await page.goto('/faq');
    const nav = page.getByRole('navigation', { name: '주 메뉴' });
    await nav.getByRole('link', { name: '소식', exact: true }).hover();
    await nav.getByRole('link', { name: '캘린더' }).click();
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(nav.locator('.menu-top.active')).toHaveText('소식');
    await expect(nav.getByRole('link', { name: '캘린더' })).toHaveAttribute('aria-current', 'page');
  });

  test('하위 메뉴가 없는 FAQ 는 상위 메뉴가 활성으로 표시된다', async ({ page }) => {
    await page.goto('/about');
    await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: 'FAQ' }).click();
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.locator('.menu-top.active')).toHaveText('FAQ');
  });
});

test.describe('모바일 내비게이션', () => {
  test.skip(({ isMobile }) => !isMobile, '모바일 전용');

  test('햄버거를 열고 링크를 누르면 이동하며 닫힌다', async ({ page }) => {
    await page.goto('/faq');
    const burger = page.locator('#burger');
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '공지사항' }).click();
    await expect(page).toHaveURL(/\/notice$/);
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
  });

  test('Esc 로 닫힌다', async ({ page }) => {
    await page.goto('/faq');
    const burger = page.locator('#burger');
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
  });
});

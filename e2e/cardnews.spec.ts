import { test, expect } from './fixtures';

// 목 데이터: 공지 6번 "인트 10월 활동 모아보기" (카드뉴스 3장)
test('카드뉴스 공지 상세: 장수 표시·버튼·키보드로 넘기기', async ({ page, errors }) => {
  await page.goto('/notice/6');
  const slider = page.getByRole('group', { name: /카드뉴스$/ });
  await expect(slider).toBeVisible();
  await expect(slider.getByText('1 / 3')).toBeVisible();
  await expect(slider.getByRole('img', { name: '인트 10월 활동 모아보기 카드뉴스 1/3' })).toBeVisible();
  await expect(slider.getByRole('button', { name: '이전 카드' })).toBeDisabled();

  await slider.getByRole('button', { name: '다음 카드' }).click();
  await expect(slider.getByText('2 / 3')).toBeVisible();

  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider.getByText('3 / 3')).toBeVisible();
  await expect(slider.getByRole('button', { name: '다음 카드' })).toBeDisabled();

  await page.keyboard.press('ArrowLeft');
  await expect(slider.getByText('2 / 3')).toBeVisible();

  const link = slider.getByRole('link', { name: /인스타그램에서 보기/ });
  await expect(link).toHaveAttribute('href', /^https:\/\/www\.instagram\.com\//);
  await expect(link).toHaveAttribute('rel', /noopener/);
  expect(errors).toEqual([]);
});

test('카드뉴스 공지 상세: 공유 썸네일은 첫 장 절대 URL', async ({ page }) => {
  await page.goto('/notice/6');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https?:\/\/.+\/mock\/cardnews-1\.svg$/);
});

test('공지 목록: 카드뉴스 탭 필터와 장수 표시', async ({ page }) => {
  await page.goto('/notice');
  const items = page.locator('.list li');
  const total = await items.count();
  await page.getByRole('button', { name: '카드뉴스' }).click();
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText('인트 10월 활동 모아보기');
  await expect(items.first()).toContainText('3장');
  await page.getByRole('button', { name: '전체' }).click();
  await expect(items).toHaveCount(total);
});

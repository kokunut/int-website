import { test, expect } from './fixtures';

// 목 데이터: 취업 3건(채용공고·취업후기·자격증), 병영 3건(입대준비·복무·병역특례)

test.describe('메뉴 이동', () => {
  test.skip(({ isMobile }) => isMobile, '데스크톱 전용');

  test('아카이브 메뉴에서 취업 아카이브·병영 길라잡이로 이동한다', async ({ page }) => {
    await page.goto('/faq');
    const nav = page.getByRole('navigation', { name: '주 메뉴' });
    await nav.getByRole('link', { name: '아카이브', exact: true }).hover();
    await nav.getByRole('link', { name: '취업 아카이브' }).click();
    await expect(page).toHaveURL(/\/archive\/career$/);
    await expect(page.getByRole('heading', { level: 1, name: '취업 아카이브' })).toBeVisible();
    await expect(nav.locator('.menu-top.active')).toHaveText('아카이브');

    await nav.getByRole('link', { name: '아카이브', exact: true }).hover();
    await nav.getByRole('link', { name: '병영 길라잡이' }).click();
    await expect(page).toHaveURL(/\/archive\/military$/);
  });

  test('복지 메뉴에는 병역 길라잡이 외부 링크가 없다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '병역 길라잡이' })).toHaveCount(0);
  });
});

test('취업 아카이브 목록: 고정 글 상단, 날짜 내림차순, 첨부 개수', async ({ page, errors }) => {
  await page.goto('/archive/career');
  const items = page.locator('.list li');
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText('채용공고 모아보기 (예시)');
  await expect(items.nth(0)).toContainText('고정');
  await expect(items.nth(0)).toContainText('첨부 1');
  await expect(items.nth(1)).toContainText('취업 후기 (예시)');
  await expect(items.nth(2)).toContainText('자격증 준비 안내 (예시)');
  await expect(items.nth(2)).toContainText('첨부 2');
  expect(errors).toEqual([]);
});

test('주제 탭과 제목 검색', async ({ page }) => {
  await page.goto('/archive/career');
  const items = page.locator('.list li');
  const tabs = page.getByRole('group', { name: '주제' });
  await expect(tabs.getByRole('button')).toHaveText(['전체', '채용공고', '취업후기', '자격증']);

  await tabs.getByRole('button', { name: '자격증' }).click();
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText('자격증 준비 안내');

  await tabs.getByRole('button', { name: '전체' }).click();
  await expect(items).toHaveCount(3);

  await page.getByRole('searchbox', { name: '제목 검색' }).fill('후기');
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText('취업 후기');

  await page.getByRole('searchbox', { name: '제목 검색' }).fill('없는검색어');
  await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
});

test('취업 아카이브: 인융 인터뷰 아카이브 링크 카드가 목록 위에 있다', async ({ page }) => {
  await page.goto('/archive/career');
  const card = page.getByRole('link', { name: /인융 인터뷰 아카이브 \(새 창\)/ });
  await expect(card).toBeVisible();
  await expect(card).not.toContainText('(노션)');
  await expect(card).toHaveAttribute('href', /^https:\/\/www\.notion\.so\//);
  await expect(card).toHaveAttribute('target', '_blank');
  await expect(page.locator('.list li')).toHaveCount(3);
  await page.goto('/archive/military');
  await expect(page.getByRole('link', { name: /인융 인터뷰 아카이브 \(새 창\)/ })).toHaveCount(0);
});

test('공모전 페이지에 외부 공모전 정보 노션 안내 문장이 없다', async ({ page }) => {
  await page.goto('/contest');
  await expect(page.getByText('외부 공모전 정보는')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '노션 공모전 정보' })).toHaveCount(0);
});

test('메인 바로가기에 인융 인터뷰 아카이브 카드가 있다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /인융 인터뷰 아카이브/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /공모전 정보/ })).toHaveCount(0);
});

test('병영 길라잡이: 병역 길라잡이 링크 카드가 목록 위에 있다', async ({ page }) => {
  await page.goto('/archive/military');
  const card = page.getByRole('link', { name: /병역 길라잡이 \(새 창\)/ });
  await expect(card).toBeVisible();
  await expect(card).not.toContainText('(노션)');
  await expect(card).toHaveAttribute('href', /^https:\/\/www\.notion\.so\//);
  await expect(card).toHaveAttribute('target', '_blank');
  await expect(page.locator('.list li')).toHaveCount(3);
  await expect(page.getByRole('group', { name: '주제' }).getByRole('button')).toHaveText(['전체', '입대준비', '복무', '병역특례']);
});

test('상세: 배지·날짜·본문 블록·첨부·원문 링크·이전/다음', async ({ page, errors }) => {
  await page.goto('/archive/career/job-posting-example');
  await expect(page.getByRole('heading', { level: 1, name: '채용공고 모아보기 (예시)' })).toBeVisible();
  const article = page.locator('.article');
  await expect(article.locator('.badge').first()).toHaveText('취업');
  await expect(article.locator('.badge').nth(1)).toHaveText('채용공고');
  await expect(article).toContainText('2026.10.28 게시');

  // 본문 블록: 콜아웃·제목·목록·문단
  await expect(article.getByRole('note')).toContainText('이 글은 예시입니다');
  await expect(article.getByRole('heading', { level: 2, name: '이렇게 정리해요' })).toBeVisible();
  await expect(article.locator('ul.nb-list li')).toHaveCount(3);

  const attach = article.getByRole('region', { name: '첨부 파일' });
  await expect(attach).toContainText('예시 공고 요약.svg');
  await expect(attach.getByRole('link', { name: '열기·다운로드' })).toHaveAttribute('href', '/mock/archive-sample-1.svg');

  const origin = article.getByRole('link', { name: /원문 보기/ });
  await expect(origin).toHaveAttribute('href', 'https://www.example.com/');
  await expect(origin).toHaveAttribute('rel', /noopener/);

  // 첫 글: 이전 글 없음, 다음 글은 두 번째
  const pager = page.getByRole('navigation', { name: '이전·다음 항목' });
  await pager.getByRole('link', { name: /취업 후기 \(예시\)/ }).click();
  await expect(page).toHaveURL(/\/archive\/career\/review-example$/);
  await expect(page.locator('.article blockquote')).toBeVisible();
  expect(errors).toEqual([]);
});

test('상세: 첨부 목록이 보이고 외부 링크 버튼은 새 탭으로 열린다', async ({ page }) => {
  await page.goto('/archive/career/certificate-example');
  const article = page.locator('.article');
  const attach = article.getByRole('region', { name: '첨부 파일' });
  await expect(attach.locator('li')).toHaveCount(2);
  const files = attach.getByRole('link', { name: '열기·다운로드' });
  await expect(files.first()).toHaveAttribute('target', '_blank');
  await expect(files.first()).toHaveAttribute('rel', 'noopener noreferrer');

  await page.goto('/archive/career/job-posting-example');
  const origin = page.locator('.article').getByRole('link', { name: /원문 보기/ });
  await expect(origin).toBeVisible();
  await expect(origin).toHaveAttribute('target', '_blank');
  await expect(origin).toHaveAttribute('rel', 'noopener noreferrer');
});

test('상세: 체크리스트·구분선 블록', async ({ page }) => {
  await page.goto('/archive/career/certificate-example');
  await expect(page.locator('.nb-todo')).toHaveCount(2);
  await expect(page.locator('.nb-todo.done')).toHaveCount(1);
  await expect(page.locator('.blocks hr')).toHaveCount(1);
});

test('없는 분류·슬러그는 404', async ({ page }) => {
  for (const path of ['/archive/unknown', '/archive/career/no-such-post', '/archive/military/job-posting-example', '/archive/career/Bad_Slug']) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(404);
    await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible();
  }
});

test('sitemap 에 아카이브 주소가 들어 있다', async ({ request }) => {
  const body = await (await request.get('/sitemap.xml')).text();
  expect(body).toContain('/archive/career</loc>');
  expect(body).toContain('/archive/military</loc>');
  expect(body).toContain('/archive/career/job-posting-example</loc>');
  expect(body).toContain('/archive/military/enlist-prep-example</loc>');
});

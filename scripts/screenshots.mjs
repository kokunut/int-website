// README용 화면 캡처 스크립트.
// 사용법: 서버를 먼저 띄운 뒤(npm run build && npx next start -p 3000) → npm run screenshots
// 환경변수 BASE_URL 로 주소를 바꿀 수 있습니다. 결과: docs/images/*.png
// Playwright 는 의존성에 넣지 않습니다. 전역/로컬에 이미 설치되어 있어야 합니다.
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'images');

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const tries = [() => require('playwright'), () => import('playwright')];
  for (const t of tries) {
    try {
      const m = await t();
      return m.chromium ? m : m.default;
    } catch {}
  }
  console.error('Playwright 를 찾을 수 없습니다. `npm i -g playwright` 후 `npx playwright install chromium` 을 실행하거나,');
  console.error('전역 모듈 경로를 NODE_PATH 에 지정하세요. (예: NODE_PATH=$(npm root -g) npm run screenshots)');
  process.exit(1);
}

const { chromium } = await loadPlaywright();
await mkdir(OUT, { recursive: true });

// 공모전 팝업 "숨김" 처리: int_popup_hide_ 로 시작하는 키는 항상 먼 미래 날짜(만료일 이전이면 숨김)를 돌려준다.
const SUPPRESS = `
  (() => {
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k) {
      return typeof k === 'string' && k.startsWith('int_popup_hide_') ? '2099-01-01' : orig.call(this, k);
    };
  })();`;

// 데스크톱 캡처에서는 카카오 문의 버튼이 내용을 가리므로 숨긴다 (모바일은 그대로).
const HIDE_FAB = '.fab { visibility: hidden !important; }';

const browser = await chromium.launch();

async function newPage({ width, height, suppress = true, mobile = false, hideFab = !mobile }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: mobile,
    hasTouch: mobile,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });
  if (suppress) await ctx.addInitScript(SUPPRESS);
  // 외부 폰트(CDN)가 느리거나 막혀도 멈추지 않도록 5초 안에 못 받으면 요청을 끊는다.
  await ctx.route(/pretendard|fonts\.(googleapis|gstatic)|jsdelivr/i, async (route) => {
    try {
      const res = await Promise.race([
        route.fetch({ timeout: 5000 }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('font timeout')), 5000)),
      ]);
      await route.fulfill({ response: res });
    } catch {
      await route.abort().catch(() => {});
    }
  });
  const page = await ctx.newPage();
  if (hideFab) {
    await page.addInitScript((css) => {
      document.addEventListener('DOMContentLoaded', () => {
        const st = document.createElement('style');
        st.textContent = css;
        document.head.appendChild(st);
      });
    }, HIDE_FAB);
  }
  return page;
}

async function open(page, url) {
  await page.goto(BASE_URL + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 5000))]));
  await page.waitForTimeout(600); // 하이드레이션·애니메이션 안정화
}

async function save(page, name, opts = {}) {
  let file = path.join(OUT, `${name}.png`);
  const buf = await page.screenshot({ type: 'png', ...opts });
  if (buf.length > 600 * 1024) {
    file = path.join(OUT, `${name}.jpg`);
    const jpg = await page.screenshot({ type: 'jpeg', quality: 80, ...opts });
    await writeFile(file, jpg);
  } else {
    await writeFile(file, buf);
  }
  const { size } = await stat(file);
  console.log(`${path.relative(process.cwd(), file)}  ${(size / 1024).toFixed(0)} KB`);
}

const desktop = { width: 1280, height: 1100 };
const clip = { x: 0, y: 0, width: 1280, height: 1100 };
const homeClip = { x: 0, y: 0, width: 1280, height: 990 }; // 배너+캘린더+페이백 행까지

try {
  let page = await newPage(desktop);
  await open(page, '/');
  await save(page, 'home', { clip: homeClip });

  await open(page, '/calendar');
  await page.getByRole('button', { name: /11월 3일/ }).first().click();
  await page.waitForTimeout(300);
  await save(page, 'calendar', { clip: { ...clip, height: 900 } });

  await open(page, '/about');
  // 집행부 섹션만 잘라서 캡처 (고정 헤더·문의 버튼과 겹치지 않게)
  const roster = page.locator('section[aria-labelledby="roster-title"]');
  await roster.scrollIntoViewIfNeeded();
  await page.addStyleTag({ content: 'header { visibility: hidden !important; }' });
  const box = await roster.boundingBox();
  await save(page, 'about', { fullPage: true, clip: { x: 0, y: box.y + (await page.evaluate(() => scrollY)) - 16, width: 1280, height: box.height + 32 } });

  await open(page, '/payback');
  await save(page, 'payback', { clip });

  await open(page, '/contest/c2026-ai');
  await save(page, 'contest', { clip });
  await page.context().close();

  // 팝업은 숨김 설정 없이
  page = await newPage({ ...desktop, suppress: false });
  await open(page, '/');
  await page.getByRole('dialog').waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  await save(page, 'popup');
  await page.context().close();

  // 모바일
  page = await newPage({ width: 390, height: 844, mobile: true });
  await open(page, '/');
  await save(page, 'mobile', { clip: { x: 0, y: 0, width: 390, height: 1400 } });
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await page.waitForTimeout(400);
  await save(page, 'mobile-menu');
  await page.context().close();
} catch (e) {
  console.error('캡처 실패:', e.message);
  console.error(`서버가 ${BASE_URL} 에서 실행 중인지 확인하세요.`);
  process.exitCode = 1;
} finally {
  await browser.close();
}

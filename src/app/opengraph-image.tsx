import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = '인트 · 세종대학교 인공지능융합대학 학생회';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 브랜드 색 (globals.css 의 --accent / --brand 와 같은 값)
const BG = '#181A16';
const BRAND = '#548AEC';

export default async function OpengraphImage() {
  // satori 는 woff2 를 지원하지 않아 otf 를 직접 읽는다
  const [font, logoSvg] = await Promise.all([
    readFile(path.join(process.cwd(), 'node_modules/pretendard/dist/public/static/Pretendard-Bold.otf')),
    readFile(path.join(process.cwd(), 'public/brand/logo.svg'), 'utf8'),
  ]);
  const logo = `data:image/svg+xml;base64,${Buffer.from(logoSvg.replace(/currentColor/g, BRAND)).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: BG,
          color: '#ffffff',
          fontFamily: 'Pretendard',
        }}
      >
        <img src={logo} alt="" width={357} height={134} />
        <div style={{ width: 120, height: 8, background: BRAND, marginTop: 56, marginBottom: 40, display: 'flex' }} />
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.3, display: 'flex' }}>인트 · 세종대학교 인공지능융합대학 학생회</div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Pretendard', data: font, weight: 700, style: 'normal' }] },
  );
}

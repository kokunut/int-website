import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 클라이언트 이벤트 전송 여부 판정용 (Vercel 빌드에서만 '1')
  env: { NEXT_PUBLIC_VERCEL: process.env.VERCEL === '1' ? '1' : '' },
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 클라이언트 이벤트 전송 여부 판정용 (Vercel 운영(Production) 배포에서만 '1')
  env: { NEXT_PUBLIC_ANALYTICS: process.env.VERCEL_ENV === 'production' ? '1' : '' },
};

export default nextConfig;

'use client';

import { EVENTS, trackEvent } from '@/lib/analytics';

export default function KakaoFab({ href }: { href: string }) {
  return (
    <a
      className="fab"
      id="fab"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="카카오톡으로 문의하기"
      onClick={() => trackEvent(EVENTS.kakaoFab)}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.84 5.32 4.62 6.74l-.97 3.56a.4.4 0 0 0 .6.44l4.2-2.78c.51.06 1.03.09 1.55.09 5.52 0 10-3.58 10-8.05S17.52 3 12 3Z" />
      </svg>
      <span>카카오톡 문의</span>
    </a>
  );
}

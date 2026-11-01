'use client';

import { useEffect, useState, useSyncExternalStore, type TouchEvent } from 'react';
import type { Banner } from '@/lib/types';
import AppLink from './AppLink';

const INTERVAL_MS = 5000;
const SWIPE_PX = 40;

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const subscribeVisibility = (cb: () => void) => {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
};

function Slide({ b, active, index, total }: { b: Banner; active: boolean; index: number; total: number }) {
  const label = `${index + 1} / ${total}`;
  const common = { role: 'group', 'aria-roledescription': '슬라이드', 'aria-label': label, inert: !active } as const;
  if (b.image) {
    return (
      <div className="slide is-img" {...common}>
        <AppLink href={b.href} className="slide-link">
          <picture>
            {b.imageMobile && <source media="(max-width:720px)" srcSet={b.imageMobile} />}
            {/* 노션 등 외부 이미지 URL 이라 next/image 최적화 대상이 아니다 */}
            <img src={b.image} alt={b.slogan} />
          </picture>
        </AppLink>
      </div>
    );
  }
  return (
    <div className="slide" {...common}>
      <AppLink href={b.href} className="slide-link">
        <div className="bn-tpl">
          <div className="bn-left">
            <div className="bn-word">{b.word}</div>
            <p className="bn-slogan">{b.slogan}</p>
            <div className="bn-lines">
              <i></i>
              <i></i>
            </div>
            <div className="bn-place">
              <b>{b.placeLabel}</b>
              <span>{b.place}</span>
            </div>
          </div>
          <div className="bn-right">
            <b>LINK</b>
            {b.links.map((l) => (
              <div key={l.label}>
                <b>{l.label}</b>
                <span>{l.value}</span>
              </div>
            ))}
          </div>
        </div>
      </AppLink>
    </div>
  );
}

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const total = banners.length;
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [touch, setTouch] = useState(false);
  const [touchX, setTouchX] = useState<{ x: number; y: number } | null>(null);
  const reduceMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => true,
  );
  const tabHidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'hidden',
    () => false,
  );

  const go = (n: number) => setIndex(((n % total) + total) % total);
  const playing = !reduceMotion && total > 1 && !hover && !focus && !touch && !tabHidden;

  // index 가 바뀔 때마다 타이머가 다시 시작되므로 수동 이동 후에도 5초를 채운다.
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % total), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [playing, index, total]);

  if (total === 0) return null;

  const onTouchStart = (e: TouchEvent) => {
    setTouch(true);
    setTouchX({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  const onTouchEnd = (e: TouchEvent) => {
    setTouch(false);
    if (!touchX) return;
    const dx = e.changedTouches[0].clientX - touchX.x;
    const dy = e.changedTouches[0].clientY - touchX.y;
    setTouchX(null);
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <>
      <div
        className="banner"
        aria-roledescription="carousel"
        aria-label="배너"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => {
          setTouch(false);
          setTouchX(null);
        }}
      >
        <div
          className="banner-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
          aria-live={playing ? 'off' : 'polite'}
        >
          {banners.map((b, k) => (
            <Slide key={`${b.href}-${k}`} b={b} active={k === index} index={k} total={total} />
          ))}
        </div>
      </div>
      <div className="banner-ctrl">
        <div className="dots-row">
          {banners.map((_, k) => (
            <button
              key={k}
              type="button"
              className={k === index ? 'on' : undefined}
              aria-label={`${k + 1}번 배너`}
              aria-current={k === index ? 'true' : undefined}
              onClick={() => go(k)}
            ></button>
          ))}
        </div>
        <div className="arrows">
          <button type="button" aria-label="이전 배너" onClick={() => go(index - 1)}>
            ‹
          </button>
          <span className="count">
            {index + 1} / {total}
          </span>
          <button type="button" aria-label="다음 배너" onClick={() => go(index + 1)}>
            ›
          </button>
        </div>
      </div>
    </>
  );
}

'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cardAlt, counterText, hasReachedTarget, indexFromScroll, stepIndex } from '@/lib/cardnews';

/** 카드뉴스 이미지 슬라이더 — 가로 scroll-snap 스와이프·이전/다음·키보드 ←/→·점·"2 / 6" */
export default function CardSlider({ title, images, instagram }: { title: string; images: string[]; instagram?: string }) {
  const total = images.length;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  /** 버튼·키로 스크롤 애니메이션 중일 때의 목표 장. 도착하거나 사용자가 직접 넘기면 null */
  const target = useRef<number | null>(null);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    target.current = i;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    setIndex(i);
  };
  const move = (delta: number) => goTo(stepIndex(target.current ?? index, delta, total));

  const onScroll = (el: HTMLDivElement) => {
    const t = target.current;
    if (t !== null) {
      // 애니메이션 중간 위치로 현재 장을 덮어쓰지 않는다
      if (hasReachedTarget(el.scrollLeft, el.clientWidth, t)) target.current = null;
      return;
    }
    setIndex(indexFromScroll(el.scrollLeft, el.clientWidth, total));
  };
  const release = () => {
    target.current = null;
  };

  // scrollend 를 지원하는 브라우저는 스크롤이 멈추면 목표를 푼다 (미지원이면 onScroll 의 도착 판정이 대신한다)
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const done = () => {
      target.current = null;
    };
    el.addEventListener('scrollend', done);
    return () => el.removeEventListener('scrollend', done);
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      move(1);
    }
  };

  return (
    <div className="cards" role="group" aria-roledescription="카드뉴스" aria-label={`${title} 카드뉴스`} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="cards-stage">
        <div
          className="cards-track"
          ref={track}
          onScroll={(e) => onScroll(e.currentTarget)}
          onTouchStart={release}
          onWheel={release}
          onPointerDown={release}
        >
          {images.map((src, i) => (
            <div className="cards-slide" key={src + i}>
              {/* 노션 등 외부 이미지라 next/image 최적화 대상이 아니다 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={cardAlt(title, i, total)} loading={i === 0 ? 'eager' : 'lazy'} draggable={false} />
            </div>
          ))}
        </div>
        {total > 1 && (
          <>
            <button type="button" className="cards-nav prev" aria-label="이전 카드" disabled={index === 0} onClick={() => move(-1)}>
              ‹
            </button>
            <button type="button" className="cards-nav next" aria-label="다음 카드" disabled={index === total - 1} onClick={() => move(1)}>
              ›
            </button>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="cards-foot">
          <span className="cards-count" aria-live="polite">
            {counterText(index, total)}
          </span>
          <div className="cards-dots">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === index ? 'on' : undefined}
                aria-label={`${i + 1}번째 카드로 이동`}
                aria-current={i === index}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>
      )}
      {instagram && (
        <p className="cards-src">
          <a href={instagram} target="_blank" rel="noopener noreferrer">
            인스타그램에서 보기 ↗
          </a>
        </p>
      )}
    </div>
  );
}

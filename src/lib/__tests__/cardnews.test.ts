import { describe, expect, it } from 'vitest';
import {
  cardAlt,
  clampIndex,
  counterText,
  hasReachedTarget,
  indexFromScroll,
  isCardNews,
  ogImageUrl,
  stepIndex,
} from '../cardnews';
import { absoluteUrl } from '../site';

describe('슬라이더 인덱스', () => {
  it('clampIndex', () => {
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(5, 3)).toBe(2);
    expect(clampIndex(1.4, 3)).toBe(1);
    expect(clampIndex(NaN, 3)).toBe(0);
    expect(clampIndex(2, 0)).toBe(0);
  });

  it('stepIndex 는 양 끝에서 멈춘다', () => {
    expect(stepIndex(0, -1, 3)).toBe(0);
    expect(stepIndex(0, 1, 3)).toBe(1);
    expect(stepIndex(2, 1, 3)).toBe(2);
  });

  it('indexFromScroll', () => {
    expect(indexFromScroll(0, 500, 3)).toBe(0);
    expect(indexFromScroll(480, 500, 3)).toBe(1);
    expect(indexFromScroll(1000, 500, 3)).toBe(2);
    expect(indexFromScroll(9999, 500, 3)).toBe(2);
    expect(indexFromScroll(100, 0, 3)).toBe(0);
  });

  it('표시 문구', () => {
    expect(counterText(1, 6)).toBe('2 / 6');
    expect(cardAlt('제목', 0, 3)).toBe('제목 카드뉴스 1/3');
  });
});

describe('isCardNews', () => {
  it('유형이 카드뉴스이거나 이미지가 있으면 true', () => {
    expect(isCardNews({ type: '카드뉴스' })).toBe(true);
    expect(isCardNews({ type: '행사', cards: ['/a.svg'] })).toBe(true);
    expect(isCardNews({ type: '일반', cards: [] })).toBe(false);
    expect(isCardNews({ type: '일반' })).toBe(false);
  });
});

describe('hasReachedTarget', () => {
  it('소수 너비에서도 목표 위치 근처면 도착으로 본다', () => {
    const w = 333.33;
    expect(hasReachedTarget(2 * w, w, 2)).toBe(true);
    expect(hasReachedTarget(2 * w + 0.4, w, 2)).toBe(true); // 기존 오차 2px 안
    expect(hasReachedTarget(2 * w - 3.7, w, 2)).toBe(true); // 반올림으로 2px 를 넘는 경우
    expect(hasReachedTarget(2 * w - w / 2 + 1, w, 2)).toBe(true);
  });
  it('반 장 이상 떨어져 있으면 아직 이동 중', () => {
    expect(hasReachedTarget(0, 300, 2)).toBe(false);
    expect(hasReachedTarget(300, 300, 2)).toBe(false);
    expect(hasReachedTarget(450, 300, 2)).toBe(false); // 정확히 반 장 = 도착 아님
  });
  it('너비가 0 이하면 기다리지 않는다', () => {
    expect(hasReachedTarget(0, 0, 3)).toBe(true);
  });
});

describe('ogImageUrl', () => {
  it('내부 경로는 절대 URL, https 는 그대로, 그 외는 null', () => {
    expect(ogImageUrl('/api/notion-file/x/notice-images/0', (p) => absoluteUrl(p, 'https://a.test'))).toBe(
      'https://a.test/api/notion-file/x/notice-images/0',
    );
    expect(ogImageUrl('https://img.example/a.png', absoluteUrl)).toBe('https://img.example/a.png');
    expect(ogImageUrl('http://img.example/a.png', absoluteUrl)).toBeNull();
    expect(ogImageUrl('//evil.example/a.png', absoluteUrl)).toBeNull();
    expect(ogImageUrl('/\t/evil.example/a.png', absoluteUrl)).toBeNull();
    expect(ogImageUrl('/\n/evil.example/a.png', absoluteUrl)).toBeNull();
    expect(ogImageUrl('/\\evil.example/a.png', absoluteUrl)).toBeNull();
    expect(ogImageUrl(undefined, absoluteUrl)).toBeNull();
  });
});

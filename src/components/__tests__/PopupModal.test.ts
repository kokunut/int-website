import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Popup } from '@/lib/types';
import PopupModal from '../PopupModal';

const base: Popup = {
  id: 'p-test',
  title: '테스트 팝업',
  cat: '공지',
  start: '2026-11-01',
  end: '2026-11-30',
  desc: '',
  image: null,
  href: '',
  cta: '자세히',
  order: 1,
};

const html = (p: Partial<Popup>) =>
  renderToStaticMarkup(createElement(PopupModal, { popups: [{ ...base, ...p }], serverToday: '2026-11-02' }));

describe('PopupModal 렌더링', () => {
  it('링크가 없으면 버튼을 렌더링하지 않는다', () => {
    const out = html({ href: '' });
    expect(out).toContain('테스트 팝업');
    expect(out).not.toContain('class="btn"');
    expect(out).not.toContain('자세히');
  });

  it('이미지가 없으면 이미지 영역(포스터 자리)을 렌더링하지 않는다', () => {
    const out = html({ image: null });
    expect(out).not.toContain('modal-photo');
    expect(out).not.toContain('포스터 자리');
  });

  it('이미지가 있으면 "제목 포스터" alt 로 렌더링한다', () => {
    const out = html({ image: '/x.png' });
    expect(out).toContain('alt="테스트 팝업 포스터"');
    expect(out).toContain('modal-photo');
  });
});

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ContentBlock } from '@/lib/types';
import NotionBlocks, { linesToBlocks } from '../NotionBlocks';

const html = (blocks: ContentBlock[]): string => renderToStaticMarkup(createElement(NotionBlocks, { blocks }));

describe('NotionBlocks', () => {
  it('블록이 없으면 아무것도 그리지 않는다', () => {
    expect(html([])).toBe('');
  });

  it('문단', () => expect(html([{ type: 'paragraph', text: '안녕' }])).toContain('<p>안녕</p>'));

  it('제목: level 2 는 h2, level 3 은 h3', () => {
    const out = html([
      { type: 'heading', level: 2, text: '큰' },
      { type: 'heading', level: 3, text: '작' },
    ]);
    expect(out).toContain('<h2>큰</h2>');
    expect(out).toContain('<h3>작</h3>');
  });

  it('목록: 글머리는 ul, 번호는 ol, 항목 순서 유지', () => {
    const out = html([
      { type: 'list', ordered: false, items: ['a', 'b'] },
      { type: 'list', ordered: true, items: ['1', '2'] },
    ]);
    expect(out).toMatch(/<ul[^>]*><li>a<\/li><li>b<\/li><\/ul>/);
    expect(out).toMatch(/<ol[^>]*><li>1<\/li><li>2<\/li><\/ol>/);
  });

  it('인용', () => expect(html([{ type: 'quote', text: '인용문' }])).toContain('<blockquote>인용문</blockquote>'));

  it('콜아웃: 아이콘은 장식(aria-hidden), 없으면 생략', () => {
    expect(html([{ type: 'callout', text: '알림', icon: '📌' }])).toContain('<span aria-hidden="true">📌</span><p>알림</p>');
    expect(html([{ type: 'callout', text: '알림' }])).not.toContain('aria-hidden');
  });

  it('구분선', () => expect(html([{ type: 'divider' }])).toContain('<hr'));

  it('체크리스트: 완료 여부를 보조 텍스트로도 알린다', () => {
    const out = html([
      { type: 'todo', text: '끝', checked: true },
      { type: 'todo', text: '아직', checked: false },
    ]);
    expect(out).toContain('완료: ');
    expect(out).toContain('할 일: ');
    expect(out).toContain('class="nb-todo done"');
  });

  it('이미지: 캡션이 있으면 대체 텍스트와 figcaption', () => {
    const out = html([{ type: 'image', src: 'https://img.example/a.png', caption: '설명' }]);
    expect(out).toContain('src="https://img.example/a.png"');
    expect(out).toContain('alt="설명"');
    expect(out).toContain('<figcaption>설명</figcaption>');
  });

  it('텍스트는 이스케이프된다', () => {
    expect(html([{ type: 'paragraph', text: '<script>x</script>' }])).not.toContain('<script>');
  });

  it('링크는 렌더링하지 않는다: javascript: 주소가 들어 있어도 텍스트로만 남는다', () => {
    const out = html([
      { type: 'paragraph', text: '[누르기](javascript:alert(1))' },
      { type: 'list', ordered: false, items: ['javascript:alert(2)'] },
    ]);
    expect(out).not.toContain('<a');
    expect(out).not.toContain('href=');
    expect(out).toContain('javascript:alert(1)');
  });

  it('linesToBlocks: 줄마다 문단', () => {
    expect(linesToBlocks(['가', '나'])).toEqual([
      { type: 'paragraph', text: '가' },
      { type: 'paragraph', text: '나' },
    ]);
  });
});

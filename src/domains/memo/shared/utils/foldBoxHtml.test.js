// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { buildFoldBoxHtml, BLANK_LINE_HTML } from './foldBoxHtml';

const parse = (html) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
};

describe('buildFoldBoxHtml', () => {
  it('제목을 주면 제목 칸에 그 글자가 들어간다', () => {
    const title = parse(buildFoldBoxHtml('대화 프로필')).querySelector('.fold-title');
    expect(title.textContent).toBe('대화 프로필');
  });

  it('제목을 주지 않으면 빈 제목 칸과 본문 칸이 있는 접기 박스가 된다', () => {
    const root = parse(buildFoldBoxHtml());
    expect(root.querySelector('details[open]')).not.toBeNull();
    expect(root.querySelector('.fold-title').textContent).toBe('');
    expect(root.querySelector('.fold-content')).not.toBeNull();
  });

  it('제목의 꺾쇠와 따옴표는 글자 그대로 들어가고 태그로 해석되지 않는다', () => {
    const root = parse(buildFoldBoxHtml('<b>"a"&b</b>'));
    expect(root.querySelector('.fold-title').textContent).toBe('<b>"a"&b</b>');
    expect(root.querySelector('.fold-title b')).toBeNull();
  });

  it('박스 뒤에는 빈 줄을 붙이지 않는다', () => {
    expect(buildFoldBoxHtml('a').endsWith(BLANK_LINE_HTML)).toBe(false);
  });
});

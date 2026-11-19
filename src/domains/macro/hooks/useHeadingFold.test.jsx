// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import React, { useRef } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { useHeadingFold } from './useHeadingFold';
import { FOLD_ALL_EVENT } from './foldEvents';

const HTML = '<h1>가</h1><div class="md-box"><h2>나</h2><p id="p1">나 본문</p><h3>다</h3><p id="p2">다 본문</p><h2>라</h2><p id="p3">라 본문</p></div>';

const Host = () => {
  const ref = useRef(null);
  useHeadingFold(ref, []);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: HTML }} />;
};

const hidden = (c, id) => c.querySelector(id).style.display === 'none';
const btnOf = (c, tag) => c.querySelector(`${tag} .wiki-fold-btn`);

afterEach(cleanup);

describe('문단 접기', () => {
  it('h2 를 접으면 다음 같은 단계 제목 전까지 숨고 다시 펼치면 보인다', () => {
    const { container } = render(<Host />);
    fireEvent.click(btnOf(container, 'h2'));
    expect(hidden(container, '#p1')).toBe(true);
    expect(hidden(container, '#p2')).toBe(true);
    expect(hidden(container, '#p3')).toBe(false);
    fireEvent.click(btnOf(container, 'h2'));
    expect(hidden(container, '#p1')).toBe(false);
  });

  it('접어 둔 하위 문단(h3)은 상위(h2)를 다시 펼쳐도 접힌 채로 있다', () => {
    const { container } = render(<Host />);
    fireEvent.click(btnOf(container, 'h3'));
    fireEvent.click(btnOf(container, 'h2'));
    fireEvent.click(btnOf(container, 'h2'));
    expect(hidden(container, '#p1')).toBe(false);
    expect(hidden(container, '#p2')).toBe(true);
  });

  it('모두 접기 신호는 모든 제목을 접고, 모두 펼치기 신호는 모두 연다', () => {
    const { container } = render(<Host />);
    window.dispatchEvent(new CustomEvent(FOLD_ALL_EVENT, { detail: { collapsed: true } }));
    expect(container.querySelector('.md-box').style.display).toBe('none');
    expect(container.querySelectorAll('.is-collapsed').length).toBe(4);
    window.dispatchEvent(new CustomEvent(FOLD_ALL_EVENT, { detail: { collapsed: false } }));
    expect(container.querySelector('.md-box').style.display).toBe('');
    expect(hidden(container, '#p2')).toBe(false);
    expect(container.querySelectorAll('.is-collapsed').length).toBe(0);
  });
});

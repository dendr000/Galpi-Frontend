// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 각주: 마우스를 올리면 뜨고, 눌러(터치해) 고정하면 다른 곳을 누르거나 Esc 를 누를 때까지 남는다.
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { useFootnoteTooltip } from './useFootnoteTooltip';

const Host = () => {
  useFootnoteTooltip();
  return (
    <div>
      <sup className="wiki-footnote" data-content="각주 내용">[1]</sup>
      <p id="other">본문</p>
    </div>
  );
};

const tip = () => document.getElementById('wiki-footnote-tooltip');
const shown = () => tip() && tip().style.display === 'block';

afterEach(cleanup);

describe('각주 말풍선', () => {
  it('마우스를 올리면 뜨고 벗어나면 사라진다', () => {
    const { container } = render(<Host />);
    const fn = container.querySelector('.wiki-footnote');
    fireEvent.mouseOver(fn);
    expect(shown()).toBe(true);
    expect(tip().textContent).toBe('각주 내용');
    fireEvent.mouseOut(fn);
    expect(shown()).toBe(false);
  });

  it('눌러서 고정하면 마우스가 벗어나도 남는다', () => {
    const { container } = render(<Host />);
    const fn = container.querySelector('.wiki-footnote');
    fireEvent.mouseOver(fn);
    fireEvent.click(fn);
    fireEvent.mouseOut(fn);
    expect(shown()).toBe(true);
  });

  it('고정한 뒤 다시 누르면 닫힌다', () => {
    const { container } = render(<Host />);
    const fn = container.querySelector('.wiki-footnote');
    fireEvent.click(fn);
    expect(shown()).toBe(true);
    fireEvent.click(fn);
    expect(shown()).toBe(false);
  });

  it('터치처럼 마우스 올림 없이 눌러도 뜬다', () => {
    const { container } = render(<Host />);
    fireEvent.click(container.querySelector('.wiki-footnote'));
    expect(shown()).toBe(true);
  });

  it('다른 곳을 누르거나 Esc 를 누르면 고정이 풀린다', () => {
    const { container } = render(<Host />);
    const fn = container.querySelector('.wiki-footnote');
    fireEvent.click(fn);
    fireEvent.click(container.querySelector('#other'));
    expect(shown()).toBe(false);
    fireEvent.click(fn);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(shown()).toBe(false);
  });
});

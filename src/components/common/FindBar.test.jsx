// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import FindBar, { isElectron } from './FindBar';
import { HIGHLIGHT_ALL, HIGHLIGHT_CURRENT } from './findInPage';

class FakeHighlight { constructor(...ranges) { this.ranges = ranges; } }

beforeEach(() => {
  globalThis.Highlight = FakeHighlight;
  globalThis.CSS = { highlights: new Map() };
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  document.getElementById('page')?.remove();
  delete globalThis.Highlight;
  delete globalThis.CSS;
});

const addPage = (html) => {
  const div = document.createElement('div');
  div.id = 'page';
  div.innerHTML = html;
  document.body.appendChild(div);
};

const setup = (over = {}) => render(<FindBar enabled {...over} />);

const pressCtrlF = (init = {}) => {
  const ev = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true, ...init });
  act(() => { window.dispatchEvent(ev); });
  return ev;
};

const box = () => screen.queryByRole('textbox', { name: '페이지에서 찾기' });
const status = () => screen.getByRole('status').textContent;
const type = (value, init = {}) => fireEvent.input(box(), { target: { value }, ...init });

describe('isElectron', () => {
  it('사용자 에이전트에 Electron 이 들어 있으면 true', () => {
    expect(isElectron('Mozilla/5.0 Chrome/120 Electron/44.3.0 Safari/537')).toBe(true);
    expect(isElectron('Mozilla/5.0 Chrome/120 Safari/537')).toBe(false);
    expect(isElectron(undefined)).toBe(false);
  });
});

describe('FindBar 열기와 닫기', () => {
  it('처음에는 보이지 않는다', () => {
    setup();
    expect(box()).toBeNull();
  });

  it('Ctrl+F 를 누르면 열리고, 기본 동작은 막으며, 입력칸에 포커스가 간다', () => {
    setup();
    const ev = pressCtrlF();
    expect(ev.defaultPrevented).toBe(true);
    expect(box()).not.toBeNull();
    expect(document.activeElement).toBe(box());
  });

  it('Cmd+F(맥)도 같다', () => {
    setup();
    pressCtrlF({ ctrlKey: false, metaKey: true });
    expect(box()).not.toBeNull();
  });

  it('Esc 를 누르면 닫히고 일치 표시도 지워진다', () => {
    addPage('<p>강소라</p>');
    setup();
    pressCtrlF();
    type('강소라');
    expect(CSS.highlights.has(HIGHLIGHT_ALL)).toBe(true);
    fireEvent.keyDown(box(), { key: 'Escape' });
    expect(box()).toBeNull();
    expect(CSS.highlights.size).toBe(0);
  });

  it('닫기 버튼으로도 닫는다', () => {
    setup();
    pressCtrlF();
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(box()).toBeNull();
  });

  it('이미 열려 있을 때 Ctrl+F 를 다시 누르면 입력칸으로 포커스를 돌려준다', () => {
    setup();
    pressCtrlF();
    act(() => { box().blur(); });
    pressCtrlF();
    expect(document.activeElement).toBe(box());
  });

  it('켜지지 않은 환경(enabled=false)에서는 아무것도 하지 않고 기본 찾기를 막지 않는다', () => {
    render(<FindBar enabled={false} />);
    const ev = pressCtrlF();
    expect(ev.defaultPrevented).toBe(false);
    expect(box()).toBeNull();
  });

  it('이미 다른 곳(에디터 검색 등)이 Ctrl+F 를 처리했으면 열지 않는다', () => {
    setup();
    const handler = (e) => e.preventDefault();
    document.addEventListener('keydown', handler, true);
    act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }));
    });
    document.removeEventListener('keydown', handler, true);
    expect(box()).toBeNull();
  });

  it('선택해 둔 짧은 글자는 입력칸에 미리 채우고 바로 찾는다', () => {
    addPage('<p id="t">릴리와 레온</p>');
    setup();
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('t'));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    pressCtrlF();
    expect(box().value).toBe('릴리와 레온');
    expect(status()).toBe('1 / 1');
  });
});

describe('FindBar 찾기', () => {
  const open = () => { pressCtrlF(); return box(); };

  it('입력하는 대로 찾고 "현재 / 전체"를 보여 준다', () => {
    addPage('<p>가나가다가</p>');
    setup();
    open();
    type('가');
    expect(status()).toBe('1 / 3');
  });

  it('한 글자짜리 한글(라, 소)도 바로 찾는다', () => {
    addPage('<p>강소라 그리고 라온</p>');
    setup();
    open();
    type('라');
    expect(status()).toBe('1 / 2');
    type('소');
    expect(status()).toBe('1 / 1');
  });

  it('"강소라"를 한 글자씩 조합하며 입력해도 입력칸은 포커스를 유지하고 매번 찾는다', () => {
    addPage('<p>강소라가 왔다</p>');
    setup();
    open();
    for (const typed of ['ㄱ', '가', '강', '강ㅅ', '강소', '강소ㄹ', '강소라']) {
      type(typed, { isComposing: true });
      expect(document.activeElement).toBe(box());
    }
    expect(box().value).toBe('강소라');
    expect(status()).toBe('1 / 1');
  });

  it('조합 중 자모만 있는 값은 못 찾아도 오류 없이 "찾는 글자가 없습니다"', () => {
    addPage('<p>강소라</p>');
    setup();
    open();
    type('ㄱ', { isComposing: true });
    expect(status()).toBe('찾는 글자가 없습니다');
  });

  it('찾은 위치로 스크롤하고, 모든 일치와 현재 일치를 표시한다', () => {
    addPage('<p>가</p><p>가</p>');
    setup();
    open();
    type('가');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(CSS.highlights.get(HIGHLIGHT_ALL).ranges).toHaveLength(2);
    expect(CSS.highlights.get(HIGHLIGHT_CURRENT).ranges).toHaveLength(1);
  });

  it('Enter 는 다음, Shift+Enter 는 이전(끝에서 처음으로 돌아감)', () => {
    addPage('<p>가</p><p>가</p><p>가</p>');
    setup();
    open();
    type('가');
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(status()).toBe('2 / 3');
    fireEvent.keyDown(box(), { key: 'Enter' });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(status()).toBe('1 / 3');
    fireEvent.keyDown(box(), { key: 'Enter', shiftKey: true });
    expect(status()).toBe('3 / 3');
  });

  it('F3, Shift+F3 와 이전, 다음 버튼도 같다', () => {
    addPage('<p>가</p><p>가</p>');
    setup();
    open();
    type('가');
    fireEvent.keyDown(box(), { key: 'F3' });
    expect(status()).toBe('2 / 2');
    fireEvent.keyDown(box(), { key: 'F3', shiftKey: true });
    expect(status()).toBe('1 / 2');
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(status()).toBe('2 / 2');
    fireEvent.click(screen.getByRole('button', { name: '이전' }));
    expect(status()).toBe('1 / 2');
  });

  it('현재 일치가 바뀌면 현재 표시도 따라 바뀐다', () => {
    addPage('<p>가</p><p>가</p>');
    setup();
    open();
    type('가');
    const first = CSS.highlights.get(HIGHLIGHT_CURRENT).ranges[0];
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(CSS.highlights.get(HIGHLIGHT_CURRENT).ranges[0]).not.toBe(first);
  });

  it('입력이 비면 안내도 표시도 없다', () => {
    addPage('<p>가</p>');
    setup();
    open();
    type('가');
    type('');
    expect(status()).toBe('');
    expect(CSS.highlights.size).toBe(0);
  });

  it('찾지 못하면 안내를 보여 주고 Enter 를 눌러도 오류가 없다', () => {
    addPage('<p>강소라</p>');
    setup();
    open();
    type('없는말');
    expect(status()).toBe('찾는 글자가 없습니다');
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(status()).toBe('찾는 글자가 없습니다');
  });

  it('한글 조합 중의 Enter 는 다음 찾기로 보지 않는다', () => {
    addPage('<p>가</p><p>가</p>');
    setup();
    open();
    type('가');
    fireEvent.keyDown(box(), { key: 'Enter', isComposing: true });
    expect(status()).toBe('1 / 2');
  });

  it('찾기창 자신의 글자는 찾지 않는다', () => {
    addPage('<p>본문</p>');
    setup();
    open();
    type('이전');
    expect(status()).toBe('찾는 글자가 없습니다');
  });

  it('대소문자를 구분하지 않는다', () => {
    addPage('<p>Hello</p>');
    setup();
    open();
    type('HELLO');
    expect(status()).toBe('1 / 1');
  });

  it('찾는 동안 입력칸의 포커스와 문서 선택을 건드리지 않는다', () => {
    addPage('<p>강소라</p>');
    setup();
    open();
    type('강소라');
    expect(document.activeElement).toBe(box());
    expect(window.getSelection().toString()).toBe('');
  });
});

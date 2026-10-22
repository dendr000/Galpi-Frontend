// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import FindBar, { isElectron } from './FindBar';

afterEach(cleanup);

const setup = (over = {}) => {
  const find = vi.fn(() => true);
  render(<FindBar enabled find={find} {...over} />);
  return { find };
};

const pressCtrlF = (init = {}) => {
  const ev = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true, ...init });
  act(() => { window.dispatchEvent(ev); });
  return ev;
};

const box = () => screen.queryByRole('textbox', { name: '페이지에서 찾기' });

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

  it('Esc 를 누르면 닫힌다', () => {
    setup();
    pressCtrlF();
    fireEvent.keyDown(box(), { key: 'Escape' });
    expect(box()).toBeNull();
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
    act(() => { document.body.focus(); box().blur(); });
    pressCtrlF();
    expect(document.activeElement).toBe(box());
  });

  it('켜지지 않은 환경(enabled=false)에서는 아무것도 하지 않고 기본 찾기를 막지 않는다', () => {
    render(<FindBar enabled={false} find={vi.fn()} />);
    const ev = pressCtrlF();
    expect(ev.defaultPrevented).toBe(false);
    expect(box()).toBeNull();
  });

  it('이미 다른 곳(에디터 검색 등)이 Ctrl+F 를 처리했으면 열지 않는다', () => {
    setup();
    const handler = (e) => e.preventDefault(); // 에디터 검색은 문서의 캡처 단계에서 먼저 처리한다
    document.addEventListener('keydown', handler, true);
    act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }));
    });
    document.removeEventListener('keydown', handler, true);
    expect(box()).toBeNull();
  });

  it('선택해 둔 글자가 짧으면 입력칸에 미리 채운다', () => {
    setup();
    const p = document.createElement('p');
    p.textContent = '릴리';
    document.body.appendChild(p);
    const range = document.createRange();
    range.selectNodeContents(p);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    pressCtrlF();
    expect(box().value).toBe('릴리');
    p.remove();
  });
});

describe('FindBar 찾기', () => {
  const open = (find) => { pressCtrlF(); return box(); };

  it('Enter 는 다음 찾기: find(글자, 대소문자 구분 안 함, 앞으로, 처음부터 다시)', () => {
    const { find } = setup();
    const input = open();
    fireEvent.change(input, { target: { value: '레온' } });
    find.mockClear();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(find).toHaveBeenCalledWith('레온', false, false, true);
  });

  it('Shift+Enter 는 이전 찾기(뒤로)', () => {
    const { find } = setup();
    const input = open();
    fireEvent.change(input, { target: { value: '레온' } });
    find.mockClear();
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(find).toHaveBeenCalledWith('레온', false, true, true);
  });

  it('F3, Shift+F3 도 다음, 이전 찾기로 쓴다', () => {
    const { find } = setup();
    const input = open();
    fireEvent.change(input, { target: { value: 'a' } });
    find.mockClear();
    fireEvent.keyDown(input, { key: 'F3' });
    fireEvent.keyDown(input, { key: 'F3', shiftKey: true });
    expect(find.mock.calls).toEqual([['a', false, false, true], ['a', false, true, true]]);
  });

  it('글자를 입력하면 바로 찾는다(입력하는 대로 찾기)', () => {
    const { find } = setup();
    const input = open();
    fireEvent.change(input, { target: { value: '레' } });
    expect(find).toHaveBeenCalledWith('레', false, false, true);
  });

  it('입력이 비면 찾지 않는다. 빈 칸에서 Enter 를 눌러도 찾지 않는다', () => {
    const { find } = setup();
    const input = open();
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: '레' } });
    find.mockClear();
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(find).not.toHaveBeenCalled();
  });

  it('한글 조합 중(IME)의 Enter 는 찾기로 보지 않는다', () => {
    const { find } = setup();
    const input = open();
    fireEvent.change(input, { target: { value: '레' } });
    find.mockClear();
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(find).not.toHaveBeenCalled();
  });

  it('찾지 못하면 안내를 보여 주고, 찾으면 안내를 지운다', () => {
    const find = vi.fn(() => false);
    setup({ find });
    const input = open();
    fireEvent.change(input, { target: { value: '없는말' } });
    expect(screen.getByRole('status').textContent).toContain('찾는 글자가 없습니다');
    find.mockReturnValue(true);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('status').textContent).not.toContain('찾는 글자가 없습니다');
  });

  it('찾는 동안에는 찾기창을 숨겨 입력칸 자신이 검색에 걸리지 않게 하고, 끝나면 되돌려 입력칸에 포커스를 돌려준다', () => {
    const seen = [];
    const find = vi.fn(() => {
      seen.push(document.querySelector('[role=search]').style.display);
      return true;
    });
    setup({ find });
    const input = open();
    fireEvent.change(input, { target: { value: '레온' } });
    expect(seen).toEqual(['none']);
    expect(document.querySelector('[role=search]').style.display).toBe('flex');
    expect(document.activeElement).toBe(box());
  });

  it('이전, 다음 버튼으로도 찾는다', () => {
    const { find } = setup();
    const input = open();
    fireEvent.change(input, { target: { value: 'x' } });
    find.mockClear();
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.click(screen.getByRole('button', { name: '이전' }));
    expect(find.mock.calls).toEqual([['x', false, false, true], ['x', false, true, true]]);
  });

  it('입력하는 대로 찾을 때는 현재 선택을 앞쪽으로 접어 같은 위치에서 다시 찾는다(한 글자씩 늘려도 건너뛰지 않음)', () => {
    const { find } = setup();
    const p = document.createElement('p');
    p.textContent = '레온 폰';
    document.body.appendChild(p);
    const range = document.createRange();
    range.selectNodeContents(p);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    const input = open();
    // open 이 선택을 입력칸에 채웠다. 선택은 아직 문서에 있다.
    const sel = window.getSelection();
    const spy = vi.spyOn(sel, 'collapseToStart');
    fireEvent.change(input, { target: { value: '레온' } });
    expect(spy).toHaveBeenCalled();
    expect(find).toHaveBeenCalled();
    p.remove();
  });
});

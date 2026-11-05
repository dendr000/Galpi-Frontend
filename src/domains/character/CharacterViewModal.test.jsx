// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 큰 창: 왼쪽 본문, 오른쪽 인포박스, 방향키 이동, Esc 닫기.
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import CharacterViewModal from './CharacterViewModal';

afterEach(cleanup);

const CHARS = [
  { id: 1, name: '릴리' },
  { id: 2, name: '레온' },
  { id: 3, name: '세라' },
];

const setup = (over = {}) => {
  const props = {
    chars: CHARS, activeId: 2, onSelect: vi.fn(), onClose: vi.fn(),
    renderBody: (c) => <div data-testid="body">{c.name} 본문</div>,
    renderInfobox: (c) => <div data-testid="info">{c.name} 인포</div>,
    ...over,
  };
  return { props, ...render(<CharacterViewModal {...props} />) };
};

const key = (k, init = {}, target = window) => fireEvent.keyDown(target, { key: k, ...init });

describe('CharacterViewModal 표시', () => {
  it('선택된 캐릭터의 본문과 인포박스, 이름, 순번을 보여 준다', () => {
    setup();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByTestId('body').textContent).toBe('레온 본문');
    expect(screen.getByTestId('info').textContent).toBe('레온 인포');
    expect(screen.getByText('2 / 3')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '레온' })).toBeTruthy();
  });

  it('목록에 없는 id 면 아무것도 그리지 않는다', () => {
    setup({ activeId: 99 });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('목차 스캔이 건너뛸 수 있게 큰 창 표시(data-char-modal)가 붙어 있다', () => {
    setup();
    expect(screen.getByTestId('char-view-backdrop').hasAttribute('data-char-modal')).toBe(true);
  });

  it('열려 있는 동안 페이지 스크롤을 잠그고, 닫히면(제거되면) 되돌린다', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = setup();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });
});

describe('CharacterViewModal 이전/다음', () => {
  it('오른쪽 방향키는 다음, 왼쪽 방향키는 이전 캐릭터로 넘긴다', () => {
    const { props } = setup();
    key('ArrowRight');
    expect(props.onSelect).toHaveBeenLastCalledWith(3);
    key('ArrowLeft');
    expect(props.onSelect).toHaveBeenLastCalledWith(1);
  });

  it('버튼으로도 넘긴다', () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole('button', { name: '다음 캐릭터' }));
    expect(props.onSelect).toHaveBeenLastCalledWith(3);
    fireEvent.click(screen.getByRole('button', { name: '이전 캐릭터' }));
    expect(props.onSelect).toHaveBeenLastCalledWith(1);
  });

  it('처음에서 이전, 끝에서 다음은 멈춘다(돌아가지 않는다)', () => {
    const first = setup({ activeId: 1 });
    key('ArrowLeft');
    expect(first.props.onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '이전 캐릭터' }).disabled).toBe(true);
    cleanup();
    const last = setup({ activeId: 3 });
    key('ArrowRight');
    expect(last.props.onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '다음 캐릭터' }).disabled).toBe(true);
  });

  it('캐릭터가 하나뿐이면 1 / 1 이고 넘기기 버튼이 모두 꺼져 있다', () => {
    const { props } = setup({ chars: [CHARS[0]], activeId: 1 });
    expect(screen.getByText('1 / 1')).toBeTruthy();
    key('ArrowRight'); key('ArrowLeft');
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('입력칸에 포커스가 있으면 방향키를 가로채지 않는다', () => {
    const { props } = setup({ renderBody: () => <input data-testid="field" /> });
    key('ArrowRight', {}, screen.getByTestId('field'));
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('textarea 와 편집 가능한 영역에서도 가로채지 않는다', () => {
    const { props } = setup({ renderBody: () => (<div><textarea data-testid="ta" /><div data-testid="ce" contentEditable suppressContentEditableWarning /></div>) });
    key('ArrowRight', {}, screen.getByTestId('ta'));
    const ce = screen.getByTestId('ce');
    Object.defineProperty(ce, 'isContentEditable', { value: true });
    key('ArrowLeft', {}, ce);
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('글자 조합 중(IME)이거나 Ctrl/Alt/Shift/Meta 가 눌려 있으면 무시한다', () => {
    const { props } = setup();
    key('ArrowRight', { isComposing: true });
    key('ArrowRight', { ctrlKey: true });
    key('ArrowRight', { altKey: true });
    key('ArrowRight', { shiftKey: true });
    key('ArrowRight', { metaKey: true });
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('이미 다른 곳에서 처리한 키(defaultPrevented)는 무시한다', () => {
    const { props } = setup();
    const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true, bubbles: true });
    ev.preventDefault();
    window.dispatchEvent(ev);
    expect(props.onSelect).not.toHaveBeenCalled();
  });
});

describe('CharacterViewModal 닫기', () => {
  it('Esc 로 닫는다', () => {
    const { props } = setup();
    key('Escape');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('IME 조합 중 Esc 나 이미 처리된 Esc 는 닫지 않는다', () => {
    const { props } = setup();
    key('Escape', { isComposing: true });
    const ev = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
    ev.preventDefault();
    window.dispatchEvent(ev);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('닫기 버튼과 바깥(어두운 배경) 누르기로 닫는다', () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(screen.getByTestId('char-view-backdrop'));
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it('창 안쪽을 누르거나 글자를 드래그해 선택하는 동작으로는 닫지 않는다', () => {
    const { props } = setup();
    fireEvent.mouseDown(screen.getByTestId('body'));
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('닫힌 뒤(제거 뒤)에는 키 입력에 반응하지 않는다', () => {
    const { props, unmount } = setup();
    unmount();
    key('Escape'); key('ArrowRight');
    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onSelect).not.toHaveBeenCalled();
  });
});

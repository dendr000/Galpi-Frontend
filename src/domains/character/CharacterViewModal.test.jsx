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

describe('CharacterViewModal 주변 캐릭터 띠', () => {
  const strip = () => screen.getByRole('navigation', { name: '주변 캐릭터' });
  const chip = (name) => Array.from(strip().querySelectorAll('button')).find((b) => b.textContent.includes(name));

  it('모든 캐릭터를 이미지와 이름으로 보여 주고, 지금 보는 캐릭터에 표시한다', () => {
    setup({ getThumbSrc: (c) => `/img/${c.id}.png` });
    expect(strip().querySelectorAll('button')).toHaveLength(3);
    expect(chip('레온').getAttribute('aria-current')).toBe('true');
    expect(chip('릴리').getAttribute('aria-current')).toBeNull();
    expect(chip('세라').querySelector('img').getAttribute('src')).toBe('/img/3.png');
  });

  it('누르면 그 캐릭터로 넘어간다', () => {
    const { props } = setup();
    fireEvent.click(chip('세라'));
    expect(props.onSelect).toHaveBeenCalledWith(3);
  });

  it('이미지를 못 불러오면 이미지를 숨기고 이름의 첫 글자를 대신 보여 준다', () => {
    setup({ getThumbSrc: (c) => `/img/${c.id}.png` });
    const img = chip('릴리').querySelector('img');
    fireEvent.error(img);
    expect(chip('릴리').querySelector('img')).toBeNull();
    expect(chip('릴리').querySelector('[data-thumb-fallback]').textContent).toBe('릴');
  });

  it('이미지 주소를 주지 않으면 처음부터 첫 글자로 보여 준다', () => {
    setup();
    expect(chip('레온').querySelector('img')).toBeNull();
    expect(chip('레온').querySelector('[data-thumb-fallback]').textContent).toBe('레');
  });
});

describe('CharacterViewModal 캐릭터 검색', () => {
  const box = () => screen.getByRole('combobox', { name: '캐릭터 검색' });
  const type = (v) => fireEvent.change(box(), { target: { value: v } });
  const options = () => screen.queryAllByRole('option');

  it('입력하면 이름이 맞는 캐릭터가 목록으로 나온다', () => {
    setup();
    type('레');
    expect(options().map((o) => o.textContent)).toEqual(['레온']);
  });

  it('일치하는 캐릭터가 없으면 안내 문구', () => {
    setup();
    type('없는이름');
    expect(options()).toHaveLength(0);
    expect(screen.getByText('일치하는 캐릭터가 없습니다')).toBeTruthy();
  });

  it('Enter 는 첫 결과로 이동하고 입력과 목록을 비운다', () => {
    const { props } = setup({ chars: [...CHARS, { id: 4, name: '레나' }] });
    type('레');
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(props.onSelect).toHaveBeenCalledWith(2);
    expect(box().value).toBe('');
    expect(options()).toHaveLength(0);
  });

  it('아래, 위 화살표로 고르고 Enter 로 이동한다', () => {
    const { props } = setup({ chars: [...CHARS, { id: 4, name: '레나' }] });
    type('레');
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(options()[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(options()[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(box(), { key: 'ArrowUp' });
    fireEvent.keyDown(box(), { key: 'ArrowUp' });
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(props.onSelect).toHaveBeenCalledWith(4);
  });

  it('한글 조합 중의 Enter 는 이동하지 않는다', () => {
    const { props } = setup();
    type('레');
    fireEvent.keyDown(box(), { key: 'Enter', isComposing: true });
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('결과를 눌러도 이동한다', () => {
    const { props } = setup();
    type('세');
    fireEvent.mouseDown(options()[0]);
    expect(props.onSelect).toHaveBeenCalledWith(3);
  });

  it('입력칸의 Esc 는 입력부터 지우고, 비어 있을 때의 Esc 는 큰 창을 닫는다', () => {
    const { props } = setup();
    type('레');
    fireEvent.keyDown(box(), { key: 'Escape' });
    expect(box().value).toBe('');
    expect(props.onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(box(), { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('입력칸 안의 좌우 방향키는 커서 이동이라 캐릭터를 넘기지 않는다', () => {
    const { props } = setup();
    type('레');
    fireEvent.keyDown(box(), { key: 'ArrowRight' });
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('결과 상자의 빈 곳을 눌러도 입력칸이 포커스를 잃지 않는다(검색어가 안 지워진다)', () => {
    setup();
    box().focus();
    type('없는이름');
    const notPrevented = fireEvent.mouseDown(screen.getByText('일치하는 캐릭터가 없습니다'));
    expect(notPrevented).toBe(false);
  });

  it('입력칸이 아닌 곳에서 / 를 누르면 검색 입력칸으로 커서가 간다', () => {
    setup();
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(box());
  });

  it('조합 중이거나 보조키와 함께 누른 / 는 무시한다', () => {
    setup();
    fireEvent.keyDown(window, { key: '/', isComposing: true });
    fireEvent.keyDown(window, { key: '/', ctrlKey: true });
    expect(document.activeElement).not.toBe(box());
  });

  it('입력칸에 커서가 있을 때 / 는 글자로 입력된다(가로채지 않는다)', () => {
    setup();
    box().focus();
    const ev = new KeyboardEvent('keydown', { key: '/', cancelable: true, bubbles: true });
    box().dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });
});

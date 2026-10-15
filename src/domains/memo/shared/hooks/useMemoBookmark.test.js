// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemoBookmark } from './useMemoBookmark';

let editor;
let textNode;

// 에디터 본문 "앞뒤" 중 offset 위치에 커서를 둔다.
const placeCaret = (offset) => {
  const range = document.createRange();
  range.setStart(textNode, offset);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

beforeEach(() => {
  editor = document.createElement('div');
  editor.contentEditable = 'true';
  textNode = document.createTextNode('앞뒤');
  editor.appendChild(textNode);
  document.body.appendChild(editor);
  document.execCommand = vi.fn();
  // Electron(exe)처럼 window.prompt 는 쓸 수 없다.
  vi.spyOn(window, 'prompt').mockImplementation(() => { throw new Error('prompt() is not supported.'); });
});
afterEach(() => {
  editor.remove();
  delete window.openTextPromptModal;
  delete document.execCommand;
  vi.restoreAllMocks();
});

const setup = () => {
  const props = { editorRef: { current: editor }, updateCharCount: vi.fn(), saveMemo: undefined };
  return { props, ...renderHook(() => useMemoBookmark(props)) };
};

describe('useMemoBookmark.insertBookmark - 입력 모달 사용', () => {
  it('입력 모달에서 받은 이름으로 책갈피를 삽입한다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve(' 1장 시작 '));
    placeCaret(1);
    const { result } = setup();
    await act(() => result.current.insertBookmark());
    expect(document.execCommand).toHaveBeenCalledTimes(1);
    const [cmd, , html] = document.execCommand.mock.calls[0];
    expect(cmd).toBe('insertHTML');
    expect(html).toContain('class="galpi-bookmark"');
    expect(html).toContain('1장 시작');
    expect(html).toContain('id="bm_1장_시작_');
  });

  it('입력 창이 떠서 커서가 옮겨갔어도 처음 커서 위치에 삽입한다', async () => {
    placeCaret(1);
    // 모달의 입력칸에 포커스가 가면서 에디터의 선택 영역이 사라지는 상황을 흉내 낸다.
    window.openTextPromptModal = vi.fn(() => {
      window.getSelection().removeAllRanges();
      return Promise.resolve('책갈피');
    });
    let rangeAtInsert = null;
    document.execCommand = vi.fn(() => {
      const sel = window.getSelection();
      rangeAtInsert = sel.rangeCount ? sel.getRangeAt(0) : null;
    });
    const { result } = setup();
    await act(() => result.current.insertBookmark());
    expect(rangeAtInsert).not.toBeNull();
    expect(rangeAtInsert.startContainer).toBe(textNode);
    expect(rangeAtInsert.startOffset).toBe(1);
  });

  it('취소하거나 빈 이름이면 아무것도 삽입하지 않는다', async () => {
    placeCaret(0);
    const { result } = setup();
    window.openTextPromptModal = vi.fn(() => Promise.resolve(null));
    await act(() => result.current.insertBookmark());
    window.openTextPromptModal = vi.fn(() => Promise.resolve('   '));
    await act(() => result.current.insertBookmark());
    expect(document.execCommand).not.toHaveBeenCalled();
  });
});

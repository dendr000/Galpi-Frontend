// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowWidth } from './useWindowWidth';

const original = window.innerWidth;
const setWidth = (w) => { window.innerWidth = w; window.dispatchEvent(new Event('resize')); };
afterEach(() => { window.innerWidth = original; });

describe('useWindowWidth', () => {
  it('처음에는 현재 창 폭을 돌려준다', () => {
    window.innerWidth = 1700;
    const { result } = renderHook(() => useWindowWidth());
    expect(result.current).toBe(1700);
  });

  it('창 크기가 바뀌면 새 폭으로 갱신된다', () => {
    window.innerWidth = 1700;
    const { result } = renderHook(() => useWindowWidth());
    act(() => setWidth(900));
    expect(result.current).toBe(900);
  });

  it('언마운트하면 resize 리스너를 해제한다(누수 방지)', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowWidth());
    const added = add.mock.calls.filter(([type]) => type === 'resize').map(([, fn]) => fn);
    expect(added.length).toBe(1);
    unmount();
    const removed = remove.mock.calls.filter(([type]) => type === 'resize').map(([, fn]) => fn);
    expect(removed).toEqual(added);
    add.mockRestore();
    remove.mockRestore();
  });
});

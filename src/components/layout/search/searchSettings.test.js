// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getIncludeHidden, setIncludeHidden, SEARCH_INCLUDE_HIDDEN_KEY, SEARCH_SETTINGS_EVENT } from './searchSettings';

beforeEach(() => {
  localStorage.clear();
});

describe('searchSettings', () => {
  it('저장된 값이 없으면 기본은 포함(true)', () => {
    expect(getIncludeHidden()).toBe(true);
  });

  it('false로 저장하면 false로 읽힌다', () => {
    setIncludeHidden(false);
    expect(localStorage.getItem(SEARCH_INCLUDE_HIDDEN_KEY)).toBe('false');
    expect(getIncludeHidden()).toBe(false);
  });

  it('true로 되돌리면 true', () => {
    setIncludeHidden(false);
    setIncludeHidden(true);
    expect(getIncludeHidden()).toBe(true);
  });

  it("'false'가 아닌 이상한 값은 포함(true)으로 취급한다", () => {
    localStorage.setItem(SEARCH_INCLUDE_HIDDEN_KEY, 'abc');
    expect(getIncludeHidden()).toBe(true);
  });

  it('값을 바꾸면 설정 변경 이벤트를 보낸다', () => {
    const handler = vi.fn();
    window.addEventListener(SEARCH_SETTINGS_EVENT, handler);
    setIncludeHidden(false);
    setIncludeHidden(true);
    expect(handler).toHaveBeenCalledTimes(2);
    window.removeEventListener(SEARCH_SETTINGS_EVENT, handler);
  });

  it('localStorage가 막혀 있어도 오류 없이 동작하고 이벤트는 보낸다', () => {
    const handler = vi.fn();
    window.addEventListener(SEARCH_SETTINGS_EVENT, handler);
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => setIncludeHidden(false)).not.toThrow();
    expect(getIncludeHidden()).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    setSpy.mockRestore();
    getSpy.mockRestore();
    window.removeEventListener(SEARCH_SETTINGS_EVENT, handler);
  });
});

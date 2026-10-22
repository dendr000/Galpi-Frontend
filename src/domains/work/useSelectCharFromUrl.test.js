// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelectCharFromUrl } from './useSelectCharFromUrl';

const chars = [{ id: 1, name: '릴리' }, { id: 2, name: '레온' }];

beforeEach(() => {
  vi.useFakeTimers();
  Element.prototype.scrollIntoView = vi.fn();
  document.body.innerHTML = '<div id="char-card-2"></div>';
});
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

const setup = (initial) => {
  const setActiveCharId = vi.fn();
  const hook = renderHook((p) => useSelectCharFromUrl({ setActiveCharId, ...p }), { initialProps: initial });
  return { setActiveCharId, ...hook };
};

describe('useSelectCharFromUrl', () => {
  it('주소의 charId 캐릭터를 선택하고 카드로 스크롤한다', () => {
    const { setActiveCharId } = setup({ loading: false, charIdParam: '2', characters: chars });
    expect(setActiveCharId).toHaveBeenCalledWith(2);
    vi.advanceTimersByTime(600);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('데이터를 불러오는 중에는 아무것도 하지 않는다', () => {
    const { setActiveCharId } = setup({ loading: true, charIdParam: '2', characters: chars });
    expect(setActiveCharId).not.toHaveBeenCalled();
  });

  it('charId 가 없거나 없는 캐릭터면 아무것도 하지 않는다', () => {
    expect(setup({ loading: false, charIdParam: null, characters: chars }).setActiveCharId).not.toHaveBeenCalled();
    expect(setup({ loading: false, charIdParam: '99', characters: chars }).setActiveCharId).not.toHaveBeenCalled();
  });

  it('같은 charId 로 다시 렌더링돼도 한 번만 선택한다(사용자가 다른 카드를 고른 뒤 되돌려지지 않음)', () => {
    const { setActiveCharId, rerender } = setup({ loading: false, charIdParam: '2', characters: chars });
    rerender({ loading: false, charIdParam: '2', characters: [...chars] });
    expect(setActiveCharId).toHaveBeenCalledTimes(1);
  });

  it('스크롤 대기 중에 캐릭터 목록이 갱신돼도 스크롤은 한 번 일어난다', () => {
    const { rerender } = setup({ loading: false, charIdParam: '2', characters: chars });
    rerender({ loading: false, charIdParam: '2', characters: [...chars] });
    vi.advanceTimersByTime(600);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('주소에서 charId 가 없어졌다가 같은 값으로 다시 오면 다시 선택한다', () => {
    const { setActiveCharId, rerender } = setup({ loading: false, charIdParam: '2', characters: chars });
    rerender({ loading: false, charIdParam: null, characters: chars });
    rerender({ loading: false, charIdParam: '2', characters: chars });
    expect(setActiveCharId).toHaveBeenCalledTimes(2);
  });

  it('데이터가 나중에 도착해도(처음엔 빈 목록) 그때 선택한다', () => {
    const { setActiveCharId, rerender } = setup({ loading: false, charIdParam: '1', characters: [] });
    expect(setActiveCharId).not.toHaveBeenCalled();
    rerender({ loading: false, charIdParam: '1', characters: chars });
    expect(setActiveCharId).toHaveBeenCalledWith(1);
  });
});

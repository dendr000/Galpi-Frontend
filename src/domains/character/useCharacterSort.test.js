// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacterSort } from './useCharacterSort';

beforeEach(() => localStorage.clear());

describe('useCharacterSort', () => {
  it('처음에는 정렬을 쓰지 않는다(수동 순서)', () => {
    const { result } = renderHook(() => useCharacterSort('91'));
    expect(result.current.sortKey).toBe('');
    expect(result.current.sortDir).toBe('asc');
  });

  it('고른 정렬을 작품별로 저장하고 다시 열면 복원한다', () => {
    const first = renderHook(() => useCharacterSort('91'));
    act(() => first.result.current.setSort('서열', 'desc'));
    expect(first.result.current.sortKey).toBe('서열');
    expect(first.result.current.sortDir).toBe('desc');
    first.unmount();

    const again = renderHook(() => useCharacterSort('91'));
    expect(again.result.current.sortKey).toBe('서열');
    expect(again.result.current.sortDir).toBe('desc');
  });

  it('다른 작품에는 영향을 주지 않는다', () => {
    const a = renderHook(() => useCharacterSort('1'));
    act(() => a.result.current.setSort('나이', 'asc'));
    const b = renderHook(() => useCharacterSort('2'));
    expect(b.result.current.sortKey).toBe('');
  });

  it('수동 순서로 되돌리면(빈 키) 저장된 정렬도 지운다', () => {
    const { result, unmount } = renderHook(() => useCharacterSort('91'));
    act(() => result.current.setSort('서열', 'asc'));
    act(() => result.current.setSort('', 'asc'));
    expect(result.current.sortKey).toBe('');
    unmount();
    expect(renderHook(() => useCharacterSort('91')).result.current.sortKey).toBe('');
  });

  it('저장된 값이 깨져 있어도 수동 순서로 시작한다', () => {
    localStorage.setItem('galpi-char-sort-91', '{not json');
    expect(renderHook(() => useCharacterSort('91')).result.current.sortKey).toBe('');
  });

  it('방향이 asc, desc 가 아니면 asc 로 본다', () => {
    localStorage.setItem('galpi-char-sort-91', JSON.stringify({ key: '서열', dir: 'sideways' }));
    expect(renderHook(() => useCharacterSort('91')).result.current.sortDir).toBe('asc');
  });
});

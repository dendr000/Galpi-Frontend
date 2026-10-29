// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 카드 드래그로 그룹 안 순서를 바꿀 때, 그룹에 속한 캐릭터를 화면과 같은 기준으로 고르는지.
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const apiMock = vi.hoisted(() => ({ put: vi.fn(() => Promise.resolve({})) }));
vi.mock('../../api/axiosCore', () => ({ default: apiMock }));

import { useCharacterDrag } from './useCharacterDrag';

const chars = () => [
  { id: 1, name: 'a', 소속: '북부, 사교', sortOrder: 0 },
  { id: 2, name: 'b', 소속: '사교', sortOrder: 1 },
  { id: 3, name: 'c', 소속: '북부', sortOrder: 2 },
];

// 같은 그룹 안에서 from 카드를 to 카드 앞으로 끌었을 때 setCharacters 에 넘어간 갱신 함수를 적용한 결과
const dragResult = (criteria, mode, groupName, fromId, toId, initial = chars()) => {
  let next = initial;
  const setCharacters = (fn) => { next = typeof fn === 'function' ? fn(next) : fn; };
  const { result } = renderHook(() => useCharacterDrag(initial, setCharacters, criteria, mode));
  const from = initial.find((c) => c.id === fromId);
  const to = initial.find((c) => c.id === toId);
  const startEv = { dataTransfer: { setData: () => {}, effectAllowed: '' }, target: { style: {} } };
  act(() => { result.current.handleCharDragStart(startEv, from, groupName); });
  const overEv = { preventDefault: () => {}, clientX: 0, currentTarget: { getBoundingClientRect: () => ({ left: 100, width: 100 }) } };
  act(() => { result.current.handleCharDragOver(overEv, to, groupName); });
  return next;
};

describe('useCharacterDrag 그룹 구성원', () => {
  it('모든 값의 그룹에 보이는 모드(all): 사교 그룹의 a, b 순서가 바뀐다', () => {
    const after = dragResult('소속', 'all', '사교', 2, 1);
    expect(JSON.parse(after.find((c) => c.id === 2).dynamicProperties)._groupSortOrders['사교']).toBe(0);
    expect(JSON.parse(after.find((c) => c.id === 1).dynamicProperties)._groupSortOrders['사교']).toBe(1);
  });

  it('첫 번째 값만 보이는 모드(first): 화면에 없는 캐릭터(a 는 사교에 안 보임)의 순서는 건드리지 않는다', () => {
    // first 모드에서 사교 그룹에는 b 하나뿐이라 끌 수 있는 것이 없다
    const initial = chars();
    const after = dragResult('소속', 'first', '사교', 2, 1, initial);
    expect(after).toBe(initial);
  });

  it('first 모드의 북부 그룹은 a, c 만 구성원이다', () => {
    const after = dragResult('소속', 'first', '북부', 3, 1);
    const orders = (id) => JSON.parse(after.find((c) => c.id === id).dynamicProperties || '{}')._groupSortOrders?.['북부'];
    expect(orders(3)).toBe(0);
    expect(orders(1)).toBe(1);
    expect(after.find((c) => c.id === 2).dynamicProperties).toBeUndefined();
  });

  it('직책 같은 다른 속성으로 묶은 그룹에서도 끌어서 순서를 바꾼다', () => {
    const initial = [
      { id: 1, name: 'a', 직책: '기사', sortOrder: 0 },
      { id: 2, name: 'b', 직책: '기사', sortOrder: 1 },
    ];
    const after = dragResult('직책', 'all', '기사', 2, 1, initial);
    expect(JSON.parse(after.find((c) => c.id === 2).dynamicProperties)._groupSortOrders['기사']).toBe(0);
  });
});

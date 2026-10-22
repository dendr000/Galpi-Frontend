// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { isClassified } from './classified';
import { useClassifiedMask } from './useClassifiedMask';

describe('isClassified', () => {
  it('기밀 속성에 값이 있으면 기밀이다', () => {
    expect(isClassified({ 기밀: '기밀' })).toBe(true);
    expect(isClassified({ 기밀: 'Y' })).toBe(true);
    expect(isClassified({ 기밀: '예' })).toBe(true);
    expect(isClassified({ 기밀: 'O' })).toBe(true);
    expect(isClassified({ 기밀: 'true' })).toBe(true);
    expect(isClassified({ 기밀: '1급 기밀' })).toBe(true);
  });

  it('값이 비어 있거나 없으면 기밀이 아니다', () => {
    expect(isClassified({})).toBe(false);
    expect(isClassified({ 기밀: '' })).toBe(false);
    expect(isClassified({ 기밀: '   ' })).toBe(false);
    expect(isClassified({ 기밀: null })).toBe(false);
  });

  it('아니오 계열 값은 기밀이 아니다(대소문자, 공백 무시)', () => {
    for (const v of ['아니오', '아님', '아니요', 'N', 'no', ' No ', 'false', 'FALSE', '0', 'x', 'X', '없음', '해제']) {
      expect(isClassified({ 기밀: v }), v).toBe(false);
    }
  });

  it('숫자 값 1은 기밀이다', () => {
    expect(isClassified({ 기밀: 1 })).toBe(true);
    expect(isClassified({ 기밀: 0 })).toBe(false);
  });
});

describe('useClassifiedMask', () => {
  beforeEach(() => localStorage.clear());
  const chars = [{ id: 1, 기밀: 'Y' }, { id: 2 }];

  it('기본은 가리지 않는다. 기밀이 있는 캐릭터가 있는지 알려 준다', () => {
    const { result } = renderHook(() => useClassifiedMask('91', chars));
    expect(result.current.mask).toBe(false);
    expect(result.current.has).toBe(true);
    expect(result.current.isConcealed(chars[0])).toBe(false);
  });

  it('기밀 캐릭터가 하나도 없으면 has 가 false', () => {
    const { result } = renderHook(() => useClassifiedMask('91', [{ id: 2 }]));
    expect(result.current.has).toBe(false);
  });

  it('가리기를 켜면 기밀 캐릭터만 가려지고, 일반 캐릭터는 가려지지 않는다', () => {
    const { result } = renderHook(() => useClassifiedMask('91', chars));
    act(() => result.current.setMask(true));
    expect(result.current.isConcealed(chars[0])).toBe(true);
    expect(result.current.isConcealed(chars[1])).toBe(false);
  });

  it('열람(reveal)하면 그 캐릭터만 이번 화면에서 보인다', () => {
    const { result } = renderHook(() => useClassifiedMask('91', [...chars, { id: 3, 기밀: 'Y' }]));
    act(() => result.current.setMask(true));
    act(() => result.current.reveal(1));
    expect(result.current.isConcealed(chars[0])).toBe(false);
    expect(result.current.isConcealed({ id: 3, 기밀: 'Y' })).toBe(true);
  });

  it('가리기를 껐다가 다시 켜면 열람했던 캐릭터도 다시 가려진다', () => {
    const { result } = renderHook(() => useClassifiedMask('91', chars));
    act(() => result.current.setMask(true));
    act(() => result.current.reveal(1));
    act(() => result.current.setMask(false));
    act(() => result.current.setMask(true));
    expect(result.current.isConcealed(chars[0])).toBe(true);
  });

  it('가리기 선택은 작품별로 저장되고 다시 열면 복원된다(열람 기록은 저장하지 않음)', () => {
    const first = renderHook(() => useClassifiedMask('91', chars));
    act(() => first.result.current.setMask(true));
    act(() => first.result.current.reveal(1));
    first.unmount();
    const again = renderHook(() => useClassifiedMask('91', chars));
    expect(again.result.current.mask).toBe(true);
    expect(again.result.current.isConcealed(chars[0])).toBe(true);
    expect(renderHook(() => useClassifiedMask('92', chars)).result.current.mask).toBe(false);
  });
});

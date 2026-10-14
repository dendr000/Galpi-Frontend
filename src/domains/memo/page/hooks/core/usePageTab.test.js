// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageTab } from './usePageTab';

// 새 메모를 만들 때 setMemos 로 들어가는 메모를 꺼낸다.
const createMemoIn = (currentFolder) => {
  const setMemos = vi.fn();
  const { result } = renderHook(() => usePageTab({ memos: [], setMemos, currentFolder }));
  act(() => result.current.handleOpenTab(null, 'main'));
  const updater = setMemos.mock.calls[0][0];
  return updater([])[0];
};

describe('usePageTab - 새 메모 만들기', () => {
  it('유저노트 폴더의 새 메모에는 대화 프로필과 유저노트 접기 박스, 빈 줄이 채워진다', () => {
    const memo = createMemoIn('유저노트');
    const root = document.createElement('div');
    root.innerHTML = memo.content;
    expect(memo.folder).toBe('유저노트');
    expect([...root.querySelectorAll('.fold-title')].map((el) => el.textContent)).toEqual(['대화 프로필', '유저노트']);
    expect(root.lastElementChild.outerHTML).toBe('<div><br></div>');
  });

  it('다른 폴더의 새 메모는 기존처럼 본문이 비어 있다', () => {
    const memo = createMemoIn('기타');
    expect(memo.content).toBe('');
    expect(memo.folder).toBe('기타');
  });

  it('전체 메모에서 만들면 기타 폴더로 들어가고 본문은 비어 있다', () => {
    const memo = createMemoIn('전체 메모');
    expect(memo.folder).toBe('기타');
    expect(memo.content).toBe('');
  });
});

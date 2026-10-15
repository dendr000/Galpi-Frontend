// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../../../api/axiosCore', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [{ id: 1, category: '무협', title: 't', content: 'c' }] })),
    put: vi.fn(() => Promise.resolve({})), post: vi.fn(), delete: vi.fn(),
  },
}));

import { useBoilerplateData } from './useBoilerplateData';

const FOLDERS_KEY = 'galpi-bp-folders';

const setup = async () => {
  const hook = renderHook(() => useBoilerplateData(() => {}));
  await waitFor(() => expect(hook.result.current.bpList).toHaveLength(1));
  return hook;
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, 'prompt').mockImplementation(() => { throw new Error('prompt() is not supported.'); });
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  delete window.openTextPromptModal;
  vi.restoreAllMocks();
});

describe('useBoilerplateData - 폴더 추가/이름 변경 (prompt 가 없는 Electron 환경)', () => {
  it('입력 모달로 받은 이름으로 폴더를 추가하고 그 폴더로 이동한다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('  새 폴더 '));
    const { result } = await setup();
    await act(() => result.current.handleAddFolder());
    expect(result.current.bpFolders).toContain('새 폴더');
    expect(result.current.activeFolder).toBe('새 폴더');
    expect(JSON.parse(localStorage.getItem(FOLDERS_KEY))).toContain('새 폴더');
  });

  it('취소, 빈 칸, 이미 있는 이름, "전체"는 추가하지 않는다', async () => {
    const { result } = await setup();
    const before = result.current.bpFolders;
    for (const answer of [null, '   ', '무협', '전체']) {
      window.openTextPromptModal = vi.fn(() => Promise.resolve(answer));
      await act(() => result.current.handleAddFolder());
    }
    expect(result.current.bpFolders).toEqual(before);
  });

  it('이름 변경도 입력 모달로 받고, 폴더에 속한 상용구의 분류도 함께 바꾼다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('새이름'));
    const { result } = await setup();
    act(() => result.current.changeFolder('무협'));
    await act(() => result.current.handleEditFolder());
    expect(window.openTextPromptModal).toHaveBeenCalledWith('수정할 이름을 입력하세요:', '무협');
    expect(result.current.bpFolders).toContain('새이름');
    expect(result.current.bpFolders).not.toContain('무협');
    expect(result.current.bpList[0].category).toBe('새이름');
    expect(result.current.activeFolder).toBe('새이름');
  });

  it('기본 폴더(공통)는 이름을 바꾸지 않는다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('x'));
    const { result } = await setup();
    await act(() => result.current.handleEditFolder());
    expect(window.alert).toHaveBeenCalledWith('기본 폴더는 수정할 수 없습니다.');
    expect(window.openTextPromptModal).not.toHaveBeenCalled();
  });
});

// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../../../api/axiosCore', () => ({
  default: { put: vi.fn(() => Promise.resolve({})), delete: vi.fn(() => Promise.resolve({})) },
}));

import { usePageFolder } from './usePageFolder';

const setup = (over = {}) => {
  const props = {
    memos: [], setMemos: vi.fn(),
    folders: ['기타', '자료'], setFolders: vi.fn(),
    currentFolder: '기타', setCurrentFolder: vi.fn(),
    ...over,
  };
  const { result } = renderHook(() => usePageFolder(props));
  return { props, hooks: result.current };
};

beforeEach(() => {
  vi.spyOn(window, 'prompt').mockImplementation(() => { throw new Error('prompt() is not supported.'); });
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  delete window.openTextPromptModal;
  vi.restoreAllMocks();
});

describe('usePageFolder - 폴더 추가/이름 변경 (prompt 가 없는 Electron 환경)', () => {
  it('최상위 폴더를 입력 모달로 받아 추가하고 그 폴더로 이동한다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve(' 새 폴더 '));
    const { props, hooks } = setup();
    await act(() => hooks.handleAddFolder(''));
    const updater = props.setFolders.mock.calls[0][0];
    expect(updater(['기타', '자료'])).toEqual(['기타', '자료', '새 폴더']);
    expect(props.setCurrentFolder).toHaveBeenCalledWith('새 폴더');
  });

  it('폴더 안에 하위 폴더를 추가한다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('하위'));
    const { props, hooks } = setup();
    await act(() => hooks.handleAddFolder('자료'));
    expect(props.setFolders.mock.calls[0][0](['기타', '자료'])).toEqual(['기타', '자료', '자료/하위']);
    expect(props.setCurrentFolder).toHaveBeenCalledWith('자료/하위');
  });

  it('취소하거나 빈 칸이면 만들지 않고, 이미 있으면 안내한다', async () => {
    const { props, hooks } = setup();
    window.openTextPromptModal = vi.fn(() => Promise.resolve(null));
    await act(() => hooks.handleAddFolder(''));
    window.openTextPromptModal = vi.fn(() => Promise.resolve('  '));
    await act(() => hooks.handleAddFolder(''));
    window.openTextPromptModal = vi.fn(() => Promise.resolve('자료'));
    await act(() => hooks.handleAddFolder(''));
    expect(window.alert).toHaveBeenCalledWith('이미 존재하는 경로입니다.');
    expect(props.setFolders).not.toHaveBeenCalled();
  });

  it('폴더 이름 변경도 입력 모달로 받는다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('바뀐이름'));
    const { props, hooks } = setup({
      folders: ['기타', '옛이름', '옛이름/하위'],
      memos: [{ id: 1, folder: '옛이름/하위', title: 'm' }],
    });
    await act(() => hooks.handleEditFolder('옛이름'));
    expect(window.openTextPromptModal).toHaveBeenCalledWith('수정할 폴더 이름을 입력하세요:', '옛이름');
    expect(props.setFolders.mock.calls[0][0](['기타', '옛이름', '옛이름/하위'])).toEqual(['기타', '바뀐이름', '바뀐이름/하위']);
    expect(props.setMemos.mock.calls[0][0][0].folder).toBe('바뀐이름/하위');
    expect(props.setCurrentFolder).toHaveBeenCalledWith('바뀐이름');
  });
});

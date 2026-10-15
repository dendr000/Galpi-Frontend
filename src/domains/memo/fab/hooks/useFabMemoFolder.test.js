// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../../api/axiosCore', () => ({
  default: { post: vi.fn(() => Promise.resolve({ data: { id: 1 } })) },
}));

import { useFabMemoFolder } from './useFabMemoFolder';

const setup = (over = {}) => {
  const props = {
    memoData: [], setMemoData: vi.fn(),
    memoFolders: ['기타', '웹툰'], setMemoFolders: vi.fn(),
    currentFolder: '기타', setCurrentFolder: vi.fn(),
    ...over,
  };
  const { result } = renderHook(() => useFabMemoFolder(props));
  return { props, hooks: result.current };
};

beforeEach(() => {
  localStorage.clear();
  // Electron(exe)처럼 window.prompt 는 쓸 수 없다.
  vi.spyOn(window, 'prompt').mockImplementation(() => { throw new Error('prompt() is not supported.'); });
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  delete window.openTextPromptModal;
  vi.restoreAllMocks();
});

describe('useFabMemoFolder - 폴더 추가/이름 변경 (prompt 가 없는 Electron 환경)', () => {
  it('최상위 폴더를 입력 모달로 받아 추가하고 그 폴더로 이동한다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('  새 폴더 '));
    const { props, hooks } = setup();
    await act(() => hooks.handleAddFolder(''));
    expect(props.setMemoFolders).toHaveBeenCalledWith(['기타', '웹툰', '새 폴더']);
    expect(props.setCurrentFolder).toHaveBeenCalledWith('새 폴더');
    expect(JSON.parse(localStorage.getItem('galpi-memo-folders'))).toEqual(['기타', '웹툰', '새 폴더']);
  });

  it('폴더 안에서 하위 폴더를 추가한다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('하위'));
    const { props, hooks } = setup({ memoFolders: ['기타', '자료'] });
    await act(() => hooks.handleAddFolder('자료'));
    expect(props.setMemoFolders).toHaveBeenCalledWith(['기타', '자료', '자료/하위']);
    expect(props.setCurrentFolder).toHaveBeenCalledWith('자료/하위');
  });

  it('입력 창에서 취소하거나 빈 칸이면 폴더를 만들지 않는다', async () => {
    const { props, hooks } = setup();
    window.openTextPromptModal = vi.fn(() => Promise.resolve(null));
    await act(() => hooks.handleAddFolder(''));
    window.openTextPromptModal = vi.fn(() => Promise.resolve('   '));
    await act(() => hooks.handleAddFolder(''));
    expect(props.setMemoFolders).not.toHaveBeenCalled();
  });

  it('이미 있는 경로면 안내만 하고 만들지 않는다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('웹툰'));
    const { props, hooks } = setup();
    await act(() => hooks.handleAddFolder(''));
    expect(window.alert).toHaveBeenCalledWith('이미 존재하는 경로입니다.');
    expect(props.setMemoFolders).not.toHaveBeenCalled();
  });

  it('웹툰 바로 밑에 만들면 기존처럼 작품 폴더 구조가 함께 만들어진다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('작품A'));
    const { props, hooks } = setup();
    await act(() => hooks.handleAddFolder('웹툰'));
    const folders = props.setMemoFolders.mock.calls[0][0];
    expect(folders).toEqual(expect.arrayContaining(['웹툰/작품A', '웹툰/작품A/등장인물', '웹툰/작품A/사전', '웹툰/작품A/주인공']));
  });

  it('폴더 이름 변경도 입력 모달로 받는다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('바뀐이름'));
    const { props, hooks } = setup({
      memoFolders: ['기타', '옛이름', '옛이름/하위'],
      memoData: [{ id: 1, folder: '옛이름/하위', title: 'm' }],
    });
    await act(() => hooks.handleEditFolder('옛이름'));
    expect(window.openTextPromptModal).toHaveBeenCalledWith('수정할 폴더 이름을 입력하세요:', '옛이름');
    expect(props.setMemoFolders).toHaveBeenCalledWith(['기타', '바뀐이름', '바뀐이름/하위']);
    expect(props.setMemoData.mock.calls[0][0][0].folder).toBe('바뀐이름/하위');
    expect(props.setCurrentFolder).toHaveBeenCalledWith('바뀐이름');
  });
});

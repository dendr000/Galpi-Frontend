// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BulkToolbar from './BulkToolbar';

const renderToolbar = (over = {}) => {
  const props = {
    works: [], selectedWorkId: '', loadCharacters: vi.fn(), addRow: vi.fn(), addColumn: vi.fn(), columns: [],
    tabMode: false, setTabMode: vi.fn(), sortTable: vi.fn(), applyBatchValue: vi.fn(),
    setFindReplaceModal: vi.fn(), setPasteModal: vi.fn(), labels: [], setLabels: vi.fn(),
    isPreviewOpen: false, setIsPreviewOpen: vi.fn(),
    ...over,
  };
  const utils = render(<MemoryRouter><BulkToolbar {...props} /></MemoryRouter>);
  return { props, ...utils };
};

beforeEach(() => {
  // Electron(exe)처럼 window.prompt 는 쓸 수 없다.
  vi.spyOn(window, 'prompt').mockImplementation(() => { throw new Error('prompt() is not supported.'); });
});
afterEach(() => {
  cleanup();
  delete window.openTextPromptModal;
  vi.restoreAllMocks();
});

describe('BulkToolbar - 새 속성(열) 추가 (prompt 가 없는 Electron 환경)', () => {
  it('입력 모달로 받은 속성 이름으로 열을 추가한다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('무기'));
    const { props, getByTitle } = renderToolbar();
    fireEvent.click(getByTitle('새 속성(열) 추가'));
    await waitFor(() => expect(props.addColumn).toHaveBeenCalledWith('무기'));
    expect(window.openTextPromptModal.mock.calls[0][0]).toContain('속성명');
  });

  it('입력 창에서 취소하면 null 이 그대로 넘어가 열이 추가되지 않는다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve(null));
    const { props, getByTitle } = renderToolbar();
    fireEvent.click(getByTitle('새 속성(열) 추가'));
    await waitFor(() => expect(props.addColumn).toHaveBeenCalledWith(null));
  });
});

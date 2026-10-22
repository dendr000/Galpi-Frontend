// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ exportWorkHtml: vi.fn(), downloadTextFile: vi.fn() }));
vi.mock('./exportWork', () => ({ exportWorkHtml: mocks.exportWorkHtml }));
vi.mock('./downloadFile', () => ({ downloadTextFile: mocks.downloadTextFile }));

import { useWorkExport } from './useWorkExport';

beforeEach(() => { mocks.exportWorkHtml.mockReset(); mocks.downloadTextFile.mockReset(); });

const ctx = () => ({
  work: { id: 1, title: '작품' }, characters: [{ id: 1 }], wikiPages: [{ id: 2 }], formSwaps: { 1: 2 },
  groupCriteria: '소속', sortKey: '서열', sortDir: 'desc',
});

describe('useWorkExport', () => {
  it('화면의 작품 상태와 고른 옵션으로 HTML 을 만들고 파일로 내려받는다', async () => {
    mocks.exportWorkHtml.mockResolvedValue({ filename: '작품.html', html: '<p>x</p>' });
    const { result } = renderHook(() => useWorkExport(ctx()));
    const options = { classified: 'mask', images: true, pages: true };
    await result.current(options);
    expect(mocks.exportWorkHtml).toHaveBeenCalledWith({ ...ctx(), options });
    expect(mocks.downloadTextFile).toHaveBeenCalledWith('작품.html', '<p>x</p>');
  });

  it('만들기에 실패하면 내려받지 않고 오류를 그대로 던진다(창이 안내를 띄울 수 있게)', async () => {
    mocks.exportWorkHtml.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useWorkExport(ctx()));
    await expect(result.current({ classified: 'mask', images: false, pages: false })).rejects.toThrow('boom');
    expect(mocks.downloadTextFile).not.toHaveBeenCalled();
  });
});

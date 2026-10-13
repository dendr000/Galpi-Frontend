// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';

vi.mock('../../../api/axiosCore', () => ({
  default: { get: vi.fn() },
}));

import api from '../../../api/axiosCore';
import WorkMetaPanel from './WorkMetaPanel';

const work = (creator, meta) => ({ creator, description: `[META_DATA:${JSON.stringify(meta)}]\n본문` });

const WORKS = [
  work('하엣', { charExt: 'webp', coverExt: 'png' }),
  work('하엣', { charExt: 'webp', coverExt: 'png' }),
  work('하엣', { charExt: 'png', coverExt: 'webp' }),
  work('다른작가', { charExt: 'gif', coverExt: 'gif' }),
];

const baseMeta = (over = {}) => ({
  creator: '하엣', genre: '', status: '진행 전', alias: '', coverExt: '', charExt: 'png',
  groupOrderStr: '', imgVariants: [], ...over,
});

// setWorkMeta로 전달된 갱신 함수들을 순서대로 prev에 적용해 최종 결과를 계산한다.
const applyUpdates = (spy, prev) =>
  spy.mock.calls.reduce((acc, [arg]) => (typeof arg === 'function' ? arg(acc) : arg), prev);

const renderPanel = (workMeta) => {
  const setWorkMeta = vi.fn();
  render(<WorkMetaPanel workMeta={workMeta} setWorkMeta={setWorkMeta} />);
  // 제작자 입력칸: 자동완성 목록(datalist)이 연결된 입력칸이라 role이 textbox가 아니라 combobox다.
  const creatorInput = document.querySelector('input[list="creator-suggestions"]');
  return { setWorkMeta, creatorInput };
};

beforeEach(() => {
  api.get.mockReset();
  api.get.mockResolvedValue({ data: WORKS });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('WorkMetaPanel - 제작자 Tab으로 확장자 자동 적용', () => {
  it('Tab을 누르면 같은 제작자의 최다 캐릭터 확장자와 대문 확장자를 함께 채운다', async () => {
    const { setWorkMeta, creatorInput } = renderPanel(baseMeta());
    fireEvent.keyDown(creatorInput, { key: 'Tab' });
    await waitFor(() => expect(setWorkMeta).toHaveBeenCalled());
    expect(applyUpdates(setWorkMeta, baseMeta())).toMatchObject({ charExt: 'webp', coverExt: 'png' });
  });

  it('이미 골라 둔 대문 확장자는 덮어쓰지 않는다', async () => {
    const { setWorkMeta, creatorInput } = renderPanel(baseMeta({ coverExt: 'gif' }));
    fireEvent.keyDown(creatorInput, { key: 'Tab' });
    await waitFor(() => expect(setWorkMeta).toHaveBeenCalled());
    expect(applyUpdates(setWorkMeta, baseMeta({ coverExt: 'gif' }))).toMatchObject({ charExt: 'webp', coverExt: 'gif' });
  });

  it('캐릭터 확장자는 기존 동작대로 제작자의 최다값으로 맞춘다', async () => {
    const { setWorkMeta, creatorInput } = renderPanel(baseMeta({ charExt: 'gif' }));
    fireEvent.keyDown(creatorInput, { key: 'Tab' });
    await waitFor(() => expect(setWorkMeta).toHaveBeenCalled());
    expect(applyUpdates(setWorkMeta, baseMeta({ charExt: 'gif' })).charExt).toBe('webp');
  });

  it('제작자의 다른 작품에 대문이 하나도 없으면 대문 확장자는 그대로 둔다', async () => {
    api.get.mockResolvedValue({ data: [work('하엣', { charExt: 'webp' })] });
    const { setWorkMeta, creatorInput } = renderPanel(baseMeta());
    fireEvent.keyDown(creatorInput, { key: 'Tab' });
    await waitFor(() => expect(setWorkMeta).toHaveBeenCalled());
    expect(applyUpdates(setWorkMeta, baseMeta())).toMatchObject({ charExt: 'webp', coverExt: '' });
  });

  it('처음 보는 제작자면 아무것도 바꾸지 않는다', async () => {
    const { setWorkMeta, creatorInput } = renderPanel(baseMeta({ creator: '새작가' }));
    fireEvent.keyDown(creatorInput, { key: 'Tab' });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/works'));
    await new Promise((r) => setTimeout(r, 50));
    expect(setWorkMeta).not.toHaveBeenCalled();
  });

  it('Tab이 아닌 키에서는 동작하지 않는다', async () => {
    const { setWorkMeta, creatorInput } = renderPanel(baseMeta());
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    api.get.mockClear();
    fireEvent.keyDown(creatorInput, { key: 'a' });
    await new Promise((r) => setTimeout(r, 30));
    expect(api.get).not.toHaveBeenCalled();
    expect(setWorkMeta).not.toHaveBeenCalled();
  });

  it('제작자가 비어 있으면 조회하지 않는다', async () => {
    const { creatorInput } = renderPanel(baseMeta({ creator: '' }));
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    api.get.mockClear();
    fireEvent.keyDown(creatorInput, { key: 'Tab' });
    await new Promise((r) => setTimeout(r, 30));
    expect(api.get).not.toHaveBeenCalled();
  });

  it('작품 목록 조회가 실패해도 오류 없이 아무것도 바꾸지 않는다', async () => {
    const { setWorkMeta, creatorInput } = renderPanel(baseMeta());
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    api.get.mockRejectedValue(new Error('down'));
    fireEvent.keyDown(creatorInput, { key: 'Tab' });
    await new Promise((r) => setTimeout(r, 50));
    expect(setWorkMeta).not.toHaveBeenCalled();
  });
});

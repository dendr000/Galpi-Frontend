// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 편집기: "여러 값일 때 그룹 표시"(multiGroup) 설정을 불러오고 저장하는 경로.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const apiMock = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }));
vi.mock('../../../api/axiosCore', () => ({ default: apiMock }));

import { useEditorSave } from './useEditorSave';
import { useEditorFetch } from './useEditorFetch';

beforeEach(() => {
  Object.values(apiMock).forEach((f) => f.mockReset());
  apiMock.put.mockResolvedValue({ data: {} });
});

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

const saveWith = async (workMeta) => {
  const { result } = renderHook(
    () => useEditorSave({
      docType: 'work', docAction: 'edit', targetId: '91', targetWorkId: '91', searchParams: new URLSearchParams(),
      title: '작품', rawText: '본문', overviewText: '개요', workMeta, charProps: [],
      themeColor: '#000', cardLabels: { label1: '', label2: '' }, workContext: null, isHidden: false, setSaveStatus: () => {},
    }),
    { wrapper }
  );
  await act(async () => { await result.current.handleSave(true); });
  const body = apiMock.put.mock.calls[0][1];
  return JSON.parse(body.description.split('\n')[0].replace(/^\[META_DATA:/, '').replace(/\]$/, ''));
};

const baseMeta = (over = {}) => ({
  creator: '', genre: '', status: '', alias: '', coverExt: '', charExt: 'png', groupOrderStr: '', imgVariants: [''], originalMeta: {}, ...over,
});

const fetchWith = async (description) => {
  apiMock.get.mockImplementation((url) => {
    if (url === '/api/fonts') return Promise.resolve({ data: [] });
    return Promise.resolve({ data: { title: '작품', description } });
  });
  const setWorkMeta = vi.fn();
  renderHook(() => useEditorFetch({
    docType: 'work', docAction: 'edit', targetId: '91', targetWorkId: '91',
    setLoading: () => {}, setTitle: () => {}, setRawText: () => {}, setOverviewText: () => {},
    setWorkMeta, setWorkContext: () => {}, setThemeColor: () => {}, setIsHidden: () => {},
    setCardLabels: () => {}, setCharProps: () => {}, setFontList: () => {},
  }));
  await waitFor(() => expect(setWorkMeta).toHaveBeenCalled());
  return setWorkMeta.mock.calls[0][0];
};

describe('작품 편집기 저장: 여러 값일 때 그룹 표시', () => {
  it('첫 번째, 마지막 선택은 메타에 저장한다', async () => {
    expect((await saveWith(baseMeta({ multiGroupMode: 'first' }))).multiGroup).toBe('first');
    apiMock.put.mockClear();
    expect((await saveWith(baseMeta({ multiGroupMode: 'last' }))).multiGroup).toBe('last');
  });

  it('모두 표시(기본)로 되돌리면 예전에 저장된 값이 메타에서 지워진다', async () => {
    const meta = await saveWith(baseMeta({ multiGroupMode: 'all', originalMeta: { multiGroup: 'first', keep: 1 } }));
    expect(meta.multiGroup).toBeUndefined();
    expect(meta.keep).toBe(1);
  });
});

describe('작품 편집기 불러오기: 여러 값일 때 그룹 표시', () => {
  it('메타의 값을 선택 상태로 채운다', async () => {
    expect((await fetchWith('[META_DATA:{"multiGroup":"last"}]\n본문')).multiGroupMode).toBe('last');
  });

  it('설정이 없거나 잘못된 값이면 all', async () => {
    expect((await fetchWith('본문')).multiGroupMode).toBe('all');
    expect((await fetchWith('[META_DATA:{"multiGroup":"zzz"}]\n본문')).multiGroupMode).toBe('all');
  });
});

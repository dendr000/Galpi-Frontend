// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 편집기: 등급 설정(ratingAxes, ratingScale)을 불러오고 저장하는 경로.
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
  const meta = JSON.parse(body.description.split('\n')[0].replace(/^\[META_DATA:/, '').replace(/\]$/, ''));
  return meta;
};

const baseMeta = (over = {}) => ({
  creator: '', genre: '', status: '', alias: '', coverExt: '', charExt: 'png', groupOrderStr: '', imgVariants: [''], originalMeta: {}, ...over,
});

describe('작품 편집기 저장: 등급 설정', () => {
  it('텍스트칸에 쓴 등급 설정을 메타에 저장한다', async () => {
    const meta = await saveWith(baseMeta({ ratingAxesStr: '위험도:R', ratingScaleStr: '0:무해:확인 불가' }));
    expect(meta.ratingAxes).toBe('위험도:R');
    expect(meta.ratingScale).toBe('0:무해:확인 불가');
  });

  it('칸을 비우면 예전에 저장된 등급 설정이 메타에서 지워진다', async () => {
    const meta = await saveWith(baseMeta({ ratingAxesStr: '', ratingScaleStr: '', originalMeta: { ratingAxes: '옛값', ratingScale: '옛값', keep: 1 } }));
    expect(meta.ratingAxes).toBeUndefined();
    expect(meta.ratingScale).toBeUndefined();
    expect(meta.keep).toBe(1);
  });
});

describe('작품 편집기 불러오기: 등급 설정', () => {
  it('메타의 등급 설정을 텍스트칸 값으로 채운다', async () => {
    apiMock.get.mockImplementation((url) => {
      if (url === '/api/fonts') return Promise.resolve({ data: [] });
      return Promise.resolve({
        data: { title: '작품', creator: 'a', genre: '', status: '', description: '[META_DATA:{"ratingAxes":"위험도:R","ratingScale":"0:무해"}]\n본문' },
      });
    });
    const setWorkMeta = vi.fn();
    renderHook(() => useEditorFetch({
      docType: 'work', docAction: 'edit', targetId: '91', targetWorkId: '91',
      setLoading: () => {}, setTitle: () => {}, setRawText: () => {}, setOverviewText: () => {},
      setWorkMeta, setWorkContext: () => {}, setThemeColor: () => {}, setIsHidden: () => {},
      setCardLabels: () => {}, setCharProps: () => {}, setFontList: () => {},
    }));
    await waitFor(() => expect(setWorkMeta).toHaveBeenCalled());
    expect(setWorkMeta.mock.calls[0][0]).toMatchObject({ ratingAxesStr: '위험도:R', ratingScaleStr: '0:무해' });
  });

  it('설정이 없으면 빈 문자열', async () => {
    apiMock.get.mockImplementation((url) => {
      if (url === '/api/fonts') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: { title: '작품', description: '본문' } });
    });
    const setWorkMeta = vi.fn();
    renderHook(() => useEditorFetch({
      docType: 'work', docAction: 'edit', targetId: '91', targetWorkId: '91',
      setLoading: () => {}, setTitle: () => {}, setRawText: () => {}, setOverviewText: () => {},
      setWorkMeta, setWorkContext: () => {}, setThemeColor: () => {}, setIsHidden: () => {},
      setCardLabels: () => {}, setCharProps: () => {}, setFontList: () => {},
    }));
    await waitFor(() => expect(setWorkMeta).toHaveBeenCalled());
    expect(setWorkMeta.mock.calls[0][0]).toMatchObject({ ratingAxesStr: '', ratingScaleStr: '' });
  });
});

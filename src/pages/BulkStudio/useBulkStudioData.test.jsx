// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 일괄 관리 스튜디오: 작품을 불러올 때 표가 어떻게 채워지는지.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const apiMock = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock('../../api/axiosCore', () => ({ default: apiMock }));

import { useBulkStudioData } from './useBulkStudioData';

const wrapper = ({ children }) => <MemoryRouter initialEntries={['/bulk?workId=5']}>{children}</MemoryRouter>;

const WORK = { id: 5, title: '시험 작품', description: '개요' };

const setup = async (characters) => {
  apiMock.get.mockImplementation((url) => {
    if (url === '/api/works') return Promise.resolve({ data: [WORK] });
    if (url.startsWith('/api/characters')) return Promise.resolve({ data: characters });
    return Promise.resolve({ data: [] });
  });
  const hook = renderHook(() => useBulkStudioData(), { wrapper });
  await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith('/api/characters?workId=5'));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

beforeEach(() => {
  Object.values(apiMock).forEach((f) => f.mockReset());
});

describe('useBulkStudioData 작품 불러오기', () => {
  it('캐릭터가 하나도 없는 작품은 빈 표로 시작한다(빈 "새 캐릭터" 행을 만들지 않는다)', async () => {
    const { result } = await setup([]);
    await waitFor(() => expect(result.current.selectedWorkId).toBe('5'));
    expect(result.current.rows).toEqual([]);
  });

  it('캐릭터가 있으면 그 캐릭터만 표에 나온다(행이 더 붙지 않는다)', async () => {
    const { result } = await setup([
      { id: 1, name: '릴리', dynamicProperties: '{"sortOrder":1}' },
      { id: 2, name: '레온', dynamicProperties: '{"sortOrder":2}' },
    ]);
    await waitFor(() => expect(result.current.rows).toHaveLength(2));
    expect(result.current.rows.map((r) => r.name)).toEqual(['릴리', '레온']);
  });

  it('휴지통에 있는 캐릭터만 있는 작품도 빈 표로 시작한다', async () => {
    const { result } = await setup([{ id: 1, name: '버린 캐릭터', isTrash: true }]);
    await waitFor(() => expect(result.current.selectedWorkId).toBe('5'));
    expect(result.current.rows).toEqual([]);
  });

  it('빈 표에서도 "행 추가"로 새 행을 만들 수 있다', async () => {
    const { result } = await setup([]);
    await waitFor(() => expect(result.current.selectedWorkId).toBe('5'));
    act(() => { result.current.addRow(1); });
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].name).toBe('');
  });
});

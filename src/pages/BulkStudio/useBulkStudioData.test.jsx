// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 일괄 관리 스튜디오: 작품을 불러올 때 표가 어떻게 채워지는지.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('useBulkStudioData 선택 삭제(removeCheckedRows)', () => {
  const FIVE = [1, 2, 3, 4, 5].map((n) => ({ id: n, name: `인물${n}`, dynamicProperties: JSON.stringify({ sortOrder: n }) }));
  const click = (hook, idx, shiftKey = false) => act(() => { hook.result.current.toggleRowCheck({ shiftKey }, idx); });
  const names = (hook) => hook.result.current.rows.map((r) => r.name);
  afterEach(() => { vi.restoreAllMocks(); });

  const load = async (characters = FIVE) => {
    const hook = await setup(characters);
    await waitFor(() => expect(hook.result.current.rows).toHaveLength(characters.length));
    return hook;
  };

  it('체크한 행만 한 번에 지운다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const hook = await load();
    click(hook, 1); click(hook, 3);
    let count;
    act(() => { count = hook.result.current.removeCheckedRows(); });
    expect(count).toBe(2);
    expect(names(hook)).toEqual(['인물1', '인물3', '인물5']);
  });

  it('지우기 전에 몇 명인지 알려 주고 확인을 받는다', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const hook = await load();
    click(hook, 0); click(hook, 2);
    act(() => { hook.result.current.removeCheckedRows(); });
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0][0]).toContain('2명');
  });

  it('확인에서 취소하면 아무것도 지우지 않고 체크도 그대로다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const hook = await load();
    click(hook, 0); click(hook, 1);
    let count;
    act(() => { count = hook.result.current.removeCheckedRows(); });
    expect(count).toBe(0);
    expect(hook.result.current.rows).toHaveLength(5);
    expect(hook.result.current.rows.filter((r) => r._checked)).toHaveLength(2);
  });

  it('체크한 행이 없으면 확인창 없이 안내만 한다', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const hook = await load();
    let count;
    act(() => { count = hook.result.current.removeCheckedRows(); });
    expect(count).toBe(0);
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(hook.result.current.rows).toHaveLength(5);
  });

  it('전체 선택 후 지우면 빈 표가 된다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const hook = await load();
    act(() => { hook.result.current.toggleAllChecks(true); });
    act(() => { hook.result.current.removeCheckedRows(); });
    expect(hook.result.current.rows).toEqual([]);
  });

  it('지운 뒤 shift 범위 선택이 사라진 행의 위치를 기억해 엉뚱한 행을 만들지 않는다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const hook = await load();
    click(hook, 4);                                   // 마지막 행을 체크해 기준점으로 삼고
    act(() => { hook.result.current.removeCheckedRows(); }); // 그 행을 지운다(이제 행은 4개)
    click(hook, 0, true);                             // 처음 행을 shift+클릭
    expect(hook.result.current.rows).toHaveLength(4);
    expect(hook.result.current.rows.every((r) => r && r.id !== undefined && r.name)).toBe(true);
  });

  it('저장하면 지운 기존 인물은 서버에서도 지워지고, 아직 저장 안 한 새 행은 삭제 요청이 없다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    apiMock.put.mockResolvedValue({ data: {} });
    apiMock.post.mockResolvedValue({ data: {} });
    apiMock.delete.mockResolvedValue({ data: {} });
    const hook = await load();
    act(() => { hook.result.current.addRow(1); });
    act(() => { hook.result.current.handleCellChange(5, 'name', '새인물'); });
    click(hook, 0); click(hook, 5);                  // 기존 1번 인물과 새 행을 같이 체크
    act(() => { hook.result.current.removeCheckedRows(); });
    await act(async () => { await hook.result.current.handleSaveAll(); });
    const deleted = apiMock.delete.mock.calls.map((c) => c[0]);
    expect(deleted).toEqual(['/api/characters/1']);
    expect(apiMock.post).not.toHaveBeenCalled();
  });
});

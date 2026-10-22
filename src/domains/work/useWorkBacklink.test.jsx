// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

const apiMock = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../../api/axiosCore', () => ({ default: apiMock }));

import { useWorkBacklink } from './useWorkBacklink';

const chars = [
  { id: 1, name: '릴리' },
  { id: 2, name: '레온' },
];

const setup = (over = {}) => {
  const props = {
    characters: chars,
    formSwaps: {},
    workId: '91',
    setActiveCharId: vi.fn(),
    navigate: vi.fn(),
    ...over,
  };
  const { result } = renderHook(() => useWorkBacklink(props));
  return { props, handle: (kw) => act(async () => { await result.current(kw); }) };
};

beforeEach(() => {
  apiMock.get.mockReset();
  window.alert = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  document.body.innerHTML = '';
  cleanup();
});

describe('useWorkBacklink', () => {
  it('같은 작품 캐릭터 이름이면 그 캐릭터를 선택하고 카드로 스크롤한다(서버 조회 없음)', async () => {
    document.body.innerHTML = '<div id="char-card-2"></div>';
    const { props, handle } = setup();
    await handle('레온');
    expect(props.setActiveCharId).toHaveBeenCalledWith(2);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(apiMock.get).not.toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it('카드가 화면에 없어도 선택은 한다(스크롤만 건너뜀)', async () => {
    const { props, handle } = setup();
    await handle('릴리');
    expect(props.setActiveCharId).toHaveBeenCalledWith(1);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it('캐릭터가 아니면 작품 목록에서 제목을 찾아 그 작품 페이지로 이동한다', async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: 10, title: '아르카디아 연대기' }] });
    const { props, handle } = setup();
    await handle('아르카디아 연대기');
    expect(apiMock.get).toHaveBeenCalledWith('/api/works');
    expect(props.navigate).toHaveBeenCalledWith('/work/10');
    expect(props.setActiveCharId).not.toHaveBeenCalled();
  });

  it('캐릭터도 작품도 아니면 찾을 수 없다는 안내를 띄운다', async () => {
    apiMock.get.mockResolvedValue({ data: [] });
    const { props, handle } = setup();
    await handle('없는 이름');
    expect(window.alert).toHaveBeenCalledTimes(1);
    expect(window.alert.mock.calls[0][0]).toContain('없는 이름');
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it('작품 목록 조회가 실패해도 오류 없이 안내를 띄운다', async () => {
    apiMock.get.mockRejectedValue(new Error('network'));
    const { handle } = setup();
    await handle('아무개');
    expect(window.alert).toHaveBeenCalledTimes(1);
  });
});

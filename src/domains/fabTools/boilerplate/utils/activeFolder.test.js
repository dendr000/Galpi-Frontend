// Copyright (c) dendr000. MIT License.
import { describe, it, expect, vi } from 'vitest';
import {
  ACTIVE_FOLDER_KEY,
  RESET_ON_CLOSE_KEY,
  getActiveFolder,
  isResetOnCloseEnabled,
  resetActiveFolderIfEnabled,
  selectActiveBoilerplates,
} from './activeFolder';

// localStorage 흉내 — 테스트마다 새로 만들어 서로 영향이 없게 한다.
const createStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: vi.fn((k, v) => data.set(k, String(v))),
  };
};

describe('isResetOnCloseEnabled — "모달을 닫으면 전체로 복귀" 설정', () => {
  it('값이 없으면 켜짐이 기본이다', () => {
    expect(isResetOnCloseEnabled(createStorage())).toBe(true);
  });

  it("'true' 면 켜짐, 'false' 면 꺼짐이다", () => {
    expect(isResetOnCloseEnabled(createStorage({ [RESET_ON_CLOSE_KEY]: 'true' }))).toBe(true);
    expect(isResetOnCloseEnabled(createStorage({ [RESET_ON_CLOSE_KEY]: 'false' }))).toBe(false);
  });
});

describe('getActiveFolder', () => {
  it("저장된 값이 없으면 '전체' 다", () => {
    expect(getActiveFolder(createStorage())).toBe('전체');
  });

  it('저장된 폴더를 그대로 돌려준다', () => {
    expect(getActiveFolder(createStorage({ [ACTIVE_FOLDER_KEY]: '무협' }))).toBe('무협');
  });
});

describe('resetActiveFolderIfEnabled — 모달을 닫을 때', () => {
  it("특정 폴더가 선택돼 있고 설정이 켜져 있으면 '전체' 로 되돌린다", () => {
    const storage = createStorage({ [ACTIVE_FOLDER_KEY]: '무협' });

    expect(resetActiveFolderIfEnabled(storage)).toBe(true);
    expect(getActiveFolder(storage)).toBe('전체');
  });

  it('설정이 꺼져 있으면 선택한 폴더를 그대로 둔다', () => {
    const storage = createStorage({ [ACTIVE_FOLDER_KEY]: '무협', [RESET_ON_CLOSE_KEY]: 'false' });

    expect(resetActiveFolderIfEnabled(storage)).toBe(false);
    expect(getActiveFolder(storage)).toBe('무협');
  });

  it("이미 '전체' 면(또는 값이 없으면) 아무것도 쓰지 않는다", () => {
    const unset = createStorage();
    const already = createStorage({ [ACTIVE_FOLDER_KEY]: '전체' });

    expect(resetActiveFolderIfEnabled(unset)).toBe(false);
    expect(resetActiveFolderIfEnabled(already)).toBe(false);
    expect(unset.setItem).not.toHaveBeenCalled();
    expect(already.setItem).not.toHaveBeenCalled();
  });

  it('다른 설정(자동 치환, 추천 팝업, 폴더 목록)은 건드리지 않는다', () => {
    const storage = createStorage({
      [ACTIVE_FOLDER_KEY]: '무협',
      'galpi-bp-auto': 'false',
      'galpi-bp-preview': 'false',
      'galpi-bp-folders': '["전체","공통","무협"]',
    });

    resetActiveFolderIfEnabled(storage);

    expect(storage.getItem('galpi-bp-auto')).toBe('false');
    expect(storage.getItem('galpi-bp-preview')).toBe('false');
    expect(storage.getItem('galpi-bp-folders')).toBe('["전체","공통","무협"]');
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });
});

describe('selectActiveBoilerplates — 에디터에서 실제로 쓰이는 상용구', () => {
  const list = [
    { title: 'a', category: '공통' },
    { title: 'b', category: '무협' },
    { title: 'c', category: '무협' },
    { title: 'd', category: '현대' },
    { title: 'e', category: '판타지' },
  ];

  it("'전체' 면 모든 폴더의 상용구를 쓴다", () => {
    expect(selectActiveBoilerplates(list, '전체').map((b) => b.title)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it("특정 폴더면 그 폴더와 '공통' 폴더의 상용구만 쓴다", () => {
    expect(selectActiveBoilerplates(list, '무협').map((b) => b.title)).toEqual(['a', 'b', 'c']);
  });

  it('무협 폴더를 고른 채 모달을 닫아도, 복귀 설정이 켜져 있으면 다른 폴더 상용구도 다시 쓸 수 있다', () => {
    const storage = createStorage({ [ACTIVE_FOLDER_KEY]: '무협' });
    expect(selectActiveBoilerplates(list, getActiveFolder(storage))).toHaveLength(3);

    resetActiveFolderIfEnabled(storage);

    expect(selectActiveBoilerplates(list, getActiveFolder(storage))).toHaveLength(5);
  });

  it('복귀 설정을 끄면 예전처럼 선택한 폴더 범위가 닫은 뒤에도 유지된다', () => {
    const storage = createStorage({ [ACTIVE_FOLDER_KEY]: '무협', [RESET_ON_CLOSE_KEY]: 'false' });

    resetActiveFolderIfEnabled(storage);

    expect(selectActiveBoilerplates(list, getActiveFolder(storage))).toHaveLength(3);
  });
});

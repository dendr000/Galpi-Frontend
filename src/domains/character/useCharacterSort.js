// Copyright (c) dendr000. MIT License.
// 작품별 캐릭터 정렬 선택(속성 이름, 방향)을 들고 있고 localStorage 에 저장한다. 키가 비어 있으면 수동 순서.
import { useState, useCallback } from 'react';

const storageKey = (workId) => `galpi-char-sort-${workId}`;

const read = (workId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(workId)) || 'null');
    if (saved && typeof saved.key === 'string') {
      return { key: saved.key, dir: saved.dir === 'desc' ? 'desc' : 'asc' };
    }
  } catch (e) { /* 깨진 값이나 저장소 접근 불가면 수동 순서로 시작 */ }
  return { key: '', dir: 'asc' };
};

export const useCharacterSort = (workId) => {
  const [state, setState] = useState(() => read(workId));

  const setSort = useCallback(
    (key, dir = 'asc') => {
      const next = { key: key || '', dir: dir === 'desc' ? 'desc' : 'asc' };
      setState(next);
      try {
        if (next.key) localStorage.setItem(storageKey(workId), JSON.stringify(next));
        else localStorage.removeItem(storageKey(workId));
      } catch (e) { /* 저장 실패는 무시: 이번 화면에서만 유지 */ }
    },
    [workId]
  );

  return { sortKey: state.key, sortDir: state.dir, setSort };
};

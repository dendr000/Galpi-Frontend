// Copyright (c) dendr000. MIT License.
// "기밀 가리기" 상태: 켜면 기밀 캐릭터의 사진과 내용을 흐리게 가리고, 눌러서 하나씩 연다.
// 켜짐 여부는 작품별로 저장하고, 연 캐릭터(열람 기록)는 이번 화면에서만 유지한다.
import { useState, useCallback } from 'react';
import { isClassified } from './classified';

const storageKey = (workId) => `galpi-classified-mask-${workId}`;

const readMask = (workId) => {
  try { return localStorage.getItem(storageKey(workId)) === '1'; } catch (e) { return false; }
};

export const useClassifiedMask = (workId, characters) => {
  const [mask, setMaskState] = useState(() => readMask(workId));
  const [revealed, setRevealed] = useState(() => new Set());

  const setMask = useCallback(
    (on) => {
      setMaskState(!!on);
      setRevealed(new Set()); // 가리기를 껐다 켜면 열람했던 것도 다시 가린다
      try {
        if (on) localStorage.setItem(storageKey(workId), '1');
        else localStorage.removeItem(storageKey(workId));
      } catch (e) { /* 저장 실패는 무시: 이번 화면에서만 유지 */ }
    },
    [workId]
  );

  const reveal = useCallback((id) => setRevealed((prev) => new Set(prev).add(id)), []);

  const isConcealed = useCallback((char) => mask && isClassified(char) && !revealed.has(char.id), [mask, revealed]);

  const has = Array.isArray(characters) && characters.some(isClassified);

  return { has, mask, setMask, reveal, isClassified, isConcealed };
};

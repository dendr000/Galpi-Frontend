// Copyright (c) dendr000. MIT License.
// 그리드 카드를 눌러 캐릭터를 선택하면 아래 본문 구역으로 부드럽게 이동하고,
// 본문에서 "그리드로"를 누르면 그 캐릭터의 카드로 돌아온다.
// 맨 아래 이름 바(CharacterQuickNav)와 선택 해제에는 이동을 걸지 않는다(이 훅을 거치지 않는다).
import { useCallback, useEffect, useRef, useState } from 'react';
import { getCharViewSettings } from './charViewSettings';

export const scrollToCharDetail = () => {
  document.getElementById('character-detail-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const scrollToCharCard = (id) => {
  if (id === null || id === undefined) return;
  document.getElementById(`char-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// setActiveCharId 를 감싼 선택 함수를 돌려준다. 본문 구역은 선택된 뒤에야 그려지므로,
// 이동은 선택이 화면에 반영된 다음(효과)에 한다.
export const useGridSelectScroll = (setActiveCharId) => {
  const [tick, setTick] = useState(0);
  const pending = useRef(false);

  const select = useCallback((id) => {
    setActiveCharId(id);
    if (id !== null && id !== undefined && getCharViewSettings().autoScroll) {
      pending.current = true;
      setTick((t) => t + 1);
    }
  }, [setActiveCharId]);

  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    scrollToCharDetail();
  }, [tick]);

  return select;
};

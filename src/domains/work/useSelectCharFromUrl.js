// Copyright (c) dendr000. MIT License.
// 주소의 ?charId=번호 로 작품 페이지가 열리면 그 캐릭터를 선택하고 카드 위치로 스크롤한다.
// (하위 문서의 소속 인물 카드는 이제 이동하지 않고 그 자리에서 선택한다. 이 주소는 바깥 링크나 북마크용으로 남겨 둔다.)
import { useEffect, useRef } from 'react';

// 데이터 훅이 저장해 둔 스크롤 위치를 300ms 뒤에 복원하므로, 그보다 늦게 카드로 스크롤한다.
const SCROLL_DELAY_MS = 500;

export const useSelectCharFromUrl = ({ loading, charIdParam, characters, setActiveCharId }) => {
  const appliedRef = useRef(null);

  useEffect(() => {
    if (!charIdParam) appliedRef.current = null;
  }, [charIdParam]);

  useEffect(() => {
    if (loading || !charIdParam || appliedRef.current === charIdParam) return;
    const target = (characters || []).find((c) => String(c.id) === String(charIdParam));
    if (!target) return;
    appliedRef.current = charIdParam;
    setActiveCharId(target.id);
    // 타이머는 일부러 정리하지 않는다: 그 사이 characters 가 바뀌어 효과가 다시 돌아도 스크롤은 한 번 일어나야 한다.
    // 카드가 이미 사라졌으면 getElementById 가 null 이라 아무 일도 하지 않는다.
    setTimeout(() => {
      document.getElementById(`char-card-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, SCROLL_DELAY_MS);
  }, [loading, charIdParam, characters, setActiveCharId]);
};

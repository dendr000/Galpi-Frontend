// Copyright (c) dendr000. MIT License.
// 작품 페이지 본문의 [[이름]] 파란 링크를 눌렀을 때의 동작:
// 같은 작품의 캐릭터면 그 캐릭터를 선택하고 카드로 스크롤, 다른 작품 제목이면 그 작품 페이지로 이동, 둘 다 아니면 안내.
import { useCallback } from 'react';
import api from '../../api/axiosCore';
import { findCharacterTarget, findWorkTarget } from './backlink';

export const useWorkBacklink = ({ characters, formSwaps, workId, setActiveCharId, navigate }) =>
  useCallback(
    async (keyword) => {
      const name = String(keyword || '').trim();
      if (!name) return;

      const target = findCharacterTarget(characters, formSwaps, name);
      if (target) {
        setActiveCharId(target.activeId);
        document.getElementById(`char-card-${target.baseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      try {
        const res = await api.get('/api/works');
        const work = findWorkTarget(res.data, name, workId);
        if (work) {
          navigate(`/work/${work.id}`);
          return;
        }
      } catch (err) {
        console.warn('[useWorkBacklink] 작품 목록 조회 실패:', err);
      }

      alert(`'${name}'에 해당하는 캐릭터나 작품을 찾을 수 없습니다.\n오타가 없는지 확인해 주세요.`);
    },
    [characters, formSwaps, workId, setActiveCharId, navigate]
  );

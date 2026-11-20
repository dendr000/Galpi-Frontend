// Copyright (c) dendr000. MIT License.
// 숨김 캐릭터를 목록에 되돌리는 동작. 서버에 저장한 뒤 화면 상태(characters)도 같이 갱신한다.
import { useCallback } from 'react';
import api from '../../api/axiosCore';
import { withHidden } from './formVisibility';

export const useRestoreHidden = ({ setCharacters }) =>
  useCallback(async (targets) => {
    const list = Array.isArray(targets) ? targets : [targets];
    if (list.length === 0) return { done: 0, failed: 0 };
    const updated = list.map((c) => withHidden(c, false));
    const results = await Promise.allSettled(updated.map((c) => api.put(`/api/characters/${c.id}`, c)));
    const okIds = new Set(updated.filter((_, i) => results[i].status === 'fulfilled').map((c) => c.id));
    if (okIds.size > 0) {
      const byId = new Map(updated.map((c) => [c.id, c]));
      setCharacters((prev) => prev.map((c) => (okIds.has(c.id) ? byId.get(c.id) : c)));
    }
    return { done: okIds.size, failed: list.length - okIds.size };
  }, [setCharacters]);

import { useRef, useEffect } from 'react';
import api from '../../api/axiosCore';
import { getGroupTags } from './characterGroups';

export const useCharacterDrag = (characters, setCharacters, groupCriteria, multiGroupMode = 'all') => {
  const draggedCharRef = useRef(null);
  const charactersRef = useRef([]);

  useEffect(() => {
    charactersRef.current = characters;
  }, [characters]);

  const handleCharDragStart = (e, char, groupName) => {
    draggedCharRef.current = { char, groupName };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', char.id);
    setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
  };

  const handleCharDragOver = (e, targetChar, groupName) => {
    e.preventDefault(); 
    const dragged = draggedCharRef.current;
    if (!dragged || dragged.char.id === targetChar.id || dragged.groupName !== groupName) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;

    setCharacters(prev => {
      const getTags = (c) => getGroupTags(c, groupCriteria, multiGroupMode);

      const inGroup = prev.filter(c => getTags(c).includes(groupName))
                          .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

      const draggedIdx = inGroup.findIndex(c => c.id === dragged.char.id);
      const targetIdx = inGroup.findIndex(c => c.id === targetChar.id);
      if (draggedIdx === -1 || targetIdx === -1) return prev;

      if (draggedIdx < targetIdx && e.clientX < midX) return prev;
      if (draggedIdx > targetIdx && e.clientX > midX) return prev;

      const newGroup = [...inGroup];
      const [removed] = newGroup.splice(draggedIdx, 1);
      newGroup.splice(targetIdx, 0, removed);

      const orderMap = new Map();
      newGroup.forEach((c, idx) => orderMap.set(c.id, idx));

      let changed = false;
      const nextState = prev.map(c => {
        if (orderMap.has(c.id)) {
          let dp = {};
          try { dp = JSON.parse(c.dynamicProperties || c._rawDynamic || "{}"); } catch(e){}
          const currentOrder = dp._groupSortOrders?.[groupName] ?? c.sortOrder;
          
          if (currentOrder !== orderMap.get(c.id)) {
            changed = true;
            if (!dp._groupSortOrders) dp._groupSortOrders = {};
            dp._groupSortOrders[groupName] = orderMap.get(c.id);
            const newDynamic = JSON.stringify(dp);
            return { ...c, sortOrder: orderMap.get(c.id), dynamicProperties: newDynamic, _rawDynamic: newDynamic };
          }
        }
        return c;
      });
      return changed ? nextState : prev;
    });
  };

  const handleCharDragEnd = async (e, groupName) => {
    e.target.style.opacity = '1';
    const dragged = draggedCharRef.current;
    draggedCharRef.current = null;
    if (!dragged) return;

    const getTags = (c) => getGroupTags(c, groupCriteria, multiGroupMode);

    const inGroup = charactersRef.current.filter(c => getTags(c).includes(groupName));
    const promises = [];

    inGroup.forEach(c => {
      let dp = {};
      try { 
        if (c.dynamicProperties) dp = JSON.parse(c.dynamicProperties);
        else if (c._rawDynamic) dp = JSON.parse(c._rawDynamic); 
      } catch(err){}
      
      const targetOrder = c.sortOrder;
      if (dp._groupSortOrders?.[groupName] !== targetOrder || dp.sortOrder !== targetOrder) {
        if (!dp._groupSortOrders) dp._groupSortOrders = {};
        dp._groupSortOrders[groupName] = targetOrder;
        dp.sortOrder = targetOrder;
        
        const newDynamic = JSON.stringify(dp);
        const payload = { ...c, dynamicProperties: newDynamic, _rawDynamic: newDynamic };
        promises.push(api.put(`/api/characters/${c.id}`, payload));
      }
    });

    if (promises.length > 0) {
      try {
        await Promise.all(promises);
        console.log(`[WorkDetailPage] '${groupName}' 그룹 위치 변동 서버 반영 완료.`);
      } catch (err) {
        console.error("순서 저장 실패:", err);
      }
    }
  };

  return { handleCharDragStart, handleCharDragOver, handleCharDragEnd };
};
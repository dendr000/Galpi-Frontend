import { useState } from 'react';
import { getNewMemoContent } from '../../../shared/utils/newMemoTemplate';

export const usePageTab = ({ memos, setMemos, currentFolder }) => {
  const [mainTabs, setMainTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitTabs, setSplitTabs] = useState([]);
  const [splitTabId, setSplitTabId] = useState(null);
  
  // ★ 신규: 스플릿 뷰 방향 제어 상태 ('vertical' | 'horizontal')
  const [splitDirection, setSplitDirection] = useState('vertical');

  const handleOpenTab = (memo, paneType = 'main') => {
    const newId = memo ? memo.id : `local_${Date.now()}`;
    let targetMemo = memo;

    if (!memo) {
      const targetFolder = currentFolder === '전체 메모' ? '기타' : currentFolder;
      targetMemo = { 
        id: newId, folder: targetFolder, 
        title: "새로운 메모", content: getNewMemoContent(targetFolder), updatedAt: Date.now(), isTrash: false 
      };
      setMemos(prev => [targetMemo, ...prev]);
    }

    if (paneType === 'main') {
      setMainTabs(prev => {
        if (!prev.find(t => String(t.id) === String(targetMemo.id))) return [...prev, targetMemo];
        return prev;
      });
      setActiveTabId(targetMemo.id);
    } else {
      setSplitTabs(prev => {
        if (!prev.find(t => String(t.id) === String(targetMemo.id))) return [...prev, targetMemo];
        return prev;
      });
      setSplitTabId(targetMemo.id);
    }
  };

  const handleCloseTab = (e, memoId, paneType = 'main') => {
    e.stopPropagation();

    if (paneType === 'main') {
      const newTabs = mainTabs.filter(t => String(t.id) !== String(memoId));
      setMainTabs(newTabs);
      if (String(activeTabId) === String(memoId)) {
        setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
      }
    } else {
      const newTabs = splitTabs.filter(t => String(t.id) !== String(memoId));
      setSplitTabs(newTabs);
      if (String(splitTabId) === String(memoId)) {
        setSplitTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
      }
      if (newTabs.length === 0) {
        setIsSplitMode(false);
      }
    }
  };

  const toggleSplitMode = () => {
    if (isSplitMode) {
      setIsSplitMode(false);
    } else {
      setIsSplitMode(true);
      if (splitTabs.length === 0 && activeTabId) {
        const currentMemo = mainTabs.find(m => String(m.id) === String(activeTabId));
        if (currentMemo) {
          setSplitTabs([currentMemo]);
          setSplitTabId(currentMemo.id);
        }
      }
    }
  };

  // ★ 신규: 방향 토글 함수
  const toggleSplitDirection = () => {
    setSplitDirection(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
  };

  // ★ 신규: 탭이 가리키는 메모 id를 바꿔치기한다. 두 가지 상황에서 쓰인다 —
  // (1) 새 메모(local_xxx)를 처음 저장해서 진짜 DB id를 받았을 때
  // (2) 에디터 안에서 다른 메모로의 내부 링크를 클릭해 같은 탭에서 그 메모로 갈아탈 때
  // activeTabId/splitTabId뿐 아니라 탭 목록 배열 안의 id도 같이 바꿔야 탭 하이라이트와
  // "탭 닫기"가 계속 올바르게 매칭된다.
  const renameTabId = (oldId, newId, paneType = 'main') => {
    if (paneType === 'main') {
      setMainTabs(prev => prev.map(t => String(t.id) === String(oldId) ? { ...t, id: newId } : t));
      setActiveTabId(prev => String(prev) === String(oldId) ? newId : prev);
    } else {
      setSplitTabs(prev => prev.map(t => String(t.id) === String(oldId) ? { ...t, id: newId } : t));
      setSplitTabId(prev => String(prev) === String(oldId) ? newId : prev);
    }
  };

  return {
    mainTabs, splitTabs, activeTabId, setActiveTabId, splitTabId, setSplitTabId,
    isSplitMode, toggleSplitMode, handleOpenTab, handleCloseTab,
    splitDirection, toggleSplitDirection, renameTabId
  };
};
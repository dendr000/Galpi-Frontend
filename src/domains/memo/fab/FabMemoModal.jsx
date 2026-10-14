// 파일 위치: src/domains/memo/fab/FabMemoModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axiosCore';
import { useModalStore } from '../../../store/useModalStore';
import FabMemoSidebar from './components/FabMemoSidebar';
import FabMemoEditor from './FabMemoEditor';
import { getNewMemoContent } from '../shared/utils/newMemoTemplate';

const FabMemoModal = ({ bpCore, globalBpList }) => {
  const { closeModal } = useModalStore();
  const [memoData, setMemoData] = useState([]);
  const [memoFolders, setMemoFolders] = useState(["기타"]);
  const [currentFolder, setCurrentFolder] = useState("기타");
  const [activeMemoId, setActiveMemoId] = useState(null);
  const [sortMap, setSortMap] = useState({});
  const [selectedTag, setSelectedTag] = useState(null);

  useEffect(() => {
    try {
      const storedSortMap = JSON.parse(localStorage.getItem('galpi-memo-sort-map'));
      if (storedSortMap) setSortMap(storedSortMap);

      let localFolders = ["기타"];
      const storedFolders = JSON.parse(localStorage.getItem('galpi-memo-folders'));
      if (storedFolders) {
        localFolders = [...new Set([...localFolders, ...storedFolders])];
      }
      setMemoFolders(localFolders);

      const storedMemos = JSON.parse(localStorage.getItem('galpi-memos')) || [];
      setMemoData(storedMemos);

      const lastId = localStorage.getItem('galpi-last-active-memo');
      if (lastId && storedMemos.find(m => String(m.id) === String(lastId))) {
        setActiveMemoId(isNaN(Number(lastId)) ? lastId : Number(lastId));
      }

      api.get('/api/memos').then(res => {
        if (res.data) {
          setMemoData(prev => {
            const localMemos = prev.filter(m => String(m.id).startsWith('local_'));
            const merged = [...localMemos, ...res.data];
            localStorage.setItem('galpi-memos', JSON.stringify(merged));
            return merged;
          });

          const dbFolders = [...new Set(res.data.map(m => m.folder).filter(Boolean))];
          const mergedFolders = [...new Set([...localFolders, ...dbFolders])];
          setMemoFolders(mergedFolders);
          localStorage.setItem('galpi-memo-folders', JSON.stringify(mergedFolders));

          // ★ localStorage 캐시엔 없었지만(그래서 위 동기 복원이 못 잡았지만) 방금 받아온
          // 서버 목록엔 있는 경우를 대비한 뒤늦은 복원인데, 이 API 응답이 돌아오기까지 몇 초
          // 걸리는 동안 사용자가 이미 다른 메모를 클릭했을 수도 있다 — 그때도 무조건 여기서
          // lastId로 되돌려버려서, 메모1 보다가 메모2를 눌러도 몇 초 뒤 메모1로 "튕기는"
          // 버그였다. prev가 아직 아무것도 안 골라진(null) 상태일 때만 복원해서, 그 사이
          // 사용자가 뭔가 이미 선택해뒀으면 절대 안 건드리게 한다.
          if (lastId && res.data.find(m => String(m.id) === String(lastId))) {
            setActiveMemoId(prev => (prev == null ? (isNaN(Number(lastId)) ? lastId : Number(lastId)) : prev));
          }
        }
      }).catch(err => {});

    } catch (e) {}
  }, []);

  useEffect(() => {
    if (memoData.length > 0 && !activeMemoId) {
      const lastId = localStorage.getItem('galpi-last-active-memo');
      if (lastId && memoData.find(m => String(m.id) === String(lastId))) {
        setActiveMemoId(isNaN(Number(lastId)) ? lastId : Number(lastId));
      } else {
        setActiveMemoId(memoData[0].id);
      }
    }
  }, [memoData, activeMemoId]);

  useEffect(() => {
    if (activeMemoId) {
      localStorage.setItem('galpi-last-active-memo', activeMemoId);
    }
  }, [activeMemoId]);

  const handleCreateMemo = useCallback(() => {
    const newId = `local_${Date.now()}`;
    const targetFolder = ["전체 메모", "최근 7일", "미분류"].includes(currentFolder) ? "기타" : currentFolder;
    const newMemo = { id: newId, folder: targetFolder, title: "새로운 메모", content: getNewMemoContent(targetFolder), updatedAt: Date.now(), sortOrder: -1 };

    setMemoData(prev => {
      const updated = [newMemo, ...prev];
      localStorage.setItem('galpi-memos', JSON.stringify(updated));
      return updated;
    });
    setActiveMemoId(newId);
  }, [currentFolder]);

  const activeMemo = memoData.find(m => String(m.id) === String(activeMemoId));

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' }}
      onClick={closeModal}
    >
      <div
        style={{ width: '1000px', maxWidth: '95vw', height: '80vh', minHeight: '600px', background: 'var(--surface-color)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', display: 'flex', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <FabMemoSidebar
          memoData={memoData} setMemoData={setMemoData}
          memoFolders={memoFolders} setMemoFolders={setMemoFolders}
          currentFolder={currentFolder} setCurrentFolder={setCurrentFolder}
          activeMemoId={activeMemoId} setActiveMemoId={setActiveMemoId}
          sortMap={sortMap} setSortMap={setSortMap}
          handleCreateMemo={handleCreateMemo}
          selectedTag={selectedTag} setSelectedTag={setSelectedTag}
        />
        <FabMemoEditor
          activeMemo={activeMemo}
          memoData={memoData} setMemoData={setMemoData}
          currentFolder={currentFolder}
          setActiveMemoId={setActiveMemoId}
          bpCore={bpCore} globalBpList={globalBpList}
        />
      </div>
    </div>
  );
};

export default FabMemoModal;
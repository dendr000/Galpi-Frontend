// 파일 위치: src/domains/memo/page/hooks/core/usePageFolder.js
// (개별 메모 삭제, 상단 고정(Pin) 토글, 그리고 다중 선택 시 발동하는 일괄 이동/삭제 API 통신 로직을 신설했습니다.)

import api from '../../../../../api/axiosCore';
import { askText } from '../../../../../utils/askText';

export const usePageFolder = ({ memos, setMemos, folders, setFolders, currentFolder, setCurrentFolder }) => {
  
  const handleAddFolder = async (parentPath = '') => {
    const promptMsg = parentPath 
      ? `[${parentPath}] 하위에 생성할 폴더명:` 
      : "새로운 최상위 폴더 이름을 입력하세요:";
    const name = await askText(promptMsg);
    
    if (name && name.trim()) {
      const newPath = parentPath ? `${parentPath}/${name.trim()}` : name.trim();
      if (!folders.includes(newPath)) {
        setFolders(prev => [...prev, newPath]);
        setCurrentFolder(newPath);
      } else {
        alert("이미 존재하는 경로입니다.");
      }
    }
  };

  const handleEditFolder = async (targetPath) => {
    const path = targetPath || currentFolder;
    if (["전체 메모", "기타"].includes(path)) return alert("기본 시스템 폴더는 이름을 수정할 수 없습니다.");
    
    const oldName = path.split('/').pop();
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    const newName = await askText("수정할 폴더 이름을 입력하세요:", oldName);
    
    if (newName && newName.trim() && newName.trim() !== oldName) {
      const finalPath = parentPath ? `${parentPath}/${newName.trim()}` : newName.trim();
      if (folders.includes(finalPath)) return alert("이미 존재하는 폴더명입니다.");
      
      setFolders(prev => prev.map(f => {
        if (f === path) return finalPath;
        if (f.startsWith(`${path}/`)) return f.replace(`${path}/`, `${finalPath}/`);
        return f;
      }));
      
      const newData = memos.map(m => {
        if (m.folder === path) return { ...m, folder: finalPath, updatedAt: Date.now() };
        if (m.folder && m.folder.startsWith(`${path}/`)) return { ...m, folder: m.folder.replace(`${path}/`, `${finalPath}/`), updatedAt: Date.now() };
        return m;
      });
      setMemos(newData);
      setCurrentFolder(finalPath);
      
      const affectedMemos = newData.filter(m => m.folder === finalPath || m.folder?.startsWith(`${finalPath}/`));
      Promise.all(affectedMemos.map(m => {
        const isEdit = !String(m.id).startsWith("local_") && String(m.id).length < 13;
        return isEdit ? api.put(`/api/memos/${m.id}`, m) : Promise.resolve();
      })).catch(e => console.warn("[usePageFolder] 폴더명 변경 동기화 실패", e));
    }
  };

  const handleDeleteFolder = async (targetPath) => {
    const path = targetPath || currentFolder;
    if (["전체 메모", "기타"].includes(path)) return alert("기본 시스템 폴더는 삭제할 수 없습니다.");
    
    if (window.confirm(`'${path}' 폴더를 삭제하시겠습니까?\n(내부에 있던 메모는 모두 '기타' 폴더로 이관됩니다)`)) {
      setFolders(prev => prev.filter(f => f !== path && !f.startsWith(`${path}/`)));
      
      const newData = memos.map(m => {
        if (m.folder === path || (m.folder && m.folder.startsWith(`${path}/`))) {
          return { ...m, folder: "기타", updatedAt: Date.now() };
        }
        return m;
      });
      setMemos(newData);
      setCurrentFolder("기타");

      const affectedMemos = newData.filter(m => m.folder === "기타");
      Promise.all(affectedMemos.map(m => {
        const isEdit = !String(m.id).startsWith("local_") && String(m.id).length < 13;
        return isEdit ? api.put(`/api/memos/${m.id}`, m) : Promise.resolve();
      })).catch(e => console.warn("[usePageFolder] 폴더 삭제 동기화 실패", e));
    }
  };

  // ★ 상단 고정(Pin) 토글 로직
  const handleTogglePin = async (e, memo) => {
    e.stopPropagation();
    const newPinnedStatus = !memo.isPinned;
    const updatedMemo = { ...memo, isPinned: newPinnedStatus, updatedAt: Date.now() };

    setMemos(prev => prev.map(m => String(m.id) === String(memo.id) ? updatedMemo : m));

    try {
      const isEdit = !String(memo.id).startsWith("local_") && String(memo.id).length < 13;
      if (isEdit) await api.put(`/api/memos/${memo.id}`, updatedMemo);
    } catch (err) {
      console.error("[usePageFolder] 상단 고정 상태 동기화 실패", err);
    }
  };

  // ★ 퀵 액션: 단일 메모 즉시 삭제. 취소 여부를 알아야 호출부(에디터의 삭제 버튼)에서 탭을
  // 같이 닫을지 판단할 수 있어서, 실제로 삭제를 진행했는지를 boolean으로 돌려준다.
  const handleDeleteMemo = async (e, memoId) => {
    e.stopPropagation();
    if (!window.confirm("정말 이 메모를 영구 삭제하시겠습니까?")) return false;
    setMemos(prev => prev.filter(m => String(m.id) !== String(memoId)));
    try {
      const isEdit = !String(memoId).startsWith("local_") && String(memoId).length < 13;
      if (isEdit) await api.delete(`/api/memos/${memoId}`);
    } catch (err) {
      console.error("[usePageFolder] 메모 삭제 통신 오류", err);
    }
    return true;
  };

  // ★ 다중 선택: 일괄 폴더 이동
  const handleBatchMove = async (memoIds, targetFolder) => {
    const updatedMemos = memos.map(m => 
      memoIds.includes(m.id) ? { ...m, folder: targetFolder, updatedAt: Date.now() } : m
    );
    setMemos(updatedMemos);

    try {
      const promises = memoIds.map(id => {
        const isEdit = !String(id).startsWith("local_") && String(id).length < 13;
        const targetMemo = updatedMemos.find(m => m.id === id);
        return isEdit ? api.put(`/api/memos/${id}`, targetMemo) : Promise.resolve();
      });
      await Promise.all(promises);
    } catch (err) {
      console.error("[usePageFolder] 일괄 이동 통신 오류", err);
    }
  };

  // ★ 다중 선택: 일괄 삭제
  const handleBatchDelete = async (memoIds) => {
    if (window.confirm(`선택한 ${memoIds.length}개의 메모를 영구 삭제하시겠습니까?`)) {
      setMemos(prev => prev.filter(m => !memoIds.includes(m.id)));

      try {
        const promises = memoIds.map(id => {
          const isEdit = !String(id).startsWith("local_") && String(id).length < 13;
          return isEdit ? api.delete(`/api/memos/${id}`) : Promise.resolve();
        });
        await Promise.all(promises);
      } catch (err) {
        console.error("[usePageFolder] 일괄 삭제 통신 오류", err);
      }
    }
  };

  return { 
    handleAddFolder, handleEditFolder, handleDeleteFolder,
    handleTogglePin, handleDeleteMemo, handleBatchMove, handleBatchDelete
  };
};
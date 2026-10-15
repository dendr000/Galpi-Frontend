// 파일 위치: src/domains/memo/fab/hooks/useFabMemoFolder.js
import api from '../../../../api/axiosCore';
import { askText } from '../../../../utils/askText';

export const useFabMemoFolder = ({ memoData, setMemoData, memoFolders, setMemoFolders, currentFolder, setCurrentFolder }) => {
  
  // ★ "웹툰"/"소설" 바로 밑에 새 작품 폴더를 만들 때마다, 그 밑에 "등장인물"/"사전"/"주인공" 폴더와 항상
  // 손으로 똑같이 만들던 초기 메모들("00 ", "01 파랑"... / "정보" / "능력", "아이템")까지
  // 한 번에 자동 생성한다.
  const createWorkScaffold = async (basePath) => {
    const charFolder = `${basePath}/등장인물`;
    const dictFolder = `${basePath}/사전`;
    const heroFolder = `${basePath}/주인공`;

    const newFolders = [...memoFolders, basePath, charFolder, dictFolder, heroFolder];
    setMemoFolders(newFolders);
    localStorage.setItem('galpi-memo-folders', JSON.stringify(newFolders));

    const scaffold = [
      ...['00 ', '01 파랑', '02 초록', '03 노랑', '04 빨강'].map(title => ({ folder: charFolder, title })),
      ...['정보'].map(title => ({ folder: dictFolder, title })),
      ...['능력', '아이템'].map(title => ({ folder: heroFolder, title })),
    ];
    const baseTime = Date.now();

    const created = await Promise.all(scaffold.map(async ({ folder, title }, i) => {
      const memoPayload = {
        title, content: '', folder,
        updatedAt: baseTime + i, sortOrder: -1,
        canvasX: 2500, canvasY: 2500,
        themeColor: 'var(--surface-color)', tags: ''
      };
      try {
        const res = await api.post('/api/memos', memoPayload);
        return { ...memoPayload, id: res.data?.id ?? `local_${baseTime}_${i}` };
      } catch (e) {
        console.error('[useFabMemoFolder] 작품 초기 메모 자동 생성 실패:', e);
        return { ...memoPayload, id: `local_${baseTime}_${i}` };
      }
    }));

    const updatedMemoData = [...created, ...memoData];
    setMemoData(updatedMemoData);
    localStorage.setItem('galpi-memos', JSON.stringify(updatedMemoData));
    setCurrentFolder(charFolder);
  };

  const handleAddFolder = async (parentPath = '') => {
    const promptMsg = parentPath
      ? `[${parentPath}] 하위에 생성할 폴더명:`
      : "새로운 최상위 폴더 이름을 입력하세요:";

    const name = await askText(promptMsg);

    if (name && name.trim()) {
      const newPath = parentPath ? `${parentPath}/${name.trim()}` : name.trim();

      if (memoFolders.includes(newPath)) {
        return alert("이미 존재하는 경로입니다.");
      }

      if (parentPath === '웹툰' || parentPath === '소설') {
        await createWorkScaffold(newPath);
      } else {
        const newFolders = [...memoFolders, newPath];
        setMemoFolders(newFolders);
        localStorage.setItem('galpi-memo-folders', JSON.stringify(newFolders));
        setCurrentFolder(newPath);
      }
    }
  };

  const handleEditFolder = async (targetPath) => {
    const path = targetPath || currentFolder;
    if (["기타"].includes(path)) {
      return alert("기본 시스템 폴더는 이름을 수정할 수 없습니다.");
    }

    const oldName = path.split('/').pop();
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    
    const newName = await askText("수정할 폴더 이름을 입력하세요:", oldName);
    
    if (newName && newName.trim() && newName.trim() !== oldName) {
      const finalPath = parentPath ? `${parentPath}/${newName.trim()}` : newName.trim();
      
      if (memoFolders.includes(finalPath)) return alert("이미 존재하는 폴더명입니다.");
      
      const newFolders = memoFolders.map(f => {
        if (f === path) return finalPath;
        if (f.startsWith(`${path}/`)) return f.replace(`${path}/`, `${finalPath}/`);
        return f;
      });
      
      setMemoFolders(newFolders);
      localStorage.setItem('galpi-memo-folders', JSON.stringify(newFolders));
      
      const newData = memoData.map(m => {
        if (m.folder === path) return { ...m, folder: finalPath, updatedAt: Date.now() };
        if (m.folder && m.folder.startsWith(`${path}/`)) return { ...m, folder: m.folder.replace(`${path}/`, `${finalPath}/`), updatedAt: Date.now() };
        return m;
      });
      
      setMemoData(newData);
      localStorage.setItem('galpi-memos', JSON.stringify(newData));
      setCurrentFolder(finalPath);
    }
  };

  const handleDeleteFolder = async (targetPath) => {
    const path = targetPath || currentFolder;
    if (["기타"].includes(path)) {
      return alert("기본 시스템 폴더는 삭제할 수 없습니다.");
    }
    
    const deleteKeyword = import.meta.env.VITE_DELETE_KEYWORD || 'delete';
    const pass = await window.openSafeDeleteModal(`'${path}' 폴더와 그 하위 폴더를 삭제하시겠습니까?\n(내부에 있던 메모는 모두 '기타' 폴더로 자동 이동됩니다)`);

    if (pass === deleteKeyword) {
      const newFolders = memoFolders.filter(f => f !== path && !f.startsWith(`${path}/`));
      setMemoFolders(newFolders);
      localStorage.setItem('galpi-memo-folders', JSON.stringify(newFolders));
      
      const newData = memoData.map(m => {
        if (m.folder === path || (m.folder && m.folder.startsWith(`${path}/`))) {
          return { ...m, folder: "기타", updatedAt: Date.now() };
        }
        return m;
      });
      
      setMemoData(newData);
      localStorage.setItem('galpi-memos', JSON.stringify(newData));
      setCurrentFolder("기타");
    } else if (pass !== null) {
      alert("입력값이 일치하지 않아 삭제가 취소되었습니다.");
    }
  };

  return { handleAddFolder, handleEditFolder, handleDeleteFolder };
};
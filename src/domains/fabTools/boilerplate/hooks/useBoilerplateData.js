// 파일 위치: src/domains/fabTools/hooks/useBoilerplateData.js
// 기능 요약: 상용구 폴더 관리, 환경설정 로컬 저장소 동기화, 벌크 매크로 제어 및 전역 동기화(Sync) 발송 훅
// 버전: v2.2.0 (실시간 전역 동기화 이벤트 탑재)

import { useState, useEffect } from 'react';
import api from '../../../../api/axiosCore';
import { RESET_ON_CLOSE_KEY, isResetOnCloseEnabled, resetActiveFolderIfEnabled } from '../utils/activeFolder';

export const useBoilerplateData = (showToast) => {
  const [bpList, setBpList] = useState([]);
  const [bpFolders, setBpFolders] = useState(() => {
    const stored = localStorage.getItem('galpi-bp-folders');
    return stored ? JSON.parse(stored) : ['전체', '공통', '무협', '판타지', '현대'];
  });
  const [activeFolder, setActiveFolder] = useState(() => localStorage.getItem('galpi-bp-active-folder') || '전체');
  
  const [bpInput, setBpInput] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  
  const [bpBulk, setBpBulk] = useState('');
  const [isBpBulkMode, setIsBpBulkMode] = useState(false);

  const [isBpAuto, setIsBpAuto] = useState(() => localStorage.getItem('galpi-bp-auto') !== 'false');
  const [isBpPreview, setIsBpPreview] = useState(() => localStorage.getItem('galpi-bp-preview') !== 'false');
  // 모달을 닫을 때 활성 폴더를 '전체'로 자동 복귀시킬지(기본 켜짐) — 폴더를 정리하려고 골라 둔 채
  // 닫아도 다른 폴더의 상용구가 에디터에서 안 먹히는 일이 없도록.
  const [isBpResetOnClose, setIsBpResetOnClose] = useState(() => isResetOnCloseEnabled(localStorage));

  useEffect(() => {
    fetchBoilerplates();
  }, []);

  const fetchBoilerplates = async () => {
    try {
      const res = await api.get('/api/boilerplates');
      setBpList(res.data);
    } catch (e) {}
  };

  // ★ 전역 스캐너들에게 데이터가 변경되었음을 알리는 핑(Ping) 발송 함수
  const broadcastSync = () => {
    window.dispatchEvent(new Event('galpi-bp-sync'));
  };

  const changeFolder = (folder) => {
    setActiveFolder(folder);
    localStorage.setItem('galpi-bp-active-folder', folder);
  };

  const toggleBpAuto = (e) => {
    setIsBpAuto(e.target.checked);
    localStorage.setItem('galpi-bp-auto', String(e.target.checked));
  };

  const toggleBpPreview = (e) => {
    setIsBpPreview(e.target.checked);
    localStorage.setItem('galpi-bp-preview', String(e.target.checked));
  };

  const toggleBpResetOnClose = (e) => {
    setIsBpResetOnClose(e.target.checked);
    localStorage.setItem(RESET_ON_CLOSE_KEY, String(e.target.checked));
  };

  // 모달이 닫힐 때 BoilerplateModal 이 호출. 체크 직후에도 저장소 값을 직접 읽어서(React 상태가
  // 아니라) 판단하므로 방금 바꾼 설정이 바로 반영된다.
  const resetFolderOnClose = () => resetActiveFolderIfEnabled(localStorage);

  const handleAddFolder = () => {
    const name = prompt("새 폴더명을 입력하세요:");
    if (name && name.trim() && !bpFolders.includes(name.trim()) && name !== '전체') {
      const newFolders = [...bpFolders, name.trim()];
      setBpFolders(newFolders);
      localStorage.setItem('galpi-bp-folders', JSON.stringify(newFolders));
      changeFolder(name.trim());
    }
  };

  const handleEditFolder = async () => {
    const target = activeFolder === '전체' ? '공통' : activeFolder;
    if (target === '공통') return alert("기본 폴더는 수정할 수 없습니다.");
    
    const newName = prompt("수정할 이름을 입력하세요:", target);
    if (newName && newName.trim() && newName.trim() !== target) {
      const finalName = newName.trim();
      if (bpFolders.includes(finalName)) return alert("이미 존재하는 폴더명입니다.");

      const newFolders = bpFolders.map(f => f === target ? finalName : f);
      setBpFolders(newFolders);
      localStorage.setItem('galpi-bp-folders', JSON.stringify(newFolders));

      const updatedBps = bpList.map(bp => bp.category === target ? { ...bp, category: finalName } : bp);
      setBpList(updatedBps);

      const affected = updatedBps.filter(bp => bp.category === finalName);
      Promise.all(affected.map(bp => api.put(`/api/boilerplates/${bp.id}`, bp)))
        .then(broadcastSync)
        .catch(() => {});
      
      changeFolder(finalName);
    }
  };

  const handleDeleteFolder = async () => {
    const target = activeFolder === '전체' ? '공통' : activeFolder;
    if (target === '공통') return alert("'공통' 폴더는 삭제할 수 없습니다.");
    
    if (window.confirm(`'${target}' 폴더를 삭제하시겠습니까?\n내부에 있던 상용구는 '공통' 폴더로 이동됩니다.`)) {
      const newFolders = bpFolders.filter(f => f !== target);
      setBpFolders(newFolders);
      localStorage.setItem('galpi-bp-folders', JSON.stringify(newFolders));

      const updatedBps = bpList.map(bp => bp.category === target ? { ...bp, category: '공통' } : bp);
      setBpList(updatedBps);

      const affected = bpList.filter(bp => bp.category === target);
      Promise.all(affected.map(bp => api.put(`/api/boilerplates/${bp.id}`, { ...bp, category: '공통' })))
        .then(broadcastSync)
        .catch(() => {});
      
      changeFolder('전체');
    }
  };

  const handleBpSave = async () => {
    const title = bpInput.title.trim();
    const content = bpInput.content;
    const cat = activeFolder === '전체' ? '공통' : activeFolder;

    if (!title || !content.trim()) return alert("발동 단축어 키워드와 원고 본문을 입력하세요.");
    if (title.includes("\n")) return alert("단축어에는 줄바꿈을 쓸 수 없습니다.");

    const isEdit = editingId !== null;

    if (bpList.some(b => b.title === title && b.category === cat && b.id !== editingId)) {
      return alert("해당 폴더에 이미 존재하는 단축어입니다.");
    }

    const payload = { title, content, category: cat };

    try {
      if (isEdit) {
        await api.put(`/api/boilerplates/${editingId}`, payload);
        setBpList(prev => prev.map(b => b.id === editingId ? { ...b, ...payload } : b));
        showToast("상용구 양식이 수정되었습니다.");
      } else {
        const res = await api.post('/api/boilerplates', payload);
        setBpList(prev => [...prev, res.data]);
        showToast("스마트 오토 상용구 서식 등록에 성공했습니다.");
      }
      broadcastSync(); // ★ 동기화 핑 발송
      handleBpCancelEdit();
    } catch (e) {}
  };

  const handleBpEdit = (bp) => {
    setEditingId(bp.id);
    setBpInput({ title: bp.title, content: bp.content });
    if (activeFolder !== '전체' && activeFolder !== bp.category) {
      changeFolder(bp.category);
    }
  };

  const handleBpCancelEdit = () => {
    setEditingId(null);
    setBpInput({ title: '', content: '' });
  };

  const handleBpDelete = async (id, title) => {
    if (window.confirm(`[${title}] 상용구를 완전히 제거합니까?`)) {
      try {
        await api.delete(`/api/boilerplates/${id}`);
        setBpList(prev => prev.filter(x => x.id !== id));
        showToast("단축 상용구 양식이 제거되었습니다.");
        broadcastSync(); // ★ 동기화 핑 발송
        if (editingId === id) handleBpCancelEdit();
      } catch (e) {}
    }
  };

  const handleBpBulk = async () => {
    if (!bpBulk.trim()) return alert("상용구 대량 등록용 텍스트가 비어있습니다.");
    const targetCat = activeFolder === '전체' ? '공통' : activeFolder;
    const lines = bpBulk.split('\n');
    let count = 0;
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      let title = ""; let content = "";
      
      if (line.includes('::::')) {
        const p = line.split('::::');
        title = p[0].trim(); content = p.slice(1).join('::::').trim();
      } else {
        const match = line.match(/^([^\(\)]+)\(([^\(\)]+)\)$/);
        if (match) {
           let k = match[1].trim(); let v = match[2].trim();
           if (/[가-힣]/.test(v) && !/[가-힣]/.test(k)) { k = match[2].trim(); v = match[1].trim(); }
           title = k; content = `${k}(${v})`;
        }
      }
      
      if (title && content && !bpList.some(b => b.title === title && b.category === targetCat)) {
        await api.post('/api/boilerplates', { title, content, category: targetCat });
        count++;
      }
    }

    if (count > 0) {
      await fetchBoilerplates();
      setBpBulk('');
      setIsBpBulkMode(false);
      showToast(`총 ${count}개의 문장형 상용구 인프라 배포 완료!`);
      broadcastSync(); // ★ 동기화 핑 발송
    } else {
      alert("배포 가능한 가용 라인이 존재하지 않거나 기존 원장과 중복됩니다.");
    }
  };

  const filteredList = bpList.filter(bp => activeFolder === '전체' ? true : bp.category === activeFolder);

  return {
    bpList: filteredList, bpFolders, activeFolder, changeFolder,
    handleAddFolder, handleEditFolder, handleDeleteFolder,
    bpInput, setBpInput, editingId, handleBpSave, handleBpEdit, handleBpCancelEdit, handleBpDelete,
    bpBulk, setBpBulk, isBpBulkMode, setIsBpBulkMode, handleBpBulk,
    isBpAuto, isBpPreview, toggleBpAuto, toggleBpPreview,
    isBpResetOnClose, toggleBpResetOnClose, resetFolderOnClose
  };
};
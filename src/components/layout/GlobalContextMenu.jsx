// 파일 위치: src/components/layout/GlobalContextMenu.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosCore';
import { IconEyeOff } from '../common/icons/DomainIcons';
import { getIncludeHidden, setIncludeHidden } from './search/searchSettings';
import Icon from '../common/icons/Icon';

const RECENT_EXCLUDED_KEY = 'galpi-recent-excluded';
const isRecentExcluded = (id) => {
  try { return JSON.parse(localStorage.getItem(RECENT_EXCLUDED_KEY) || '[]').includes(String(id)); } catch (e) { return false; }
};

const GlobalContextMenu = () => {
  const [menu, setMenu] = useState({ isOpen: false, x: 0, y: 0, selectedText: '', recentWorkId: null, recentWorkTitle: '' });
  const [isSavePrevented, setIsSavePrevented] = useState(() => localStorage.getItem('galpi-prevent-save') !== 'false');
  const [includeHiddenInSearch, setIncludeHiddenInSearch] = useState(getIncludeHidden);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleContextMenu = useCallback((e) => {
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      
      const selection = window.getSelection().toString().trim();
      // "최근 열람 작품" 모달의 행에서 눌렀으면(FAB) 그 작품을 목록에 숨길지/보일지 정하는
      // 항목을 메뉴에 얹어준다 — data-galpi-recent-id는 RecentModal.jsx가 각 행에 심어둔다.
      const recentRow = e.target.closest('[data-galpi-recent-id]');
      const recentWorkId = recentRow?.getAttribute('data-galpi-recent-id') || null;
      const recentWorkTitle = recentRow?.getAttribute('data-galpi-recent-title') || '';
      let posX = e.clientX;
      let posY = e.clientY;

      const menuWidth = 220;
      const menuHeight = 350;
      if (posX + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 10;
      if (posY + menuHeight > window.innerHeight) posY = window.innerHeight - menuHeight - 10;

      setMenu({ isOpen: true, x: posX, y: posY, selectedText: selection, recentWorkId, recentWorkTitle });
    }
  }, []);

  const handleClickOutside = useCallback(() => {
    if (menu.isOpen) setMenu(prev => ({ ...prev, isOpen: false }));
  }, [menu.isOpen]);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleContextMenu, handleClickOutside]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        if (isSavePrevented) {
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSavePrevented]);

  const toggleRecentExcluded = () => {
    const id = String(menu.recentWorkId);
    let excluded = [];
    try { excluded = JSON.parse(localStorage.getItem(RECENT_EXCLUDED_KEY) || '[]'); } catch (e) {}
    const next = excluded.includes(id) ? excluded.filter(x => x !== id) : [...excluded, id];
    localStorage.setItem(RECENT_EXCLUDED_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('galpi-recent-excluded-changed'));
    setMenu(prev => ({ ...prev, isOpen: false }));
  };

  // 헤더 검색 추천에 숨김 분류 작품을 넣을지 — 저장하고 이벤트로 열려 있는 검색창에 바로 알린다.
  const toggleIncludeHiddenInSearch = () => {
    const nextState = !includeHiddenInSearch;
    setIncludeHiddenInSearch(nextState);
    setIncludeHidden(nextState);
    setMenu(prev => ({ ...prev, isOpen: false }));
  };

  const toggleSavePrevention = () => {
    const nextState = !isSavePrevented;
    setIsSavePrevented(nextState);
    localStorage.setItem('galpi-prevent-save', String(nextState));
    setMenu(prev => ({ ...prev, isOpen: false }));
  };

  const addSelectionToMemo = () => {
    const text = menu.selectedText;
    if (!text) return;
    
    let currentMemoData = [];
    try { currentMemoData = JSON.parse(localStorage.getItem('galpi-memos') || '[]'); } catch(e){}
    
    const newMemoId = Date.now();
    const shortTitle = text.length > 12 ? text.substring(0, 12) + "..." : text;
    currentMemoData.unshift({ 
      id: newMemoId, 
      folder: "기타",
      title: shortTitle, 
      content: text, 
      updatedAt: newMemoId, 
      sortOrder: -1 
    });
    
    localStorage.setItem('galpi-memos', JSON.stringify(currentMemoData));
    try { window.getSelection().removeAllRanges(); } catch(e){}
    setMenu(prev => ({ ...prev, isOpen: false }));
    alert("'기타' 탭에 메모가 안전하게 저장되었습니다!"); // ★ 알림 텍스트 수정
  };

  const workPathMatch = location.pathname.match(/^\/work\/(\d+)/);
  const isWorkDetailPage = !!workPathMatch;
  const currentWorkId = workPathMatch ? workPathMatch[1] : null;

  const deleteKeyword = import.meta.env.VITE_DELETE_KEYWORD || 'delete';

  // window.prompt()는 Electron(exe)이 지원하지 않아 호출해도 아무 일도 안 일어난다 — 그래서
  // 확인 문구 입력은 앱 안의 모달로 받는다.
  const handleSecretDeleteWork = () => {
    if (!currentWorkId) return;
    setMenu(prev => ({ ...prev, isOpen: false }));
    setDeleteDialog({ workId: currentWorkId, input: '', error: '', busy: false });
  };

  const confirmDeleteWork = async () => {
    if (!deleteDialog || deleteDialog.busy) return;
    if (deleteDialog.input !== deleteKeyword) {
      setDeleteDialog(prev => ({ ...prev, error: '입력한 문구가 정확하지 않습니다. 삭제하지 않았습니다.' }));
      return;
    }
    setDeleteDialog(prev => ({ ...prev, busy: true, error: '' }));
    try {
      console.log(`[GlobalContextMenu] 작품 ID: ${deleteDialog.workId} 원장 파괴 통신 개시.`);
      await api.delete(`/api/works/${deleteDialog.workId}`);
      setDeleteDialog(null);
      alert("작품 데이터가 안전하게 파기되었습니다.");
      navigate('/');
    } catch (err) {
      console.error("[GlobalContextMenu] 작품 파괴 중 통신 예외 발생:", err);
      setDeleteDialog(prev => ({ ...prev, busy: false, error: '삭제 요청이 거부되었습니다. 백엔드를 확인하세요.' }));
    }
  };

  const deleteDialogEl = deleteDialog && (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onKeyDown={(e) => { if (e.key === 'Escape') setDeleteDialog(null); }}
    >
      <div style={{ background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '24px', width: 'min(460px, 90vw)', boxShadow: '0 10px 40px rgba(0,0,0,0.35)' }}>
        <div style={{ fontSize: '16px', fontWeight: 900, color: '#e53e3e', marginBottom: '10px' }}>
          <Icon name="warning" lead /> 현재 작품 영구 삭제
        </div>
        <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '14px' }}>
          이 작품을 시스템에서 완전히 삭제합니다. <b style={{ color: '#e53e3e' }}>소속 등장인물도 함께 삭제</b>되며 되돌릴 수 없습니다.<br />
          삭제하려면 아래 칸에 <b style={{ color: 'var(--text-primary)' }}>{deleteKeyword}</b> 를 입력하세요.
        </div>
        <input
          autoFocus
          type="text"
          value={deleteDialog.input}
          onChange={(e) => setDeleteDialog(prev => ({ ...prev, input: e.target.value, error: '' }))}
          onKeyDown={(e) => { if (e.key === 'Enter') confirmDeleteWork(); }}
          placeholder={deleteKeyword}
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color, var(--surface-color))', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
        />
        <div style={{ minHeight: '20px', marginTop: '8px', fontSize: '12.5px', color: '#e53e3e', fontWeight: 700 }}>{deleteDialog.error}</div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button onClick={() => setDeleteDialog(null)} disabled={deleteDialog.busy} style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>취소</button>
          <button onClick={confirmDeleteWork} disabled={deleteDialog.busy} style={{ padding: '9px 18px', borderRadius: '6px', border: 'none', background: '#e53e3e', color: '#fff', fontWeight: 900, cursor: 'pointer', opacity: deleteDialog.busy ? 0.6 : 1 }}>{deleteDialog.busy ? '삭제 중...' : '영구 삭제'}</button>
        </div>
      </div>
    </div>
  );

  if (!menu.isOpen) return deleteDialogEl || null;

  const isCategoryPage = location.pathname.includes('/category');

  return (
    <div style={{
      position: 'fixed', top: menu.y, left: menu.x, background: 'var(--surface-color)', border: '1px solid var(--border-color)', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.15)', borderRadius: '8px', padding: '6px 0', zIndex: 999999, minWidth: '200px', display: 'flex', flexDirection: 'column'
    }}>
      <div className="context-item" onClick={() => { window.history.back(); setMenu(prev => ({...prev, isOpen: false})); }}>
        <Icon name="arrow-left" lead /> 뒤로 가기
      </div>
      <div className="context-item" onClick={() => { window.history.forward(); setMenu(prev => ({...prev, isOpen: false})); }}>
        <Icon name="arrow-right" lead /> 앞으로 가기
      </div>
      <div className="context-item" onClick={() => { window.location.reload(); setMenu(prev => ({...prev, isOpen: false})); }}>
        <Icon name="refresh" lead /> 페이지 새로고침
      </div>
      
      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
      
      <div className="context-item" onClick={() => { window.scrollTo({top:0, behavior:'smooth'}); setMenu(prev => ({...prev, isOpen: false})); }}>
        <Icon name="arrow-up" lead /> 화면 최상단으로
      </div>
      <div className="context-item" onClick={() => { window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'}); setMenu(prev => ({...prev, isOpen: false})); }}>
        <Icon name="arrow-down" lead /> 화면 최하단으로
      </div>

      {menu.selectedText && (
        <>
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
          <div className="context-item" onClick={addSelectionToMemo} style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
            <Icon name="edit" lead /> 선택 문구 새 메모로
          </div>
        </>
      )}

      {menu.recentWorkId && (
        <>
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
          <div className="context-item" onClick={toggleRecentExcluded} style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
            <IconEyeOff size={14} />
            {isRecentExcluded(menu.recentWorkId) ? `"${menu.recentWorkTitle}" 최근 목록에 표시` : `"${menu.recentWorkTitle}" 최근 목록에서 숨기기`}
          </div>
        </>
      )}

      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

      <div className="context-item" onClick={toggleSavePrevention}>
        {isSavePrevented
          ? <><Icon name="ban" lead /> Ctrl+S 무시 켜짐 (끄기)</>
          : <><Icon name="warning" lead /> Ctrl+S 무시 꺼짐 (켜기)</>}
      </div>

      <div className="context-item" onClick={toggleIncludeHiddenInSearch}>
        {includeHiddenInSearch ? '숨김 작품 검색 켜짐' : '숨김 작품 검색 꺼짐'}
      </div>

      {isCategoryPage && (
        <>
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
          <div className="context-item" style={{ color: '#e53e3e', background: 'rgba(229,62,62,0.05)', fontWeight: 900 }} onClick={async () => {
            setMenu(prev => ({...prev, isOpen: false}));
            // 숨김 분류의 원본은 DB다(localStorage엔 아무도 안 쓴다). 조회가 실패하면 "없다"고 단정하지
            // 않고 금고 화면을 그냥 열어서 그쪽이 직접 목록을 불러오게 한다.
            let hiddenCats = null;
            try {
              const { data } = await api.get('/api/hidden-categories');
              if (Array.isArray(data)) hiddenCats = data;
            } catch { /* 아래에서 금고를 그대로 연다 */ }
            if (hiddenCats && hiddenCats.length === 0) {
              alert("현재 메인 화면에서 숨김 처리된 분류가 없습니다.");
              return;
            }
            window.dispatchEvent(new Event('galpi-trigger-secret-mode'));
          }}>
            <Icon name="eye" lead /> 비밀 금고 열람 (필터링)
          </div>
        </>
      )}

      {isWorkDetailPage && (
        <>
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
          <div className="context-item secret-delete-item" style={{ color: '#e53e3e', fontWeight: 900 }} onClick={handleSecretDeleteWork}>
            <Icon name="trash" lead /> 현재 작품 영구 삭제
          </div>
        </>
      )}

      <style>{`
        .context-item { padding: 10px 16px; font-size: 13px; font-weight: bold; color: var(--text-primary); cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
        .context-item:hover { background: var(--table-bg-alt); }
        .secret-delete-item:hover { background: rgba(229, 62, 62, 0.08) !important; }
      `}</style>
    </div>
  );
};

export default GlobalContextMenu;
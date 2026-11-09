import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PageMemo.module.css';

import PageMemoHeader from './components/PageMemoHeader';
import PageMemoSidebar from './components/PageMemoSidebar';
import PageMemoTabList from './components/PageMemoTabList';
import PageMemoBbsList from './components/PageMemoBbsList';
import PageMemoEditorPane from './PageMemoEditorPane';

import { usePageMemoData } from './hooks/usePageMemoData';
import { XIcon } from '../shared/components/MemoIcons';

const PageMemoMain = () => {
  const {
    memos, setMemos, folders, currentFolder, setCurrentFolder,
    filteredMemos, paginatedMemos,
    searchQuery, setSearchQuery, searchScope, setSearchScope, selectedTag, setSelectedTag,
    handleAddFolder, handleEditFolder, handleDeleteFolder,
    sortType, setSortType, itemsPerPage, setItemsPerPage,
    currentPage, setCurrentPage, totalPages,
    mainTabs, splitTabs, activeTabId, setActiveTabId, splitTabId, setSplitTabId,
    isSplitMode, toggleSplitMode, handleOpenTab, handleCloseTab,
    splitDirection, toggleSplitDirection, renameTabId,
    checkedMemoIds, setCheckedMemoIds, handleTogglePin, handleDeleteMemo, 
    handleBatchMove, handleBatchDelete
  } = usePageMemoData();

  const [isTreeOpen, setIsTreeOpen] = useState(true);
  
  const [editData, setEditData] = useState({ title: '', folder: '기타' });
  const [splitEditData, setSplitEditData] = useState({ title: '', folder: '기타' });

  useEffect(() => {
    if (activeTabId) {
      const target = memos.find(m => String(m.id) === String(activeTabId));
      if (target) setEditData({ title: target.title, folder: target.folder || '기타' });
    }
  }, [activeTabId, memos]);

  useEffect(() => {
    if (splitTabId) {
      const target = memos.find(m => String(m.id) === String(splitTabId));
      if (target) setSplitEditData({ title: target.title, folder: target.folder || '기타' });
    }
  }, [splitTabId, memos]);

  return (
    <div style={{ overflow: 'hidden', height: 'calc(100vh - var(--app-menubar-h))', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .galpi-outer-select [contenteditable="false"] { opacity: 0.4; filter: grayscale(100%); transition: 0.2s; }
        .galpi-outer-select [contenteditable="false"] *::selection { background: transparent !important; color: inherit !important; }
        .galpi-outer-select [contenteditable="false"] *::-moz-selection { background: transparent !important; color: inherit !important; }
        #memo-edit-content p { margin: 0.3em 0 !important; }
        #memo-edit-content div { margin-top: 0; margin-bottom: 0; }
        /* ★ 표 무한 팽창 방지 및 강제 줄바꿈 족쇄 — FAB 에디터(MemoEditorBody.jsx)엔 있었는데
           페이지 에디터(PageMemoEditorPane.jsx)는 별도 구현이라 이 방어막이 빠져있었다.
           표에 내용이 많이 들어가면 줄바꿈 안 되고 오른쪽으로 뚫고 나가던 버그가 이것 때문. */
        #memo-edit-content table { max-width: 100% !important; table-layout: auto !important; }
        #memo-edit-content th, #memo-edit-content td { white-space: pre-wrap !important; word-break: break-word !important; }
        .galpi-tree-folder .folder-actions { opacity: 0; pointer-events: none; transition: opacity 0.1s; }
        .galpi-tree-folder:hover .folder-actions { opacity: 1; pointer-events: auto; }
        .galpi-tree-folder .folder-actions button:hover { background: var(--border-color) !important; border-radius: 4px; }
      `}</style>

      {/* ★ 추출한 검색 스코프 상태를 헤더에 프롭스로 주입 */}
      <PageMemoHeader 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        searchScope={searchScope}
        setSearchScope={setSearchScope}
        handleOpenTab={handleOpenTab} 
      />

      {selectedTag && (
        <div style={{ padding: '10px 20px', background: 'var(--table-bg-alt)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10 }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary-color)' }}>#{selectedTag} 태그 필터링 결과</span>
          <button className="wiki-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '11px', background: 'var(--surface-color)' }} onClick={() => setSelectedTag(null)}>
            <XIcon /> 필터 해제
          </button>
        </div>
      )}

      <div className={styles.memoWorkspaceContainer}>
        <PageMemoSidebar 
          styles={styles} isTreeOpen={isTreeOpen} setIsTreeOpen={setIsTreeOpen}
          folders={folders} currentFolder={currentFolder} setCurrentFolder={setCurrentFolder}
          memos={memos} handleAddFolder={handleAddFolder} handleEditFolder={handleEditFolder} handleDeleteFolder={handleDeleteFolder}
        />

        <div className={styles.memoViewport} style={{ paddingLeft: isTreeOpen ? '300px' : '30px', display: 'flex', flexDirection: isSplitMode && splitDirection === 'horizontal' ? 'row' : 'column' }}>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
            <PageMemoTabList 
              openedTabs={mainTabs} activeTabId={activeTabId} setActiveTabId={setActiveTabId} 
              handleCloseTab={handleCloseTab} isSplitMode={isSplitMode} toggleSplitMode={toggleSplitMode} 
              splitDirection={splitDirection} toggleSplitDirection={toggleSplitDirection} paneType="main"
            />
            
            {activeTabId ? (
              <PageMemoEditorPane
                activeMemoId={activeTabId} editData={editData} setEditData={setEditData}
                folders={folders} currentFolder={currentFolder} handleCloseTab={handleCloseTab}
                memos={memos} setMemos={setMemos} paneType="main"
                renameTabId={renameTabId} deleteMemo={handleDeleteMemo}
              />
            ) : (
              <PageMemoBbsList 
                folders={folders}
                filteredMemos={filteredMemos} paginatedMemos={paginatedMemos}
                sortType={sortType} setSortType={setSortType}
                itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage}
                currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages}
                handleOpenTab={handleOpenTab} setSelectedTag={setSelectedTag}
                checkedMemoIds={checkedMemoIds} setCheckedMemoIds={setCheckedMemoIds}
                handleTogglePin={handleTogglePin} handleDeleteMemo={handleDeleteMemo}
                handleBatchMove={handleBatchMove} handleBatchDelete={handleBatchDelete}
              />
            )}
          </div>

          {isSplitMode && (
            <div style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, 
              borderTop: splitDirection === 'vertical' ? '4px solid var(--primary-color)' : 'none',
              borderLeft: splitDirection === 'horizontal' ? '4px solid var(--primary-color)' : 'none'
            }}>
              <PageMemoTabList 
                openedTabs={splitTabs} activeTabId={splitTabId} setActiveTabId={setSplitTabId} 
                handleCloseTab={handleCloseTab} isSplitMode={isSplitMode} toggleSplitMode={toggleSplitMode} 
                splitDirection={splitDirection} toggleSplitDirection={toggleSplitDirection} paneType="split"
              />
              {splitTabId ? (
                <PageMemoEditorPane
                  activeMemoId={splitTabId} editData={splitEditData} setEditData={setSplitEditData}
                  folders={folders} currentFolder={currentFolder} handleCloseTab={handleCloseTab}
                  memos={memos} setMemos={setMemos} paneType="split"
                  renameTabId={renameTabId} deleteMemo={handleDeleteMemo}
                />
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                  상단 탭에서 분할 화면에 표시할 메모를 선택하세요.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PageMemoMain;
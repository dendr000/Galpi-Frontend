// 파일 위치: src/domains/memo/fab/components/FabMemoTreeRenderer.jsx
// 기능 요약: 다중 계층(Depth) 폴더 구조를 재귀 함수 형태로 순회하며 렌더링하고, 폴더별 추가/수정/삭제 액션을 제어하는 컴포넌트
import React from 'react';
import { FolderPlusIcon, EditIcon, XIcon, FolderIcon, LinkIcon } from '../../shared/components/MemoIcons';
import FabMemoItem from './FabMemoItem';
import Icon from '../../../../components/common/icons/Icon';

const FabMemoTreeRenderer = ({ node, sidebarHooks, currentFolder, setCurrentFolder, handleCopyPath, activeMemoId, setActiveMemoId }) => {
  const isRoot = node.depth === -1;

  return (
    <div style={{ paddingLeft: isRoot ? 0 : '16px', minHeight: '5px' }}>
      {Object.values(node.children).map((childNode) => {
        const isChildExpanded = sidebarHooks.expandedFolders[childNode.path];

        return (
          <div key={`folder_${childNode.path}`}>
            <div
              className="galpi-tree-folder"
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '6px 8px', borderRadius: '4px', cursor: 'pointer',
                background: currentFolder === childNode.path ? 'rgba(59,91,219,0.08)' : 'transparent',
                color: currentFolder === childNode.path ? 'var(--primary-color)' : 'var(--text-primary)',
                fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s'
              }}
              onClick={() => {
                sidebarHooks.toggleFolder(childNode.path);
                setCurrentFolder(childNode.path);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', opacity: 0.7 }}>
                  <Icon name={isChildExpanded ? 'chevron-down' : 'chevron-right'} />
                </span>
                <FolderIcon />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {childNode.name}
                </span>
              </div>

              <div className="folder-actions" style={{ display: 'flex', gap: '4px' }}>
                <button className="wiki-btn" onClick={(e) => handleCopyPath(e, 'folder', childNode.path)} style={{ background:'transparent', border:'none', color:'var(--text-secondary)', padding:'2px', display:'flex' }} title="경로 복사"><LinkIcon /></button>
                <button className="wiki-btn" onClick={(e) => { e.stopPropagation(); sidebarHooks.handleAddFolder(childNode.path); }} style={{ background:'transparent', border:'none', color:'var(--text-secondary)', padding:'2px', display:'flex' }} title="하위 폴더 추가"><FolderPlusIcon /></button>
                <button className="wiki-btn" onClick={(e) => { e.stopPropagation(); sidebarHooks.handleEditFolder(childNode.path); }} style={{ background:'transparent', border:'none', color:'var(--text-secondary)', padding:'2px', display:'flex' }} title="이름 변경"><EditIcon /></button>
                <button className="wiki-btn" onClick={(e) => { e.stopPropagation(); sidebarHooks.handleDeleteFolder(childNode.path); }} style={{ background:'transparent', border:'none', color:'#e53e3e', padding:'2px', display:'flex' }} title="삭제"><XIcon size={12} /></button>
              </div>
            </div>

            {/* 자식 폴더가 열려있을 경우 재귀 호출 - FabMemoTreeRenderer 명칭 통일 */}
            {isChildExpanded && (
              <FabMemoTreeRenderer
                node={childNode}
                sidebarHooks={sidebarHooks}
                currentFolder={currentFolder}
                setCurrentFolder={setCurrentFolder}
                handleCopyPath={handleCopyPath}
                activeMemoId={activeMemoId}
                setActiveMemoId={setActiveMemoId}
              />
            )}
          </div>
        );
      })}

      {/* 해당 레벨에 존재하는 메모 아이템 렌더링 - FabMemoItem 명칭 통일 */}
      <div style={{ minHeight: '5px' }}>
        {node.memos.map((m) => (
          <FabMemoItem
            key={String(m.id)}
            m={m}
            isActive={String(activeMemoId) === String(m.id)}
            setActiveMemoId={setActiveMemoId}
            handleCopyPath={handleCopyPath}
            openMoveMenu={sidebarHooks.openMoveMenu}
          />
        ))}
      </div>
    </div>
  );
};

export default FabMemoTreeRenderer;
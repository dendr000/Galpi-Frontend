// 파일 위치: src/domains/work/FloatingLeftTree.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, FileText, ChevronDown, ChevronRight, Menu, Network, Home } from 'lucide-react';
import styles from '../../pages/WorkDetail/WorkDetail.module.css';
import TreeContextMenu from './TreeContextMenu';
import { newPageUrl, siblingParentId } from './newPageUrl';
import Icon from '../../components/common/icons/Icon';

const FloatingLeftTree = ({ workId, workTitle, pageId, wikiPages = [] }) => {
  const navigate = useNavigate();
  // 우클릭 메뉴: { x, y, page } (page 가 없으면 최상위 메뉴)
  const [menu, setMenu] = useState(null);

  const [openNodes, setOpenNodes] = useState(() => JSON.parse(localStorage.getItem(`galpi-tree-open-${workId}`) || '[]'));
  const [iconPrefs, setIconPrefs] = useState(() => JSON.parse(localStorage.getItem(`galpi-tree-icons-${workId}`) || '{}'));

  const safeWikiPages = Array.isArray(wikiPages) ? wikiPages : [];
  const rootPages = safeWikiPages.filter(p => !p.parentId);

  // Shift+우클릭은 앱 전체 메뉴(GlobalContextMenu)가 쓰므로 비켜 준다
  const openMenu = (e, page) => {
    if (e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, page });
  };

  const menuItems = () => {
    if (!menu) return [];
    const { page } = menu;
    if (!page) return [{ label: '최상위 문서 만들기', onSelect: () => navigate(newPageUrl(workId)) }];
    return [
      { label: '하위 문서 만들기', onSelect: () => navigate(newPageUrl(workId, page.id)) },
      { label: '같은 위치에 문서 만들기', onSelect: () => navigate(newPageUrl(workId, siblingParentId(page))) },
      { label: '문서 열기', onSelect: () => navigate(`/work/${workId}?pageId=${page.id}`) },
    ];
  };

  const toggleFolder = (e, id) => {
    e.stopPropagation();
    let newOpen;
    if (openNodes.includes(id)) newOpen = openNodes.filter(n => n !== id);
    else newOpen = [...openNodes, id];
    setOpenNodes(newOpen);
    localStorage.setItem(`galpi-tree-open-${workId}`, JSON.stringify(newOpen));
  };

  const toggleIcon = (e, id, hasChildren) => {
    e.stopPropagation();
    const types = ['folder', 'tree', 'file'];
    const current = iconPrefs[id] || (hasChildren ? 'folder' : 'file');
    const nextIdx = (types.indexOf(current) + 1) % types.length;
    
    const newPrefs = { ...iconPrefs, [id]: types[nextIdx] };
    setIconPrefs(newPrefs);
    localStorage.setItem(`galpi-tree-icons-${workId}`, JSON.stringify(newPrefs));
  };

  const renderTree = (pages, level = 0) => {
    if (!pages || pages.length === 0) return null;
    
    return (
      <ul className={`${styles.treeUl} ${level === 0 ? styles.rootTree : ''}`}>
        {pages.map(page => {
          const children = safeWikiPages.filter(p => String(p.parentId) === String(page.id));
          const hasChildren = children.length > 0;
          const isActive = String(page.id) === String(pageId);
          const isOpen = openNodes.includes(page.id) || isActive;
          
          const currentIconType = iconPrefs[page.id] || (hasChildren ? 'folder' : 'file');

          return (
            <li key={page.id} className={styles.treeLi}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '2px 0' }}>
                
                <div onClick={(e) => hasChildren && toggleFolder(e, page.id)} style={{ width: '20px', display: 'flex', justifyContent: 'center', cursor: hasChildren ? 'pointer' : 'default', color: 'var(--text-secondary)' }}>
                  {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
                </div>

                <div 
                  className={`${styles.treeNodeRow} ${isActive ? styles.activePage : ''}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => navigate(`/work/${workId}?pageId=${page.id}`)}
                  onContextMenu={(e) => openMenu(e, page)}
                >
                  <div onClick={(e) => toggleIcon(e, page.id, hasChildren)} style={{ marginRight: '6px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }} title="클릭하여 아이콘 변경">
                    {currentIconType === 'folder' && <Folder size={14} fill="currentColor" />}
                    {currentIconType === 'tree' && <Network size={14} />}
                    {currentIconType === 'file' && <FileText size={14} />}
                  </div>
                  
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</span>
                </div>
              </div>

              {hasChildren && isOpen && renderTree(children, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={styles.floatingLeftTree}>
      
      <div className={styles.treeContent}>
        <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--primary-color)', marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
          <Icon name="folder" lead /> 문서 트리
        </div>
        <div data-tree-body style={{ flex: 1, overflowY: 'auto' }} onContextMenu={(e) => openMenu(e, null)}>
          {/* 작품 첫 화면(최상위)으로 돌아가는 행: 하위 문서를 깊이 들어가 있어도 스크롤 없이 바로 이동한다 */}
          <button
            type="button"
            className={`${styles.treeNodeRow} ${!pageId ? styles.activePage : ''}`}
            aria-label={`${workTitle || '작품'} 첫 화면`}
            aria-current={!pageId ? 'page' : undefined}
            style={{ width: '100%', marginBottom: '6px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: 'inherit', fontFamily: 'inherit' }}
            onClick={() => navigate(`/work/${workId}`)}
            onContextMenu={(e) => openMenu(e, null)}
          >
            <span style={{ marginRight: '6px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}><Home size={14} /></span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workTitle || '작품'}</span>
          </button>
          {rootPages.length > 0 ? (
            renderTree(rootPages)
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>
              생성된 하위 문서가 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className={styles.treeHandle} title="문서 트리 열기">
        <Menu size={20} />
      </div>

      {menu && <TreeContextMenu x={menu.x} y={menu.y} items={menuItems()} onClose={() => setMenu(null)} />}
      
    </div>
  );
};

export default FloatingLeftTree;
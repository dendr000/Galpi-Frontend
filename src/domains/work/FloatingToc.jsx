// 파일 위치: src/domains/work/FloatingToc.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Edit3 } from 'lucide-react';
import styles from '../../pages/WorkDetail/WorkDetail.module.css';
import Icon from '../../components/common/icons/Icon';

// docked: 본문 옆에 붙은 고정 열로 그린다(onCollapse 로 접음). 아니면 접힌 손잡이 모드(onDock 이 있으면 손잡이를 눌러 다시 붙임).
const FloatingToc = ({ workId, pageId, activePage, tocList = [], docked = false, onCollapse, onDock }) => {
  const navigate = useNavigate();

  const handleEditClick = () => {
    if (activePage) {
      navigate(`/edit?type=page&action=edit&workId=${workId}&id=${pageId}`);
    } else {
      navigate(`/edit?type=work&action=edit&id=${workId}`);
    }
  };

  const safeTocList = Array.isArray(tocList) ? tocList : [];

  return (
    <div
      className={docked ? `${styles.dockedPanel} ${styles.dockedRight}` : styles.floatingToc}
      {...(docked ? { role: 'complementary', 'aria-label': '목차' } : {})}
    >
      
      {!docked && (
        <div className={styles.tocHandle} title={onDock ? '목차 고정' : '목차 열기'} onClick={onDock}>
          <Menu size={20} />
        </div>
      )}
      
      <div className={docked ? styles.dockedInner : styles.tocContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
          <span style={{ fontWeight: 900, color: 'var(--primary-color)' }}>
            <Icon name="list" lead /> 목차
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            type="button" 
            className="wiki-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 900, background: 'var(--table-bg-alt)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', borderRadius: '4px', cursor: 'pointer' }} 
            onClick={handleEditClick}
          >
            <Edit3 size={12} /> 편집
          </button>
          {docked && (
            <button type="button" className={styles.panelCollapseBtn} aria-label="목차 접기" title="목차 접기" onClick={onCollapse}>
              <Icon name="chevron-right" />
            </button>
          )}
          </span>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          <ul className={styles.tocList}>
            {safeTocList.length > 0 ? (
              safeTocList.map(t => (
                <li key={t.id} style={{ marginBottom: '4px', paddingLeft: `${(t.level - 1) * 12}px` }}>
                  <span 
                    className={styles.tocLink} 
                    style={{ fontSize: t.level === 1 ? '13px' : '12px', fontWeight: t.level === 1 ? '900' : 'bold', cursor: 'pointer' }} 
                    onClick={(e) => {
                      e.preventDefault();
                      const targetEl = document.getElementById(t.targetId);
                      if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        console.error("DOM 타겟을 찾을 수 없습니다: " + t.targetId);
                      }
                    }}
                  >
                    {t.text}
                  </span>
                </li>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>
                목차 항목이 없습니다.
              </div>
            )}
          </ul>
        </div>
      </div>
      
    </div>
  );
};

export default FloatingToc;
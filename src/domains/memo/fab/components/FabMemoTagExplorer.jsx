// 파일 위치: src/domains/memo/fab/components/FabMemoTagExplorer.jsx
import React, { useState } from 'react';
import { TagIcon } from '../../shared/components/MemoIcons';
import Icon from '../../../../components/common/icons/Icon';

const FabMemoTagExplorer = ({ tagList = [], selectedTag, setSelectedTag }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ borderTop: '1px solid var(--border-color)', background: 'var(--table-bg-alt)', flexShrink: 0 }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 15px', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
          <TagIcon /> 태그 탐색기
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <Icon name="chevron-down" />
        </span>
      </div>
      
      <div className="galpi-sidebar-scroll" style={{ 
        display: 'flex', flexWrap: 'wrap', gap: '6px', 
        maxHeight: isOpen ? '150px' : '0', 
        padding: isOpen ? '0 15px 15px 15px' : '0 15px',
        opacity: isOpen ? 1 : 0,
        overflowY: 'auto', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
      }}>
        {(!tagList || tagList.length === 0) ? (
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>등록된 태그가 없습니다.</span>
        ) : (
          tagList.map(t => (
            <button
              key={t.name}
              onClick={() => setSelectedTag(selectedTag === t.name ? null : t.name)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                border: selectedTag === t.name ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                background: selectedTag === t.name ? 'var(--primary-color)' : 'var(--bg-color)',
                color: selectedTag === t.name ? '#fff' : 'var(--text-primary)',
                transition: '0.2s'
              }}
            >
              #{t.name} <span style={{ opacity: 0.7, fontSize: '10px' }}>({t.count})</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default FabMemoTagExplorer;
import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../../components/common/icons/Icon';

const MemoLinkPopover = ({ linkPopover, closeLinkPopover, applyLink, editExistingLink, deleteLink, timeoutRef }) => {
  const [urlValue, setUrlValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const popoverRef = useRef(null);
  const [adjustedX, setAdjustedX] = useState(0);

  useEffect(() => {
    if (linkPopover.isOpen && linkPopover.mode === 'edit') {
      if (linkPopover.targetNode) {
        setUrlValue(linkPopover.url || '');
        setTextValue(linkPopover.text || '');
      } else {
        setTextValue(linkPopover.text || '');
        navigator.clipboard.readText()
          .then(text => setUrlValue(text))
          .catch(() => setUrlValue(''));
      }
    }
  }, [linkPopover.isOpen, linkPopover.mode, linkPopover.targetNode, linkPopover.url, linkPopover.text]);

  useEffect(() => {
    if (linkPopover.isOpen && popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      let safeX = linkPopover.x;
      if (safeX + rect.width > window.innerWidth) {
        safeX = window.innerWidth - rect.width - 15;
      }
      setAdjustedX(safeX);
    }
  }, [linkPopover.isOpen, linkPopover.x, linkPopover.mode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (linkPopover.isOpen && linkPopover.mode === 'edit' && popoverRef.current && !popoverRef.current.contains(e.target)) {
        closeLinkPopover();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [linkPopover.isOpen, linkPopover.mode, closeLinkPopover]);

  if (!linkPopover.isOpen) return null;

  if (linkPopover.mode === 'view') {
    return (
      <div
        ref={popoverRef}
        onMouseEnter={() => clearTimeout(timeoutRef.current)}
        onMouseLeave={closeLinkPopover}
        onClick={editExistingLink}
        style={{
          position: 'fixed',
          top: linkPopover.y,
          left: adjustedX || linkPopover.x,
          zIndex: 999999,
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white', 
          borderRadius: '6px',
          padding: '8px 12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          maxWidth: '300px',
          fontSize: '12px',
          lineHeight: 1.5,
          wordBreak: 'break-all',
          boxSizing: 'border-box',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#63b3ed', marginRight: '6px', flexShrink: 0 }}>
            <Icon name="link" />
          </span>
          <span>{linkPopover.url}</span>
        </div>
        {/* 불필요한 '클릭하여 수정/삭제' 문구 완전 제거됨 */}
      </div>
    );
  }

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: linkPopover.y,
        left: adjustedX || linkPopover.x,
        zIndex: 999999,
        background: 'var(--surface-color)',
        border: '2px solid var(--primary-color)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
        width: '280px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            <Icon name="link" lead /> 내부 링크 삽입 / 수정
          </span>
          <button onClick={closeLinkPopover} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', padding: 0 }}><Icon name="close" /></button>
        </div>
        
        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>표시할 텍스트</label>
        <input
          type="text"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '12px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }}
        />

        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>연결할 경로</label>
        <input
          type="text"
          autoFocus
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') applyLink(urlValue, textValue); }}
          placeholder="/memo?id=123"
          style={{ width: '100%', padding: '8px', fontSize: '12px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', boxSizing: 'border-box' }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
          {linkPopover.targetNode ? (
             <button className="wiki-btn" onClick={deleteLink} style={{ padding: '6px 12px', fontSize: '11px', background: 'transparent', color: '#e53e3e', border: '1px solid rgba(229,62,62,0.3)', borderRadius: '4px', fontWeight: 'bold' }}>링크 지우기</button>
          ) : (
             <div />
          )}
          <button className="wiki-btn" onClick={() => applyLink(urlValue, textValue)} style={{ padding: '6px 16px', fontSize: '11px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>적용</button>
        </div>
      </div>
    </div>
  );
};

export default MemoLinkPopover;
// Copyright (c) dendr000. MIT License.
// 문서 트리의 우클릭 메뉴. 화면 좌표(x, y)에 띄우고, Esc 나 바깥을 누르면 닫힌다.
// 트리 패널은 옆에서 미끄러져 나오는(transform) 구조라 그 안에 두면 위치가 어긋나므로 body 로 꺼내 그린다(포털).
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const MENU_WIDTH = 200;
const ITEM_HEIGHT = 34;

const menuStyle = (x, y, count) => ({
  position: 'fixed',
  left: Math.max(4, Math.min(x, window.innerWidth - MENU_WIDTH - 8)),
  top: Math.max(4, Math.min(y, window.innerHeight - count * ITEM_HEIGHT - 16)),
  width: MENU_WIDTH, zIndex: 20000, padding: '4px',
  background: 'var(--surface-color)', color: 'var(--text-primary)',
  border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-md)',
});

const itemStyle = {
  display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', border: 'none', borderRadius: '5px',
  background: 'transparent', color: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
};

const TreeContextMenu = ({ x, y, items, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  return createPortal(
    <div ref={ref} role="menu" aria-label="문서 메뉴" style={menuStyle(x, y, items.length)} onContextMenu={(e) => e.preventDefault()}>
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          role="menuitem"
          style={itemStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--table-bg-alt)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          onClick={() => { onClose(); it.onSelect(); }}
        >
          {it.label}
        </button>
      ))}
    </div>,
    document.body
  );
};

export default TreeContextMenu;

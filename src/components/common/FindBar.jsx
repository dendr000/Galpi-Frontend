// Copyright (c) dendr000. MIT License.
// 페이지 안 글자 찾기(Ctrl+F). Electron(exe)에는 브라우저의 기본 찾기 창이 없어서 Ctrl+F 가 아무 일도 안 하므로 직접 만든다.
// 일반 브라우저에서는 기본 찾기가 있으니 끄고(enabled=false), exe 에서만 켠다.
// 찾기는 window.find 로 하고 현재 일치 부분이 선택 표시로 보인다. 에디터는 자체 찾기가 먼저 Ctrl+F 를 처리한다.
import React, { useState, useEffect, useRef } from 'react';

export const isElectron = (ua = typeof navigator !== 'undefined' ? navigator.userAgent : '') => /Electron\//.test(ua || '');

const barStyle = {
  position: 'fixed', top: '72px', right: '20px', zIndex: 6000, display: 'flex', alignItems: 'center', gap: '6px',
  padding: '8px 10px', background: 'var(--surface-color)', color: 'var(--text-primary)',
  border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', userSelect: 'none',
};
const btnStyle = { padding: '4px 10px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' };

const FindBar = ({ enabled = isElectron(), find = (...a) => window.find(...a) }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [missing, setMissing] = useState(false);
  const inputRef = useRef(null);
  const barRef = useRef(null);

  // Ctrl+F: 창(bubble) 단계에서 듣는다. 에디터 찾기는 문서의 캡처 단계에서 먼저 처리하고 기본 동작을 막으므로 그때는 건너뛴다.
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      if (e.defaultPrevented) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        const sel = window.getSelection()?.toString().trim();
        if (sel && sel.length < 50) setQuery(sel);
        setOpen(true);
        // 이미 열려 있으면 입력칸으로 포커스를 돌린다(처음 열 때는 아래 효과가 포커스한다)
        if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);

  useEffect(() => {
    if (open) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [open]);

  if (!enabled || !open) return null;

  // fromStart: 입력하는 대로 찾을 때, 지금 선택된 일치 부분의 앞에서부터 다시 찾는다(글자를 늘려도 같은 자리에서 이어짐)
  const run = (text, backwards, fromStart) => {
    if (!text) { setMissing(false); return; }
    if (fromStart) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) sel.collapseToStart();
    }
    // 브라우저의 찾기는 입력칸 안의 글자도 찾아서, 찾는 글자를 입력한 이 입력칸 자신에 걸려 "찾았다"고 나온다.
    // 찾는 동안만 찾기창을 숨기고(화면은 다시 그려지지 않는다), 끝나면 되돌리고 입력칸에 포커스를 돌려준다.
    const bar = barRef.current;
    if (bar) bar.style.display = 'none';
    let found = false;
    try {
      found = find(text, false, backwards, true);
    } finally {
      if (bar) bar.style.display = 'flex';
      inputRef.current?.focus({ preventScroll: true });
    }
    setMissing(!found);
  };

  const close = () => { setOpen(false); setMissing(false); };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.nativeEvent?.isComposing || e.isComposing) return;
    if (e.key === 'Enter' || e.key === 'F3') {
      e.preventDefault();
      run(query, e.shiftKey, false);
    }
  };

  return (
    <div ref={barRef} role="search" aria-label="페이지에서 찾기" style={barStyle}>
      <input
        ref={inputRef}
        type="text"
        aria-label="페이지에서 찾기"
        value={query}
        placeholder="페이지에서 찾기"
        onChange={(e) => { setQuery(e.target.value); run(e.target.value, false, true); }}
        onKeyDown={onKeyDown}
        style={{ width: '200px', padding: '5px 8px', border: '1px solid var(--border-color)', borderRadius: '5px', background: 'var(--bg-color)', color: 'var(--text-primary)', userSelect: 'text' }}
      />
      <span role="status" style={{ minWidth: '92px', fontSize: '12px', color: '#c92a2a', fontWeight: 700 }}>
        {missing ? '찾는 글자가 없습니다' : ''}
      </span>
      <button type="button" style={btnStyle} onClick={() => run(query, true, false)}>이전</button>
      <button type="button" style={btnStyle} onClick={() => run(query, false, false)}>다음</button>
      <button type="button" style={btnStyle} onClick={close}>닫기</button>
    </div>
  );
};

export default FindBar;

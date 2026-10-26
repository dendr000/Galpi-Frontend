// Copyright (c) dendr000. MIT License.
// 페이지 안 글자 찾기(Ctrl+F). Electron(exe)에는 브라우저의 기본 찾기 창이 없어서 Ctrl+F 가 아무 일도 하지 않으므로 직접 만든다.
// 일반 브라우저에서는 기본 찾기가 있으니 끄고(enabled=false), exe 에서만 켠다.
// 찾기는 findInPage.js 가 문서 글자를 훑어 하고, 일치 부분은 선택/포커스를 건드리지 않는 CSS Highlight 로 표시한다.
// (예전에는 window.find 를 썼는데, 입력칸 자신에 걸리지 않게 창을 숨기느라 입력칸이 포커스를 잃어 한글 조합이 끊겼다.)
// 에디터는 자체 찾기가 먼저 Ctrl+F 를 처리한다.
import React, { useState, useEffect, useRef } from 'react';
import { collectMatches, applyHighlights, clearHighlights, scrollToMatch, HIGHLIGHT_ALL, HIGHLIGHT_CURRENT } from './findInPage';

export const isElectron = (ua = typeof navigator !== 'undefined' ? navigator.userAgent : '') => /Electron\//.test(ua || '');

const barStyle = {
  position: 'fixed', top: '72px', right: '20px', zIndex: 6000, display: 'flex', alignItems: 'center', gap: '6px',
  padding: '8px 10px', background: 'var(--surface-color)', color: 'var(--text-primary)',
  border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', userSelect: 'none',
};
const btnStyle = { padding: '4px 10px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' };

// 일치 표시 색: 모든 일치는 연한 노랑, 현재 일치는 주황. 글자색을 검정으로 고정해 어두운 테마에서도 읽힌다.
const HIGHLIGHT_CSS = `
::highlight(${HIGHLIGHT_ALL}) { background-color: #ffe066; color: #000; }
::highlight(${HIGHLIGHT_CURRENT}) { background-color: #ff922b; color: #000; }
`;

const FindBar = ({ enabled = isElectron() }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [index, setIndex] = useState(-1);
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

  // 검색어가 바뀔 때마다(한글 조합 중이어도) 다시 찾는다. 입력칸의 포커스는 건드리지 않는다.
  useEffect(() => {
    if (!open) { clearHighlights(); return; }
    const found = collectMatches(document.body, query, barRef.current);
    setMatches(found);
    const first = found.length ? 0 : -1;
    setIndex(first);
    applyHighlights(found, first);
    if (first === 0) scrollToMatch(found[0]);
  }, [query, open]);

  // 화면에서 사라질 때(닫기, 꺼짐) 표시도 함께 지운다.
  useEffect(() => () => clearHighlights(), []);

  if (!enabled || !open) return null;

  const step = (delta) => {
    if (matches.length === 0) return;
    const next = (index + delta + matches.length) % matches.length;
    setIndex(next);
    applyHighlights(matches, next);
    scrollToMatch(matches[next]);
  };

  const close = () => setOpen(false);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.nativeEvent?.isComposing || e.isComposing) return;
    if (e.key === 'Enter' || e.key === 'F3') {
      e.preventDefault();
      step(e.shiftKey ? -1 : 1);
    }
  };

  const hasQuery = query.trim() !== '';
  const status = !hasQuery ? '' : matches.length === 0 ? '찾는 글자가 없습니다' : `${index + 1} / ${matches.length}`;

  return (
    <div ref={barRef} role="search" aria-label="페이지에서 찾기" style={barStyle}>
      <style>{HIGHLIGHT_CSS}</style>
      <input
        ref={inputRef}
        type="text"
        aria-label="페이지에서 찾기"
        value={query}
        placeholder="페이지에서 찾기"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        style={{ width: '200px', padding: '5px 8px', border: '1px solid var(--border-color)', borderRadius: '5px', background: 'var(--bg-color)', color: 'var(--text-primary)', userSelect: 'text' }}
      />
      <span role="status" style={{ minWidth: '92px', fontSize: '12px', color: matches.length === 0 && hasQuery ? '#c92a2a' : 'var(--text-secondary)', fontWeight: 700 }}>
        {status}
      </span>
      <button type="button" style={btnStyle} onClick={() => step(-1)}>이전</button>
      <button type="button" style={btnStyle} onClick={() => step(1)}>다음</button>
      <button type="button" style={btnStyle} onClick={close}>닫기</button>
    </div>
  );
};

export default FindBar;

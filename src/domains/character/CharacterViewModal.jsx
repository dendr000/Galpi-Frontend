// Copyright (c) dendr000. MIT License.
// 캐릭터 큰 창: 왼쪽에 넓은 본문, 오른쪽에 인포박스를 보여 주고 방향키로 이웃 캐릭터로 넘긴다.
// 위쪽 검색 상자로 이름을 찾아 바로 넘어가고, 아래쪽 띠에서 그리드 순서대로 늘어선 캐릭터(이미지와 이름)를 눌러 넘어간다.
// 본문과 인포박스는 호출하는 쪽이 만들어 넘긴다(renderBody, renderInfobox). 이 컴포넌트는 틀과 키 입력만 맡는다.
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/common/icons/Icon';
import { searchChars, getCharThemeColor } from './charSearch';
import './CharacterViewModal.css';

const SEARCH_LIMIT = 8;
// 화면 아래에 고정된 푸터(높이 48px, z-index 8000)가 큰 창(z-index 3000) 아래쪽을 덮으므로 그만큼 위로 올려 둔다.
const FOOTER_CLEARANCE_PX = 52;

// 글자를 입력하는 곳에서는 방향키가 커서 이동이므로 가로채지 않는다.
const isEditableTarget = (t) => {
  if (!t || !t.tagName) return false;
  const tag = t.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable === true;
};

const CharacterViewModal = ({ chars = [], activeId, onSelect, onClose, renderBody, renderInfobox, getThumbSrc }) => {
  const idx = chars.findIndex((c) => c.id === activeId);
  const char = idx >= 0 ? chars[idx] : null;
  const prev = idx > 0 ? chars[idx - 1] : null;
  const next = idx >= 0 && idx < chars.length - 1 ? chars[idx + 1] : null;

  // 이벤트 처리기는 한 번만 달고 최신 값은 ref 로 읽는다(키를 누를 때마다 다시 달지 않도록).
  const live = useRef({});
  live.current = { prev, next, onSelect, onClose };
  const bodyRef = useRef(null);
  const panelRef = useRef(null);
  const stripRef = useRef(null);
  const searchRef = useRef(null);
  const open = char !== null;

  const [query, setQuery] = useState('');
  const [hit, setHit] = useState(0);
  const [failedImgs, setFailedImgs] = useState(() => new Set());
  const listId = useId();
  const results = useMemo(() => searchChars(chars, query, SEARCH_LIMIT), [chars, query]);
  const showPop = query.trim() !== '';

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.isComposing) return;
      if (e.key === 'Escape') { live.current.onClose?.(); return; }
      if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;
      if (isEditableTarget(e.target)) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const target = e.key === 'ArrowRight' ? live.current.next : live.current.prev;
      if (target) { e.preventDefault(); live.current.onSelect?.(target.id); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // 열려 있는 동안 뒤쪽 페이지가 같이 스크롤되지 않게 잠그고, 닫으면 원래대로 되돌린다.
  useEffect(() => {
    if (!open) return undefined;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const opener = document.activeElement;
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = before;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    };
  }, [open]);

  // 다른 캐릭터로 넘기면 본문을 맨 위부터 보여 주고, 아래 띠는 지금 캐릭터가 가운데 오게 맞춘다.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    const strip = stripRef.current;
    const cur = strip?.querySelector('[aria-current="true"]');
    if (!strip || !cur) return;
    const left = Math.max(0, cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2);
    if (typeof strip.scrollTo === 'function') strip.scrollTo({ left, behavior: 'smooth' });
    else strip.scrollLeft = left;
  }, [activeId, open]);

  if (!char) return null;

  const pick = (c) => {
    onSelect?.(c.id);
    setQuery('');
    setHit(0);
    panelRef.current?.focus();
  };

  const onSearchKeyDown = (e) => {
    if (e.nativeEvent?.isComposing || e.keyCode === 229) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (results.length === 0) return;
      e.preventDefault();
      setHit((h) => (e.key === 'ArrowDown' ? Math.min(h + 1, results.length - 1) : Math.max(h - 1, 0)));
    } else if (e.key === 'Enter') {
      if (!results[hit]) return;
      e.preventDefault();
      pick(results[hit]);
    } else if (e.key === 'Escape' && query) {
      e.preventDefault();
      setQuery('');
      setHit(0);
    }
  };

  const navBtn = (label, target, iconName) => (
    <button
      type="button"
      className="wiki-btn"
      aria-label={label}
      title={`${label} (방향키)`}
      disabled={!target}
      onClick={() => target && onSelect?.(target.id)}
      style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', opacity: target ? 1 : 0.4, cursor: target ? 'pointer' : 'not-allowed' }}
    >
      <Icon name={iconName} size={14} />
    </button>
  );

  return createPortal(
    <div
      data-testid="char-view-backdrop"
      data-char-modal=""
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3vh 3vw', paddingBottom: `calc(3vh + ${FOOTER_CLEARANCE_PX}px)` }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${char.name} 상세 정보`}
        tabIndex={-1}
        style={{ background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', width: 'min(1200px, 100%)', height: '100%', maxHeight: '94vh', display: 'flex', flexDirection: 'column', outline: 'none', overflow: 'hidden' }}
      >
        <div className="char-modal-header">
          {navBtn('이전 캐릭터', prev, 'chevron-left')}
          {navBtn('다음 캐릭터', next, 'chevron-right')}
          <h2 className="char-modal-title">{char.name}</h2>
          <span className="char-modal-count">{idx + 1} / {chars.length}</span>
          <div className="char-modal-search">
            <span className="char-modal-search-icon"><Icon name="search" size={14} /></span>
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              aria-label="캐릭터 검색"
              aria-expanded={showPop}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={showPop && results[hit] ? `${listId}-${hit}` : undefined}
              className="char-modal-search-input"
              placeholder="캐릭터 검색 ( / )"
              value={query}
              autoComplete="off"
              onChange={(e) => { setQuery(e.target.value); setHit(0); }}
              onKeyDown={onSearchKeyDown}
              onBlur={() => { setQuery(''); setHit(0); }}
            />
            {showPop && (
              <div className="char-modal-pop" onMouseDown={(e) => e.preventDefault()}>
                {results.length > 0 ? (
                  <ul id={listId} role="listbox" aria-label="검색 결과" className="char-modal-options">
                    {results.map((c, i) => (
                      <li
                        key={c.id}
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={i === hit}
                        className="char-modal-option"
                        onMouseDown={(e) => { e.preventDefault(); pick(c); }}
                        onMouseEnter={() => setHit(i)}
                      >
                        <span className="char-modal-dot" style={{ background: getCharThemeColor(c) }} />
                        {c.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="char-modal-empty">일치하는 캐릭터가 없습니다</div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            className="wiki-btn"
            aria-label="닫기"
            title="닫기 (Esc)"
            onClick={() => onClose?.()}
            style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div ref={bodyRef} style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '16px 24px' }}>
            {renderBody?.(char)}
          </div>
          <aside className="char-modal-aside" style={{ width: '340px', flexShrink: 0, overflowY: 'auto', padding: '16px', borderLeft: '1px solid var(--border-color)' }}>
            {renderInfobox?.(char)}
          </aside>
        </div>
        <nav ref={stripRef} className="char-modal-strip" aria-label="주변 캐릭터">
          {chars.map((c) => {
            const active = c.id === activeId;
            const src = getThumbSrc?.(c);
            const showImg = src && !failedImgs.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                title={c.name}
                aria-current={active ? 'true' : undefined}
                className={`char-modal-chip${active ? ' is-active' : ''}`}
                style={{ '--chip-color': getCharThemeColor(c) }}
                onClick={() => onSelect?.(c.id)}
              >
                <span className="char-modal-thumb">
                  {showImg ? (
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      onError={() => setFailedImgs((p) => new Set(p).add(c.id))}
                    />
                  ) : (
                    <span data-thumb-fallback="" aria-hidden="true" className="char-modal-thumb-letter">{Array.from(c.name || '')[0] || ''}</span>
                  )}
                </span>
                <span className="char-modal-chip-name">{c.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>,
    document.body,
  );
};

export default CharacterViewModal;

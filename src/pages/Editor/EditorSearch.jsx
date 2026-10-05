import React, { useState, useEffect, useRef } from 'react';
import styles from './EditorPage.module.css';
import { findMatchesIn } from './findMatches';

const EditorSearch = ({ editorRef, rawText, setRawText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsOpen(true);
        const selText = window.getSelection().toString().trim();
        if (selText && selText.length < 50) {
          setFindText(selText);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        editorRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, editorRef]);

  // 검색어(findText)가 바뀔 때만 자동으로 첫 매치로 이동+포커스한다 — rawText 변화(=타이핑
  // 한 글자 한 글자)마다 이걸 돌리면 사용자가 다른 곳에 타이핑 중에도 계속 에디터로 포커스가
  // 뺏겨서 아예 입력이 안 되는 상태가 된다.
  useEffect(() => {
    const found = findMatchesIn(rawText || '', findText);
    setMatches(found);
    if (found.length > 0) {
      setCurrentIndex(0);
      highlightMatch(found, 0);
    } else {
      setCurrentIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findText]);

  const highlightMatch = (arr, idx) => {
    if (!editorRef.current || arr.length === 0 || idx === -1) return;
    const match = arr[idx];
    const el = editorRef.current;
    el.focus();
    el.setSelectionRange(match.start, match.end);

    const fullTextToMatch = (rawText || '').substring(0, match.start);
    const lines = fullTextToMatch.split('\n');
    const lineHeight = 20; 
    el.scrollTop = (lines.length - 1) * lineHeight - (el.clientHeight / 2);
  };

  const navigateSearch = (direction) => {
    if (matches.length === 0) return;
    let nextIdx = currentIndex + direction;
    if (nextIdx < 0) nextIdx = matches.length - 1;
    if (nextIdx >= matches.length) nextIdx = 0;
    setCurrentIndex(nextIdx);
    highlightMatch(matches, nextIdx);
  };

  // ★ 예전엔 el.value = ... 로 textarea DOM을 직접 고쳤는데, 이 textarea는 React가
  // value={rawText}로 제어하는 컨트롤드 컴포넌트라서 DOM만 고치면 진짜 상태인 rawText는
  // 그대로 남는다 — 화면엔 바뀐 것처럼 보여도 저장 버튼을 누르면 rawText(바뀌기 전 내용)가
  // 그대로 저장되고, 다른 이유로 리렌더가 한 번이라도 일어나면 React가 textarea를 rawText
  // 값으로 다시 맞추면서 방금 바꾼 내용이 조용히 원래대로 되돌아가는 버그였다. 반드시
  // setRawText를 통해서 진짜 상태를 갱신해야 한다.
  const handleReplaceCurrent = () => {
    if (matches.length === 0 || currentIndex === -1) return;
    const match = matches[currentIndex];
    const text = rawText || '';

    const before = text.substring(0, match.start);
    const after = text.substring(match.end);
    const newText = before + replaceText + after;
    setRawText(newText);

    // setRawText는 비동기라 이 시점에 rawText를 다시 읽으면 아직 옛날 값이므로, 방금 만든
    // newText를 그대로 넘겨서 매치 목록을 다시 계산한다.
    const found = findMatchesIn(newText, findText);
    setMatches(found);
    setCurrentIndex(found.length > 0 ? Math.min(currentIndex, found.length - 1) : -1);
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegExp(findText), 'gi');
    const newText = (rawText || '').replace(regex, replaceText);
    setRawText(newText);

    const found = findMatchesIn(newText, findText);
    setMatches(found);
    setCurrentIndex(found.length > 0 ? 0 : -1);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.customSearchBox}>
      <div className={styles.searchRow}>
        <button className={styles.searchBtn} style={{ border: 'none', padding: '4px' }} onClick={() => setIsReplaceOpen(!isReplaceOpen)}>
          {isReplaceOpen ? '▼' : '▶'}
        </button>
        <input 
          autoFocus
          className={styles.searchInput} 
          placeholder="에디터 내 찾기 (Ctrl+F)" 
          value={findText} 
          onChange={e => setFindText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              navigateSearch(e.shiftKey ? -1 : 1);
            }
          }}
        />
        <span style={{ fontSize:'11px', color: matches.length > 0 ? 'var(--text-secondary)' : '#e53e3e', minWidth:'35px', textAlign:'right' }}>
          {matches.length > 0 ? `${currentIndex + 1}/${matches.length}` : '0/0'}
        </span>
        <button className={styles.searchBtn} onClick={() => navigateSearch(-1)}>▲</button>
        <button className={styles.searchBtn} onClick={() => navigateSearch(1)}>▼</button>
        <button className={styles.searchBtn} style={{ border:'none', color:'#e53e3e', fontSize:'16px' }} onClick={() => setIsOpen(false)}>✖</button>
      </div>
      
      {isReplaceOpen && (
        <div className={styles.searchRow} style={{ paddingLeft: '28px' }}>
          <input 
            className={styles.searchInput} 
            placeholder="바꿀 내용" 
            value={replaceText} 
            onChange={e => setReplaceText(e.target.value)}
            onKeyDown={e => {
              if(e.key === 'Enter') { e.preventDefault(); handleReplaceCurrent(); }
            }}
          />
          <button className={styles.searchBtn} onClick={handleReplaceCurrent}>바꾸기</button>
          <button className={styles.searchBtn} onClick={handleReplaceAll}>모두</button>
        </div>
      )}
    </div>
  );
};

export default EditorSearch;
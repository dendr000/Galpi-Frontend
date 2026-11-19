// 절대 경로: src/pages/Editor/components/EditorWritePane.jsx
// 기능 요약: 텍스트 입력과 서식 단축키를 처리하고 스크롤 튐 방지가 적용된 메인 편집 패널
import React, { useState, useEffect, useCallback } from 'react';
import styles from '../EditorPage.module.css';
import EditorToolbar from './EditorToolbar';
import BacklinkDropdown from './BacklinkDropdown';
import SyntaxCheckBar from './SyntaxCheckBar';

const EditorWritePane = ({
  docType, title, setTitle, rawText, setRawText, editorRef, handleEditorKeyDown, fontList, backlinkCandidates
}) => {
  // ★ 백링크 팝업 상태 관리
  const [backlinkState, setBacklinkState] = useState({ isOpen: false, query: '', x: 0, y: 0, startIndex: -1, selectedIndex: 0 });

  // ★ textarea 전용 커서 좌표(X,Y) 추출 물리 엔진
  const getCaretCoordinates = useCallback((element, position) => {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);
    for (const prop of style) { div.style[prop] = style[prop]; }
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);
    document.body.appendChild(div);
    const coords = { x: span.offsetLeft, y: span.offsetTop, h: parseInt(style.fontSize) || 14 };
    document.body.removeChild(div);
    return coords;
  }, []);

  // 내부 서식 단축키(Ctrl+B, Ctrl+I 등) 적용을 위한 로직 (Ctrl+Z 보존)
  const applyTextFormat = useCallback((prefix, suffix) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const before = text.substring(Math.max(0, start - prefix.length), start);
    const after = text.substring(end, end + suffix.length);

    let isUnwrap = (before === prefix && after === suffix);
    let newInsertedText = isUnwrap ? selected : prefix + selected + suffix;

    if (isUnwrap) {
      textarea.setSelectionRange(start - prefix.length, end + suffix.length);
    } else {
      textarea.setSelectionRange(start, end);
    }

    document.execCommand('insertText', false, newInsertedText);

    setTimeout(() => {
      textarea.focus();
      if (isUnwrap) {
        textarea.setSelectionRange(start - prefix.length, start - prefix.length + selected.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      }
    }, 0);
  }, [editorRef]);

  // ★ 백링크 인서트 로직 (Ctrl+Z 보존)
  const insertBacklink = (targetName) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart;
    
    // [[ 부터 커서까지 드래그 후 텍스트 치환
    textarea.setSelectionRange(backlinkState.startIndex, cursor);
    document.execCommand('insertText', false, `[[${targetName}]]`);

    setBacklinkState(prev => ({ ...prev, isOpen: false }));
  };

  const handleLocalKeyDown = (e) => {
    // ★ 백링크 팝업이 켜져있을 때의 방향키/엔터 하이재킹
    if (backlinkState.isOpen) {
      const filtered = (backlinkCandidates || []).filter(c => c.name.toLowerCase().includes(backlinkState.query.toLowerCase()));
      if (filtered.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setBacklinkState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % filtered.length }));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setBacklinkState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + filtered.length) % filtered.length }));
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          insertBacklink(filtered[backlinkState.selectedIndex].name);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setBacklinkState(prev => ({ ...prev, isOpen: false }));
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); applyTextFormat('**', '**'); break;
        case 'i': e.preventDefault(); applyTextFormat('_', '_'); break;
        default: break;
      }
    }
    if (handleEditorKeyDown) handleEditorKeyDown(e);
  };

  const adjustTextareaHeight = useCallback((element) => {
    if (element) {
      const currentScrollX = window.scrollX;
      const currentScrollY = window.scrollY;
      element.style.setProperty('height', 'auto', 'important');
      const targetHeight = element.scrollHeight + 5;
      element.style.setProperty('height', targetHeight + 'px', 'important');
      window.scrollTo(currentScrollX, currentScrollY);
    }
  }, []);

  useEffect(() => {
    if (editorRef?.current) {
      adjustTextareaHeight(editorRef.current);
    }
  }, [rawText, adjustTextareaHeight, editorRef]);

  // ★ 실시간 타이핑 스캔 및 백링크 팝업 트리거
  const handleTextChange = (e) => {
    const val = e.target.value;
    setRawText(val);
    adjustTextareaHeight(e.target);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursor);
    const lastOpenMatch = textBeforeCursor.match(/\[\[([^\]]*)$/);

    if (lastOpenMatch) {
      const query = lastOpenMatch[1];
      const startIndex = lastOpenMatch.index;
      const coords = getCaretCoordinates(e.target, cursor);
      const rect = e.target.getBoundingClientRect();
      
      // 화면 절대 좌표 계산 (스크롤 보정)
      const topPos = rect.top - e.target.scrollTop + coords.y + coords.h + window.scrollY + 5;
      const leftPos = rect.left - e.target.scrollLeft + coords.x + window.scrollX;

      setBacklinkState({
        isOpen: true, query, x: leftPos, y: topPos, startIndex, selectedIndex: 0
      });
    } else {
      setBacklinkState(prev => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div className={styles.writePane} style={{ paddingLeft: '80px', boxSizing: 'border-box', maxWidth: '100%', display: 'block' }}>
      
      <BacklinkDropdown 
        isOpen={backlinkState.isOpen}
        x={backlinkState.x}
        y={backlinkState.y}
        query={backlinkState.query}
        candidates={backlinkCandidates}
        selectedIndex={backlinkState.selectedIndex}
        onSelect={insertBacklink}
      />

      <input 
        className={styles.editorTitleInput} 
        placeholder="제목을 입력하세요" 
        value={title} 
        onChange={e => setTitle(e.target.value)} 
      />

      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px', marginTop: '10px' }}>
        {docType === 'work' ? '설정 및 본문' : '문서 내용 작성'}
      </label>

      <EditorToolbar 
        editorRef={editorRef}
        setRawText={setRawText}
        fontList={fontList}
      />

      <textarea 
        ref={editorRef}
        className={styles.editorTextarea} 
        style={{ 
          overflowY: 'hidden', 
          minHeight: '400px', 
          maxHeight: 'none', 
          resize: 'none',
          width: '100%',
          boxSizing: 'border-box',
          flex: 1
        }}
        placeholder="마크다운으로 내용을 자유롭게 작성하세요..."
        value={rawText}
        onChange={handleTextChange}
        onKeyDown={handleLocalKeyDown}
      />

      <SyntaxCheckBar text={rawText} editorRef={editorRef} />
    </div>
  );
};

export default EditorWritePane;
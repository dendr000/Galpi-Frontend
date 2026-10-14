// 파일 위치: src/domains/memo/components/MemoFormatMainBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  BoldIcon, ItalicIcon, StrikethroughIcon, FootnoteIcon, LinkIcon,
  TableIcon, TodoIcon, FoldIcon, SearchIcon, TemplateIcon, TemplateSaveIcon,
  FontResetIcon, CrackIcon, BabyIcon, AutoSnippetIcon, DictAddIcon
} from './MemoIcons';
import { svgClose, buildFoldBoxHtml, BLANK_LINE_HTML } from '../utils/foldBoxHtml';

const MemoFormatMainBar = ({
  executeCmd, insertFootnote, insertMarkdownLink, insertHtml,
  findReplaceVisible, setFindReplaceVisible, setTableCtrlVisible,
  openTemplateList, saveAsTemplate, saveToDict, // ★ saveToDict 프롭스 추가
  fontList, applyFont
}) => {
  const selectRef = useRef(null);
  const [recentFonts, setRecentFonts] = useState([]);
  
  // ★ 픽스: 부모 컴포넌트(Props)에 의존하지 않고, 툴바 내부에서 독자적으로 토글 상태 관리
  const [isAutoSnippet, setIsAutoSnippet] = useState(() => localStorage.getItem('galpi-bp-preview') !== 'false');

  const toggleAutoSnippet = () => {
    const nextState = !isAutoSnippet;
    setIsAutoSnippet(nextState);
    localStorage.setItem('galpi-bp-preview', String(nextState));
    
    // 강제로 스토리지 이벤트를 발생시켜 상용구 엔진이 실시간으로 상태 변화를 감지하도록 유도
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    setRecentFonts(JSON.parse(localStorage.getItem('galpi-recent-fonts') || '[]'));
  }, []);


  const checkHTML = `<div style="display:flex; align-items:center; gap:8px; margin:4px 0;" contenteditable="false"><button type="button" onclick="this.parentElement.remove()" style="background:transparent; color:#e53e3e; border:none; cursor:pointer; font-size:14px; padding:0; outline:none; display:flex; align-items:center; justify-content:center;" title="삭제">${svgClose}</button><input type="checkbox" style="cursor:pointer; width:16px; height:16px;"><span contenteditable="true" style="outline:none; flex:1; font-size:13px; min-width:50px;">할 일 입력...</span></div>`;
  
  // ★ width:max-content였던 걸 제거 — 표에 내용이 많이 들어가면 줄바꿈 안 되고 오른쪽으로
  // 뚫고 나가던 버그의 원인이었다(표 자체가 콘텐츠 최대 너비만큼 늘어나려고 해서, 셀의
  // word-break가 있어도 무시됨). max-width:100%만 두면 컨테이너 폭 안에서 자연스럽게 줄바꿈된다.
  const tableHTML = `<table style="max-width:100%; min-width:100%; border-collapse:collapse; text-align:center; font-size:13px; background:var(--surface-color); white-space:pre-wrap; word-break:break-word; margin: 15px 0;"><tbody><tr><th style="border:1px solid var(--border-color); padding:10px; background:var(--table-bg-alt); color:var(--primary-color); min-width:80px; resize:horizontal; overflow:hidden;">제목1</th><th style="border:1px solid var(--border-color); padding:10px; background:var(--table-bg-alt); color:var(--primary-color); min-width:80px; resize:horizontal; overflow:hidden;">제목2</th></tr><tr><td style="border:1px solid var(--border-color); padding:10px; min-width:80px; resize:horizontal; overflow:hidden;">내용1</td><td style="border:1px solid var(--border-color); padding:10px; min-width:80px; resize:horizontal; overflow:hidden;">내용2</td></tr></tbody></table><div><br></div>`;
  
  const foldHTML = buildFoldBoxHtml() + BLANK_LINE_HTML;

  const iconBtnStyle = { padding: '4px 6px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', transition: '0.2s' };

  const handleFontChange = (e) => {
    const val = e.target.value;
    applyFont(val);
    
    if (val !== 'default') {
      let recents = [...recentFonts];
      recents = recents.filter(f => f !== val);
      recents.unshift(val);
      if (recents.length > 5) recents.pop();
      
      localStorage.setItem('galpi-recent-fonts', JSON.stringify(recents));
      setRecentFonts(recents);
    }
  };

  const handleFontReset = () => {
    applyFont('default');
    if (selectRef.current) selectRef.current.value = 'default';
  };

  const applyTextWrap = (prefix, suffix) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const selectedText = selection.toString();
    document.execCommand('insertText', false, prefix + selectedText + suffix);
    
    if (selectedText.length === 0) {
      for (let i = 0; i < suffix.length; i++) {
        selection.modify('move', 'backward', 'character');
      }
    }
  };

  const recentFontObjs = recentFonts.map(rf => fontList?.find(f => f.fontFamily === rf)).filter(Boolean);

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
      
      <select 
        ref={selectRef}
        onChange={handleFontChange}
        defaultValue={localStorage.getItem('galpi-default-font') || 'default'}
        title="선택한 영역 또는 전체 글꼴 변경"
        style={{ padding: '3px 6px', fontSize: '11px', fontWeight: 'bold', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--surface-color)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', minWidth: '110px' }}
      >
        <option value="default">기본 폰트</option>
        
        {recentFontObjs.map(f => (
          <option key={`recent_${f.filename}`} value={f.fontFamily}>[최근] {f.displayName}</option>
        ))}

        {recentFontObjs.length > 0 && <option disabled>──────────</option>}

        {fontList && fontList.length > 0 && fontList.map(f => (
          <option key={`all_${f.filename}`} value={f.fontFamily}>{f.displayName}</option>
        ))}
      </select>

      <button 
        className="wiki-btn" 
        onClick={handleFontReset} 
        style={{ ...iconBtnStyle, color: '#e53e3e', borderColor: 'rgba(229,62,62,0.3)', marginRight: '4px' }} 
        title="기본 폰트로 되돌리기"
      >
        <FontResetIcon />
      </button>

      <button className="wiki-btn" onClick={() => executeCmd('bold')} style={iconBtnStyle} title="굵게 (Ctrl+B)">
        <BoldIcon />
      </button>
      <button className="wiki-btn" onClick={() => executeCmd('italic')} style={iconBtnStyle} title="기울임 (Ctrl+I)">
        <ItalicIcon />
      </button>
      <button className="wiki-btn" onClick={() => executeCmd('strikeThrough')} style={iconBtnStyle} title="취소선">
        <StrikethroughIcon />
      </button>

      <button className="wiki-btn" onClick={() => applyTextWrap('*', '*')} style={iconBtnStyle} title="별표 감싸기 (*텍스트*)">
        <CrackIcon />
      </button>
      <button className="wiki-btn" onClick={() => applyTextWrap('*(', ')*')} style={iconBtnStyle} title="괄호 감싸기 (*(텍스트)*)">
        <BabyIcon />
      </button>
      
      <button className="wiki-btn" onClick={insertFootnote} style={iconBtnStyle} title="각주 삽입 (Ctrl+Q)">
        <FootnoteIcon />
      </button>

      <button className="wiki-btn" onClick={insertMarkdownLink} style={iconBtnStyle} title="링크 삽입 (Alt+W)">
        <LinkIcon />
      </button>

      <button className="wiki-btn" onClick={() => insertHtml(tableHTML)} style={iconBtnStyle} title="표 삽입">
        <TableIcon />
      </button>
      <button className="wiki-btn" onClick={() => insertHtml(checkHTML)} style={iconBtnStyle} title="할 일 삽입">
        <TodoIcon />
      </button>
      <button className="wiki-btn" onClick={() => insertHtml(foldHTML)} style={iconBtnStyle} title="접기 박스 삽입">
        <FoldIcon />
      </button>
      <button className="wiki-btn" onClick={() => { setFindReplaceVisible(!findReplaceVisible); setTableCtrlVisible(false); }} style={iconBtnStyle} title="찾아 바꾸기">
        <SearchIcon />
      </button>

      {/* ★ 상용구 툴바 그룹 */}
      <button className="wiki-btn" onClick={openTemplateList} style={iconBtnStyle} title="상용구 목록 불러오기">
        <TemplateIcon />
      </button>
      
      {/* 두 번째 버튼: 드래그 시 저장, 미드래그 시 '새 상용구 폼 추가' 모달로 스마트 분기 */}
      <button className="wiki-btn" onClick={saveAsTemplate} style={iconBtnStyle} title="새 상용구 추가 / 선택 영역 템플릿 저장 (Alt+T)">
        <TemplateSaveIcon />
      </button>

      {/* 사전에 원문 등록 / 드래그 영역 사전 전송 */}
      <button className="wiki-btn" onClick={saveToDict} style={iconBtnStyle} title="사전에 원문 등록 / 새 단어 추가 (Alt+Shift+H)">
        <DictAddIcon />
      </button>

      {/* 세 번째 마술봉 버튼: 상용구 추천 기능 즉각 토글 */}
      <button 
        className="wiki-btn" 
        onClick={toggleAutoSnippet} 
        style={{ 
          ...iconBtnStyle, 
          marginLeft: '4px',
          color: isAutoSnippet ? 'white' : 'var(--text-primary)',
          background: isAutoSnippet ? 'var(--primary-color)' : 'var(--bg-color)',
          borderColor: isAutoSnippet ? 'var(--primary-color)' : 'var(--border-color)',
        }} 
        title={isAutoSnippet ? "상용구 실시간 추천 켜짐 (클릭 시 꺼짐)" : "상용구 실시간 추천 꺼짐 (클릭 시 켜짐)"}
      >
        <AutoSnippetIcon />
      </button>
    </div>
  );
};

export default MemoFormatMainBar;
// 절대 경로: src/components/macro/MacroToolbar.jsx
// 기능 요약: 위키 편집 페이지에 부착되는 그래프/타임라인 등 매크로 원터치 특수 툴바 (슬라이딩 서랍 UI 적용)

import React, { useState } from 'react';
import styles from './MacroToolbar.module.css';

import { RadarEditor, BarEditor, TimelineEditor } from '../../domains/macro/BasicMacroTools';
import RelationEditor from '../../domains/macro/RelationEditor';
import TableEditor from '../../domains/macro/tools/table/TableEditor';

const MACRO_TOOLS = [
  { id: 'table', icon: 'table.svg', tooltip: '엑셀형 표 생성/편집기' },
  { id: 'bar', icon: 'barGraph.svg', tooltip: '상태창 게이지 바 에디터' },
  { id: 'radar', icon: 'radarChart.svg', tooltip: '방사형 스탯 차트 에디터' },
  { id: 'timeline', icon: 'timeline.svg', tooltip: '타임라인(연표)' },
  { id: 'relation', icon: 'relation.svg', tooltip: '비주얼 인물 관계도 캔버스' }
];

const MacroToolbar = ({ editorRef, rawText, onInsert }) => {
  const [activeTool, setActiveTool] = useState(null);

  // ★ 표 등 매크로 도구를 열어놓고 한참 내용을 채우다 삽입을 누르면, 그동안 써둔 본문이
  // 통째로 사라지는 버그가 있었다 — insert 시점에 editorRef.current.value(DOM)를 다시
  // 읽어서 그걸 기준으로 잘라붙이는 방식이었는데, 도구가 열려 있는 동안 어떤 이유로든
  // textarea DOM이 다시 그려지면(예: 개발 중 HMR, 혹은 다른 리렌더) 그 시점의 DOM 값이
  // 진짜 최신 본문과 어긋날 수 있었다. React state(rawText)가 항상 유일한 진실 소스이므로,
  // DOM을 다시 읽는 대신 이걸 그대로 쓴다. 커서 위치(start/end)도 도구를 여는 "그 순간"에
  // 한 번만 고정해두고, 도구가 열려 있는 동안 textarea 쪽에서 벌어지는 어떤 일과도
  // 완전히 무관하게 만든다.
  const handleOpenModal = (tool) => {
    let start = rawText.length, end = rawText.length;
    if (editorRef.current) {
      start = editorRef.current.selectionStart;
      end = editorRef.current.selectionEnd;
    }
    const text = rawText.substring(start, end);
    setActiveTool({ ...tool, selectedText: text, insertStart: start, insertEnd: end });
  };

  const handleCloseModal = () => setActiveTool(null);

  const handleInsertSnippet = (snippet) => {
    const start = activeTool?.insertStart ?? rawText.length;
    const end = activeTool?.insertEnd ?? rawText.length;

    onInsert(rawText.substring(0, start) + snippet + rawText.substring(end), start + snippet.length);
    handleCloseModal();
  };

  const renderActiveTool = () => {
    if (!activeTool) return null;
    
    const props = { 
      selectedText: activeTool.selectedText, 
      onInsert: handleInsertSnippet, 
      onCancel: handleCloseModal 
    };

    switch (activeTool.id) {
      case 'table': return <TableEditor {...props} />;
      case 'radar': return <RadarEditor {...props} />;
      case 'bar': return <BarEditor {...props} />;
      case 'timeline': return <TimelineEditor {...props} />;
      case 'relation': return <RelationEditor {...props} />;
      default: return null;
    }
  };

  return (
    <>
      {/* 화면 좌측 투명 센서 래퍼 (Hover 감지 구역) */}
      <div className={styles.toolbarWrapper}>
        <div className={styles.sidebarToolbar}>
          {MACRO_TOOLS.map(tool => (
            <button key={tool.id} className={styles.toolBtn} onClick={() => handleOpenModal(tool)} type="button">
              <img src={`/img/svg/${tool.icon}`} alt="" onError={(e) => e.target.style.display = 'none'} />
              <span className={styles.toolTip}>{tool.tooltip}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTool && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} style={{ width: activeTool.id === 'relation' ? '1000px' : (activeTool.id === 'timeline' ? '500px' : 'max-content') }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{activeTool.tooltip} <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{activeTool.selectedText ? '(수정 모드)' : '(생성 모드)'}</span></h3>
              <button className={styles.closeBtn} onClick={handleCloseModal}>&times;</button>
            </div>
            {renderActiveTool()}
          </div>
        </div>
      )}
    </>
  );
};

export default MacroToolbar;
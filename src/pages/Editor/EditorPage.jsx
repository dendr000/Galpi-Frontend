// 파일 위치: src/pages/Editor/EditorPage.jsx
import React, { useState } from 'react';
import styles from './EditorPage.module.css';
import EditorSearch from './EditorSearch';
import MacroToolbar from '../../domains/macro/MacroToolbar';
import { useEditorData } from './hooks/useEditorData';
import EditorHeader from './components/EditorHeader';
import EditorPreviewPane from './components/EditorPreviewPane';
import EditorWritePane from './components/EditorWritePane';
import EditorSettingsModal from './components/EditorSettingsModal';
import { IconBook, IconDocument, IconUser } from './components/EditorIcons';

const EditorPage = () => {
  const {
    docType, docAction, loading,
    title, setTitle, rawText, setRawText, overviewText, setOverviewText,
    workMeta, setWorkMeta, charProps, setCharProps, themeColor, setThemeColor,
    cardLabels, setCardLabels, editorRef, handleGoBack, handleSave, saveStatus,
    workContext, isHidden, setIsHidden, fontList, backlinkCandidates
  } = useEditorData();

  const [layoutMode, setLayoutMode] = useState('focus'); // 기본값을 'dual'에서 'focus'로 변경
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const badgeText =
    docType === 'work' ? (docAction === 'new' ? <><IconBook /> 새 작품 등록</> : <><IconBook /> 작품 편집</>) :
      docType === 'page' ? (docAction === 'new' ? <><IconDocument /> 새 위키 문서</> : <><IconDocument /> 문서 편집</>) :
        (docAction === 'new' ? <><IconUser /> 새 캐릭터 추가</> : <><IconUser /> 캐릭터 상세 편집</>);

  const handleEditorKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      setRawText(rawText.substring(0, start) + "    " + rawText.substring(end));
      setTimeout(() => {
        editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 4;
      }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave(false);
    }
  };

  const handleMacroInsert = (newText, newCursorPos) => {
    setRawText(newText);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontWeight: 'bold' }}>에디터 로딩 중...</div>;

  return (
    <div className={styles.editorFullBleed}>

      <EditorSearch editorRef={editorRef} rawText={rawText} setRawText={setRawText} />
      <MacroToolbar editorRef={editorRef} rawText={rawText} onInsert={handleMacroInsert} />

      <EditorHeader
        badgeText={badgeText}
        saveStatus={saveStatus}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        handleGoBack={handleGoBack}
        handleSave={handleSave}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <EditorSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        docType={docType}
        title={title}
        workMeta={workMeta}
        setWorkMeta={setWorkMeta}
        charProps={charProps}
        setCharProps={setCharProps}
        themeColor={themeColor}
        setThemeColor={setThemeColor}
        cardLabels={cardLabels}
        setCardLabels={setCardLabels}
        workContext={workContext}
        isHidden={isHidden}
        setIsHidden={setIsHidden}
        overviewText={overviewText}
        setOverviewText={setOverviewText}
      />

      {/* ★ 핵심: 듀얼 모드일 땐 100% 와이드, 그 외엔 1000px로 예쁘게 중앙 정렬되되, 창을 좁히면 찌그러짐 없이 100% 수축 (가로 스크롤 없음) */}
      <div
        className={styles.editorLayout}
        style={{
          width: '100%',
          maxWidth: layoutMode === 'dual' ? '100%' : '1000px',
          minWidth: 0,
          margin: '0 auto',
          transition: 'max-width 0.3s ease'
        }}
      >
        <div style={{ flex: 1, display: layoutMode === 'focus' ? 'none' : 'flex', flexDirection: 'column', minWidth: 0 }}>
          <EditorPreviewPane
            isPreviewOpen={true}
            title={title}
            docType={docType}
            workMeta={workMeta}
            charProps={charProps}
            overviewText={overviewText}
            rawText={rawText}
          />
        </div>

        {layoutMode === 'dual' && (
          <div className={styles.paneResizer}>
            <div style={{ width: '4px', height: '30px', background: 'var(--text-secondary)', borderRadius: '2px', opacity: 0.5 }}></div>
          </div>
        )}

        <div style={{ flex: 1, display: layoutMode === 'preview' ? 'none' : 'flex', flexDirection: 'column', minWidth: 0 }}>
          <EditorWritePane
            docType={docType}
            title={title}
            setTitle={setTitle}
            rawText={rawText}
            setRawText={setRawText}
            editorRef={editorRef}
            handleEditorKeyDown={handleEditorKeyDown}
            fontList={fontList}
            backlinkCandidates={backlinkCandidates}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
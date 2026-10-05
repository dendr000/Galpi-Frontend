// 파일 위치: src/pages/BulkStudio/BulkToolbar.jsx
// 기능 요약: 엑셀형 워크스페이스 상단에 위치하여 작품 선택, 행/열 추가, 탭 모드 전환, 정렬, 찾아바꾸기, 일괄 덮어쓰기 기능을 제공하는 컴포넌트

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArchive, IconCheck, IconClipboard } from '../../components/common/icons/DomainIcons';

const BulkToolbar = ({
  works, selectedWorkId, loadCharacters, addRow, addColumn, columns,
  tabMode, setTabMode, sortTable, applyBatchValue, setFindReplaceModal, setPasteModal,
  labels, setLabels, isPreviewOpen, setIsPreviewOpen
}) => {
  const navigate = useNavigate();
  const [addCount, setAddCount] = useState(1);
  const [batchCol, setBatchCol] = useState('');
  const [batchVal, setBatchVal] = useState('');

  const handleAddRow = () => {
    addRow(Number(addCount) || 1);
    setAddCount(1);
  };

  const handleAddCol = () => {
    const newCol = prompt("모든 캐릭터에 추가할 속성명 (예: 무기):");
    addColumn(newCol);
  };

  return (
    <>
      <div className="header">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="wiki-btn" 
            style={{ padding: '6px 12px', background: 'var(--surface-color)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontSize: '15px' }} 
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            title={isPreviewOpen ? '미리보기 닫기' : '미리보기 열기'}
          >
            {isPreviewOpen ? '◀' : '▶'}
          </button>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontSize: '20px' }}><IconArchive size={20} /> 캐릭터 일괄 관리 스튜디오</h2>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select className="tool-input" style={{ width: '250px', padding: '8px' }} value={selectedWorkId} onChange={e => loadCharacters(e.target.value)}>
            <option value="">-- 작품 선택 --</option>
            {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
          <button className="wiki-btn" style={{ padding: '8px 15px', background: 'var(--surface-color)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }} onClick={() => navigate(selectedWorkId ? `/work/${selectedWorkId}` : '/')}>◀ 돌아가기</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-group">
          <input type="number" value={addCount} min="1" onChange={e => setAddCount(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddRow()} className="tb-input-sm" title="추가할 행 개수 (Enter로 바로 추가)" style={{ width: '40px' }} />
          <button className="icon-btn" onClick={handleAddRow} title="새 캐릭터(행) 추가">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            행 추가
          </button>
          <button className="icon-btn" onClick={handleAddCol} title="새 속성(열) 추가">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            열 추가
          </button>
          <button className="icon-btn" onClick={() => setPasteModal({ isOpen: true })} title="텍스트 붙여넣기로 여러 명 한 번에 추가">
            <IconClipboard size={16} />
            붙여넣기로 추가
          </button>
        </div>
        
        <div className="toolbar-divider"></div>
        
        <div className="toolbar-group">
          <button className="icon-btn" onClick={() => setTabMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')} title={`탭 이동 방향: ${tabMode === 'horizontal' ? '가로(좌우)' : '세로(상하)'}`} style={tabMode === 'vertical' ? { color: 'var(--primary-color)', background: 'rgba(59,91,219,0.1)', borderColor: 'var(--primary-color)' } : {}}>
            {tabMode === 'horizontal' ? (
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="12" x2="22" y2="12"></line><polyline points="8 6 2 12 8 18"></polyline><polyline points="16 6 22 12 16 18"></polyline></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><polyline points="8 6 12 2 16 6"></polyline><polyline points="8 18 12 22 16 18"></polyline></svg>
            )}
            탭 이동
          </button>
          <button className="icon-btn" onClick={() => setFindReplaceModal({ isOpen: true })} title="찾아 바꾸기 (치환)">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><path d="M11 8v6"></path><path d="M8 11h6"></path></svg>
            찾아 바꾸기
          </button>
        </div>

        <div className="toolbar-divider"></div>
        
        <div className="toolbar-group">
          <label className="tb-label">정렬:</label>
          <select className="tb-select" onChange={e => sortTable(e.target.value)}>
            <option value="card">카드 배치 순</option>
            <option value="name">가나다 순</option>
          </select>
        </div>

        <div className="toolbar-divider"></div>
        
        <div className="toolbar-group batch-group" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="tb-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary-color)', fontWeight: 'bold' }}><IconCheck size={14} /> 선택 일괄 적용:</span>
          <select className="tb-select" value={batchCol} onChange={e => setBatchCol(e.target.value)}>
            <option value="">- 속성 선택 -</option>
            {columns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" className="tb-input" value={batchVal} onChange={e => setBatchVal(e.target.value)} placeholder="적용할 값..." style={{ width: '120px' }} />
          <button className="icon-btn apply" onClick={() => applyBatchValue(batchCol, batchVal)} title="일괄 적용 실행" style={{ color: 'white', background: 'var(--primary-color)' }}>
            실행
          </button>
        </div>
      </div>

      <div className="bulk-toolbar" style={{ borderBottom: '1px solid var(--border-color)', padding: '8px 20px', background: 'var(--surface-color)', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>[일괄 카드 표시 설정]</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label style={{ fontSize: '12px' }}>이름 옆:</label>
          <input type="text" className="tb-input" value={labels.label1} onChange={e => setLabels(prev => ({ ...prev, label1: e.target.value }))} style={{ padding: '4px 8px', width: '100px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label style={{ fontSize: '12px' }}>이름 아래:</label>
          <input type="text" className="tb-input" value={labels.label2} onChange={e => setLabels(prev => ({ ...prev, label2: e.target.value }))} style={{ padding: '4px 8px', width: '140px' }} />
        </div>
      </div>
    </>
  );
};

export default BulkToolbar;
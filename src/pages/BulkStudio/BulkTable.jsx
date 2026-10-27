// 파일 위치: src/pages/BulkStudio/BulkTable.jsx
// 기능 요약: React Virtual 엔진과 네이티브 Datalist 자동완성 검색 드롭다운이 융합된 테이블 코어

import React, { useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import BulkTableRow from './BulkTableRow';
import { askColumnPosition } from './columnMovePrompt';
import { IconChevronLeft, IconChevronRight } from '../../components/common/icons/DomainIcons';

const BulkTable = ({ 
  columns, rows, loading, tabMode, suggestions, selectedWorkId,
  handleCellChange, toggleRowCheck, toggleAllChecks, removeRow, removeColumn, 
  changeColOrder, setActiveRowIdx, setBodyModal 
}) => {
  const tableWrapRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableWrapRef.current,
    estimateSize: () => 45, 
    overscan: 10, 
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // ★ 글로벌 DB 검색 결과(suggestions)와 현재 화면의 로컬 데이터를 병합하여 브라우저에 던져줌
  const datalists = useMemo(() => {
    const lists = {};
    columns.forEach(col => {
      // 1.5초 디바운싱으로 받아온 백엔드 글로벌 제안 목록을 우선 삽입
      const set = new Set(suggestions[col] || []); 
      
      // 현재 열려있는 화면에 작성된 데이터도 수집하되, 콤마가 있으면 쪼개서 넣습니다.
      rows.forEach(r => {
        if (r[col] && r[col].toString().trim() !== "") {
          let valStr = r[col].toString().trim();
          if (valStr.includes(',')) {
            valStr.split(',').forEach(part => {
              if (part.trim() !== "") set.add(part.trim());
            });
          } else {
            set.add(valStr);
          }
        }
      });
      lists[col] = Array.from(set);
    });
    return lists;
  }, [columns, rows, suggestions]);

  // BulkTableRow(React.memo)에 그대로 내려가는 콜백이라, tabMode가 안 바뀌는 한 항상 같은
  // 참조를 유지해야 memo 비교가 의미가 있다.
  const handleKeyDown = useCallback((e, rowIdx, colName) => {
    if (e.key === 'Tab' && tabMode === 'vertical') {
      e.preventDefault();
      const nextRowIdx = e.shiftKey ? rowIdx - 1 : rowIdx + 1;
      const selector = colName === 'name'
        ? `.b-name[data-row="${nextRowIdx}"]`
        : `.b-prop[data-row="${nextRowIdx}"][data-col="${colName}"]`;
      const nextInput = document.querySelector(selector);
      if (nextInput) {
        nextInput.focus();
        // 관계/성별처럼 <select>로 바뀐 칸엔 .select() 메서드가 없어서 그냥 두면 던진다.
        if (typeof nextInput.select === 'function') setTimeout(() => nextInput.select(), 10);
      }
    }
  }, [tabMode]);

  const allChecked = rows.length > 0 && rows.every(r => r._checked);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontWeight: 'bold' }}>로딩 중...</div>;
  if (rows.length === 0) {
    const emptyMsg = selectedWorkId
      ? "이 작품에는 아직 캐릭터가 없습니다. 위의 '붙여넣기로 추가'나 '행 추가'로 만들어 주세요."
      : '작품을 선택해 주세요.';
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>{emptyMsg}</div>;
  }

  return (
    <>
      <div className="tableWrap" ref={tableWrapRef} style={{ overflow: 'auto', height: '100%', position: 'relative' }}>
        <table className="table">
          <thead>
            <tr>
              <th className="sticky-check">
                <input type="checkbox" checked={allChecked} onChange={e => toggleAllChecks(e.target.checked)} title="전체 선택" />
              </th>
              <th className="sticky-delete">삭제</th>
              <th className="sticky-name">이름 (필수)</th>
              {columns.map((col, i) => {
                const isFirst = col === '부제목';
                const atLeft = i <= 1;
                const atRight = i >= columns.length - 1;
                return (
                <th key={col} style={{ width: '150px', minWidth: '150px' }} className="colHeaderCell">
                  {/* 화살표로 한 칸씩 옮기고, 속성 이름을 클릭하면 몇 번째로 옮길지 직접 입력할 수
                      있다(멀리 옮길 때). 삭제(✖)는 늘 보이면 지저분해서 이 칸에 호버했을 때만
                      나타나게 뺐다 — .colDeleteBtn의 opacity는 BulkStudio.module.css에서 처리. */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                    <button type="button" onClick={() => changeColOrder(i, i)} disabled={isFirst || atLeft} title="왼쪽으로 한 칸" style={{ border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: (isFirst || atLeft) ? 'default' : 'pointer', opacity: (isFirst || atLeft) ? 0.25 : 1, display: 'flex', padding: '2px', flexShrink: 0 }}>
                      <IconChevronLeft size={13} />
                    </button>
                    <span
                      onClick={async () => {
                        if (isFirst) return;
                        const n = await askColumnPosition(col, i, columns.length);
                        if (n !== null) changeColOrder(i, n);
                      }}
                      title={isFirst ? '' : '클릭하면 몇 번째로 옮길지 바로 입력'}
                      style={{ fontWeight: 900, cursor: isFirst ? 'default' : 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    >
                      {col}
                    </span>
                    <button type="button" onClick={() => changeColOrder(i, i + 2)} disabled={isFirst || atRight} title="오른쪽으로 한 칸" style={{ border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: (isFirst || atRight) ? 'default' : 'pointer', opacity: (isFirst || atRight) ? 0.25 : 1, display: 'flex', padding: '2px', flexShrink: 0 }}>
                      <IconChevronRight size={13} />
                    </button>
                    <button type="button" onClick={() => removeColumn(col)} className="colDeleteBtn" title="속성 삭제" style={{ border: 'none', background: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0 2px', flexShrink: 0, visibility: isFirst ? 'hidden' : 'visible' }}>✖</button>
                  </div>
                </th>
                );
              })}
              <th className="sticky-body">상세 본문 (모달)</th>
            </tr>
          </thead>
          
          <tbody>
            {virtualItems.length > 0 && (
              <tr style={{ height: `${virtualItems[0].start}px` }}></tr>
            )}
            
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <BulkTableRow 
                  key={row.id} 
                  row={row} 
                  rIdx={virtualRow.index} 
                  columns={columns}
                  handleCellChange={handleCellChange}
                  toggleRowCheck={toggleRowCheck}
                  removeRow={removeRow}
                  setActiveRowIdx={setActiveRowIdx}
                  handleKeyDown={handleKeyDown}
                  setBodyModal={setBodyModal}
                />
              );
            })}
            
            {virtualItems.length > 0 && (
              <tr style={{ height: `${rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end}px` }}></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 브라우저 네이티브 자동완성 UI 렌더링 컨테이너 */}
      <div style={{ display: 'none' }}>
        {columns.map(col => (
          <datalist id={`dl-${col}`} key={col}>
            {datalists[col]?.map(val => <option key={val} value={val}></option>)}
          </datalist>
        ))}
      </div>
    </>
  );
};

export default BulkTable;
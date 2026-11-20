// 파일 위치: src/pages/BulkStudio/BulkTableRow.jsx
// 기능 요약: React 가상화 테이블의 개별 행(Row)을 렌더링하며 고정(Sticky) 셀의 투명도 중첩을 방지하는 모듈

import React from 'react';
import { IconPen, IconPlus } from '../../components/common/icons/DomainIcons';
import Icon from '../../components/common/icons/Icon';
import { ENUM_COLUMNS } from './useBulkStudioData';

const BulkTableRow = ({ 
  row, rIdx, columns, 
  handleCellChange, toggleRowCheck, removeRow, 
  setActiveRowIdx, handleKeyDown, setBodyModal,
  setRowHidden, setRowSwitchTarget, nameOptions = []
}) => {
  const isNew = String(row.id).startsWith('new_');
  const rowClass = [row._checked ? 'checked-row' : '', row._hidden ? 'hidden-row' : ''].filter(Boolean).join(' ');
  const switchTarget = row._switchTarget || '';
  const selfName = (row.name || '').trim();
  const options = nameOptions.filter((n) => n !== selfName);
  const targetMissing = switchTarget !== '' && !options.includes(switchTarget);
  
  // ★ 스크롤 시 글자가 비쳐 보이는 것을 막기 위해 Sticky 셀 전용 불투명 배경색 추출
  const bgCol = row._checked ? 'var(--table-bg-alt)' : 'var(--surface-color)';

  return (
    <tr className={rowClass} style={{ background: bgCol }}>
      <td className="sticky-check" style={{ background: bgCol }}>
        {/* onChange이 아니라 onClick을 쓴다 — 체크박스의 React onChange 합성 이벤트는
            shiftKey를 실어 나르지 않아서(원래부터 있던 버그), shift+클릭 범위선택이
            항상 조건을 못 타고 단일 토글로만 빠졌었다. onClick의 네이티브 MouseEvent는
            shiftKey를 정상적으로 갖고 있다. */}
        <input type="checkbox" checked={row._checked} onChange={() => {}} onClick={e => toggleRowCheck(e, rIdx)} />
      </td>
      <td className="sticky-delete" style={{ background: bgCol }}>
        <button onClick={() => removeRow(rIdx)} style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✖</button>
      </td>
      <td className="sticky-name" style={{ background: bgCol }}>
        <input 
          type="text" 
          className="input b-name" 
          data-row={rIdx} 
          value={row.name} 
          onChange={e => handleCellChange(rIdx, 'name', e.target.value)} 
          onFocus={() => setActiveRowIdx(rIdx)} 
          onKeyDown={e => handleKeyDown(e, rIdx, 'name')}
          placeholder={isNew ? '새 캐릭터명' : ''} 
          style={isNew ? { boxShadow: 'inset 0 0 0 1px #10b981' } : {}}
        />
      </td>
      
      <td className="form-cell">
        <button
          type="button"
          className={`vis-toggle ${row._hidden ? 'is-hidden' : 'is-shown'}`}
          aria-pressed={!!row._hidden}
          onClick={() => setRowHidden(rIdx, !row._hidden)}
          title={row._hidden ? '지금은 작품 페이지 목록에 안 보입니다. 누르면 다시 보입니다' : '작품 페이지 목록에 보입니다. 누르면 숨깁니다'}
        >
          <Icon name={row._hidden ? 'eye-off' : 'eye'} size={13} />
          {row._hidden ? '숨김' : '보임'}
        </button>
      </td>
      <td className="form-cell">
        <select
          className={`input form-select${switchTarget ? ' has-target' : ''}`}
          value={switchTarget}
          onChange={e => setRowSwitchTarget(rIdx, e.target.value)}
          onFocus={() => setActiveRowIdx(rIdx)}
          title="이 캐릭터를 SHIFT+클릭했을 때 다음에 보일 캐릭터"
        >
          <option value="">- 없음 -</option>
          {targetMissing && <option value={switchTarget}>{switchTarget} (없는 캐릭터)</option>}
          {options.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </td>

      {columns.map(col => {
        const enumConf = ENUM_COLUMNS[col];
        if (enumConf) {
          return (
            <td key={col}>
              <select
                className="input b-prop"
                data-row={rIdx}
                data-col={col}
                value={row[col] || enumConf.fallback}
                onChange={e => handleCellChange(rIdx, col, e.target.value)}
                onFocus={() => setActiveRowIdx(rIdx)}
                onKeyDown={e => handleKeyDown(e, rIdx, col)}
              >
                {enumConf.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </td>
          );
        }
        let ph = (col === "나이" || col === "신장" || col === "키" || col === "신체") ? "숫자만" : (col === "부제목" ? "영문/별명 입력" : "");
        return (
          <td key={col}>
            <input
              type="text"
              className="input b-prop"
              data-row={rIdx}
              data-col={col}
              list={`dl-${col}`}
              value={row[col] || ''}
              onChange={e => handleCellChange(rIdx, col, e.target.value)}
              onFocus={() => setActiveRowIdx(rIdx)}
              onKeyDown={e => handleKeyDown(e, rIdx, col)}
              placeholder={ph}
              autoComplete="off"
            />
          </td>
        );
      })}
      
      <td className="sticky-body" style={{ background: bgCol }} onClick={() => { setActiveRowIdx(rIdx); setBodyModal({ isOpen: true, rowIdx: rIdx, text: row.pageBodyRaw }); }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: row.pageBodyRaw ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: row.pageBodyRaw ? 900 : 'bold', fontSize: '13px', cursor: 'pointer' }}>
          {row.pageBodyRaw ? <IconPen size={13} /> : <IconPlus size={13} />}
          {row.pageBodyRaw ? '편집' : '내용 작성'}
        </span>
      </td>
    </tr>
  );
};

// React.memo를 통해 부모 데이터(전체 배열)가 변경되어도 해당 행 데이터가 그대로면 렌더링을 차단합니다.
export default React.memo(BulkTableRow);
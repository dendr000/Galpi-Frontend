// Copyright (c) dendr000. MIT License.
// 캐릭터 목록 위의 소속, 등급 칩 필터. 칩을 눌러 켜고 끈다(그룹 안 OR, 그룹 사이 AND).
// 글자색은 부모를 따르고 선택은 테두리와 굵기로 구분한다(장르 테마마다 글자색이 달라서).
import React from 'react';
import { hasActiveFilter } from './characterFilter';

const chipBase = {
  display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '14px',
  background: 'transparent', color: 'inherit', fontSize: '12.5px', cursor: 'pointer', lineHeight: 1.5,
};

const FilterChips = ({ groups, selection, onToggle, onClear, shown, total }) => {
  if (!groups || groups.length === 0) return null;
  const active = hasActiveFilter(selection);
  return (
    <div className="gt-filter-chips" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
      {groups.map((g) => (
        <div key={g.key} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-secondary)', minWidth: '34px' }}>{g.key}</span>
          {g.options.map((o) => {
            const on = (selection?.[g.key] || []).includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(g.key, o.value)}
                style={{
                  ...chipBase,
                  border: on ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  fontWeight: on ? 800 : 500,
                  padding: on ? '2px 9px' : '3px 10px',
                }}
              >
                {`${o.value} ${o.count}`}
              </button>
            );
          })}
        </div>
      ))}
      {active && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          <span>{`${shown} / ${total}명`}</span>
          <button type="button" onClick={onClear} style={{ ...chipBase, border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
            필터 해제
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterChips;

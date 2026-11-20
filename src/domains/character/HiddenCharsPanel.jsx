// Copyright (c) dendr000. MIT License.
// 작품 페이지의 "숨김 캐릭터" 띠. 목록에 보이지 않는 캐릭터를 모아 보여 주고 하나씩 또는 한꺼번에 복구한다.
import React, { useState } from 'react';
import Icon from '../../components/common/icons/Icon';

const ELLIPSIS = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

const HiddenCharsPanel = ({ hidden = [], onRestore }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!hidden || hidden.length === 0) return null;

  const run = async (chars) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await onRestore(chars);
      if (res && res.failed > 0) alert(`${res.failed}명은 복구하지 못했습니다. 잠시 뒤 다시 시도해 주세요.`);
    } finally { setBusy(false); }
  };

  return (
    <div className="gt-hidden-panel" style={{ margin: '0 0 16px', border: '1px dashed var(--border-color)', borderRadius: '10px', background: 'var(--table-bg-alt)', overflow: 'hidden' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 'bold', textAlign: 'left' }}
      >
        <Icon name="eye-off" size={15} style={{ color: 'var(--text-secondary)' }} />
        <span style={{ whiteSpace: 'nowrap' }}>숨김 캐릭터 {hidden.length}명</span>
        <span style={{ flex: 1, minWidth: 0, color: 'var(--text-secondary)', fontWeight: 'normal', ...ELLIPSIS }}>
          목록에는 안 보이고, 다음 폼으로 연결된 캐릭터는 SHIFT+클릭으로 볼 수 있습니다
        </span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} style={{ color: 'var(--text-secondary)' }} />
      </button>
      {open && (
        <div style={{ padding: '4px 14px 12px', borderTop: '1px solid var(--border-color)' }}>
          <ul style={{ listStyle: 'none', margin: '8px 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
            {hidden.map(({ char, formOf }) => (
              <li key={char.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', minWidth: 0 }}>
                <span style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '13px', ...ELLIPSIS }} title={char.name}>{char.name}</span>
                {formOf && (
                  <span title={`${formOf}의 다음 폼`} style={{ fontSize: '11px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1px 7px', flexShrink: 1, ...ELLIPSIS }}>
                    {formOf}의 폼
                  </span>
                )}
                <button
                  type="button"
                  className="wiki-btn"
                  disabled={busy}
                  onClick={() => run([char])}
                  title="목록에 다시 보이게 합니다"
                  style={{ marginLeft: 'auto', padding: '3px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <Icon name="eye" size={12} /> 복구
                </button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="wiki-btn"
              disabled={busy}
              onClick={() => run(hidden.map((h) => h.char))}
              style={{ padding: '4px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
            >
              <Icon name="eye" size={13} /> 모두 복구
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>복구하면 그 캐릭터가 갤러리에 따로 나타납니다. 진화체라면 일괄 관리 스튜디오에서 연결을 확인하세요.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiddenCharsPanel;

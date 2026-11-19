// Copyright (c) dendr000. MIT License.
// 편집 중인 본문의 문법 실수(닫히지 않은 로그탭, 표 칸 수 불일치 등)를 화면 아래에 알려 주는 줄.
// 항목을 누르면 그 줄로 커서를 옮긴다. 본문은 바꾸지 않는다.
import React, { useMemo, useState, useDeferredValue } from 'react';
import { lintWikiText } from '../../../utils/markdown/lintWikiText';

const barStyle = {
  position: 'sticky', bottom: 0, zIndex: 5, marginTop: '8px', background: 'var(--surface-color)', color: 'var(--text-primary)',
  border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', fontSize: '13px',
};
const headStyle = { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 12px', background: 'transparent', color: 'inherit', border: 'none', cursor: 'pointer', fontWeight: 800, whiteSpace: 'nowrap' };
const itemStyle = { display: 'block', width: '100%', textAlign: 'left', padding: '5px 12px', background: 'transparent', color: 'inherit', border: 'none', borderTop: '1px dashed var(--border-color)', cursor: 'pointer', fontSize: '12.5px' };

// 줄 번호(1부터)의 시작 위치. 줄이 없으면 글 끝.
export const lineStartIndex = (text, line) => {
  let idx = 0;
  for (let n = 1; n < line; n++) {
    const next = text.indexOf('\n', idx);
    if (next === -1) return text.length;
    idx = next + 1;
  }
  return idx;
};

const SyntaxCheckBar = ({ text, editorRef }) => {
  const deferred = useDeferredValue(text);
  const warnings = useMemo(() => lintWikiText(deferred), [deferred]);
  const [open, setOpen] = useState(false);

  if (warnings.length === 0) return null;

  const goTo = (line) => {
    const el = editorRef?.current;
    if (!el) return;
    const pos = lineStartIndex(el.value, line);
    el.focus();
    el.setSelectionRange(pos, pos);
  };

  return (
    <div style={barStyle} role="region" aria-label="문법 확인">
      <button type="button" style={headStyle} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span style={{ color: '#e8590c' }}>문법 확인 {warnings.length}건</span>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{open ? '접기' : '펼치기'}</span>
      </button>
      {open && (
        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
          {warnings.map((w, i) => (
            <button key={`${w.line}-${i}`} type="button" style={itemStyle} onClick={() => goTo(w.line)}>
              {w.line}줄: {w.message}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SyntaxCheckBar;

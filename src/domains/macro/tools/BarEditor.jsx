// 파일 위치: src/components/macro/tools/BarEditor.jsx
// 기능 요약: 알파벳 등급(EX~F) 지원 게이지 바 에디터 및 실시간 막대 프리뷰어
// 버전: v2.2.0

import React, { useState } from 'react';
import styles from '../MacroToolbar.module.css';
import { parseRankValue } from './rankUtils';
import Icon from '../../../components/common/icons/Icon';

export const BarEditor = ({ selectedText, onInsert, onCancel }) => {
  console.log("[BarEditor] 라이프사이클 이식 스캔 정상");
  const [formList, setFormList] = useState(() => {
    if (selectedText && selectedText.includes('[게이지:')) {
      const match = selectedText.match(/\[게이지:\s*(.*?)\]/);
      if (match) {
        const parsed = [];
        match[1].split(',').forEach(p => {
          const parts = p.split('=');
          if (parts.length === 2) {
            const vParts = parts[1].split('/');
            parsed.push({ label: parts[0].trim(), val: vParts[0].trim(), max: vParts[1] ? vParts[1].trim() : '' });
          }
        });
        if (parsed.length > 0) return parsed;
      }
    }
    return [{ label: '체력', val: '80', max: '100' }, { label: '마력', val: 'S', max: 'EX' }];
  });

  const handleConfirm = () => {
    console.log("[BarEditor] 게이지 바 마크다운 코드 출력");
    const valid = formList.filter(f => f.label.trim() !== "");
    if (valid.length === 0) return alert("게이지 항목을 입력해주세요.");
    onInsert(`\n[게이지: ${valid.map(f => `${f.label}=${f.val}${f.max ? '/' + f.max : ''}`).join(', ')}]\n`);
  };

  return (
    <>
      <div className={styles.modalBody} style={{ display: 'flex', gap: '20px', minWidth: '650px', alignItems: 'stretch' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>항목명과 현재/최대 수치(문자 지원)를 입력하세요.</p>
            <button className="wiki-btn" onClick={() => { console.log("[BarEditor] 상태 레코드 행 추가"); setFormList([...formList, { label: '', val: '50', max: '100' }]); }} style={{ padding: '4px 8px', fontSize: '12px' }}>+ 항목 추가</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            {formList.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <input className={styles.toolInput} value={f.label} onChange={(e) => { const n = [...formList]; n[i].label = e.target.value; setFormList(n); }} placeholder="상태명" style={{ flex: 1 }} />
                 <input type="text" className={styles.toolInput} value={f.val} onChange={(e) => { const n = [...formList]; n[i].val = e.target.value; setFormList(n); }} placeholder="현재" style={{ width: '60px', textAlign: 'center' }} />
                 <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>/</span>
                 <input type="text" className={styles.toolInput} value={f.max} onChange={(e) => { const n = [...formList]; n[i].max = e.target.value; setFormList(n); }} placeholder="최대" style={{ width: '60px', textAlign: 'center' }} />
                 <button onClick={() => { console.log(`[BarEditor] 인덱스 ${i} 삭제`); const n = [...formList]; n.splice(i, 1); setFormList(n); }} style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}><Icon name="close" /></button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: '280px', background: 'var(--table-bg-alt)', borderRadius: '8px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', boxSizing: 'border-box', padding: '12px', justifyContent: 'flex-start', gap: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textAlign: 'center', borderBottom: '1px dashed var(--border-color)', paddingBottom: '5px' }}>
            <Icon name="gauge" lead /> 실시간 게이지 프리뷰
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', overflowY: 'auto', maxHeight: '200px' }}>
            {formList.filter(f => f.label.trim() !== "").map((f, idx) => {
              const cur = parseRankValue(f.val); 
              const mx = f.max ? parseRankValue(f.max) : 100;
              const pct = mx > 0 ? Math.min(100, Math.max(0, (cur / mx) * 100)) : 0;
              let barColor = "var(--primary-color)";
              if (pct <= 30) barColor = "#e53e3e"; else if (pct >= 80) barColor = "#10b981";
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{f.label}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{f.val}{f.max ? '/' + f.max : ''}</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '5px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button className={styles.cancelBtn} onClick={onCancel}>취소</button>
        <button className={styles.confirmBtn} onClick={handleConfirm}>에디터에 삽입</button>
      </div>
    </>
  );
};
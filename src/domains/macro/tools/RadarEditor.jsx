// 파일 위치: src/components/macro/tools/RadarEditor.jsx
// 기능 요약: 알파벳 등급(EX~F) 지원 방사형 스탯 차트 에디터 및 실시간 애니메이션 프리뷰어
// 버전: v2.2.0

import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import styles from '../MacroToolbar.module.css';
import { parseRankValue } from './rankUtils';
import Icon from '../../../components/common/icons/Icon';

export const RadarEditor = ({ selectedText, onInsert, onCancel }) => {
  console.log("[RadarEditor] 라이프사이클 마운트 트래킹");
  const [formList, setFormList] = useState(() => {
    if (selectedText && selectedText.includes('[스탯:')) {
      const match = selectedText.match(/\[스탯:\s*(.*?)\]/);
      if (match) {
        const parsed = [];
        match[1].split(',').forEach(p => {
          const parts = p.split('=');
          if (parts.length === 2) parsed.push({ label: parts[0].trim(), val: parts[1].trim() });
        });
        if (parsed.length > 0) return parsed;
      }
    }
    return [{ label: '근력', val: 'A' }, { label: '민첩', val: 'S' }, { label: '지능', val: 'SS' }];
  });

  const handleConfirm = () => {
    console.log("[RadarEditor] 스니펫 본문 주입 함수 가동");
    const valid = formList.filter(f => f.label.trim() !== "");
    if (valid.length < 3) return alert("스탯 항목은 최소 3개 이상이어야 합니다.");
    onInsert(`\n[스탯: ${valid.map(f => `${f.label}=${f.val}`).join(', ')}]\n`);
  };

  const chartData = formList.map(f => ({
    subject: f.label || '미지정',
    value: parseRankValue(f.val),
    fullMark: 100
  }));

  return (
    <>
      <div className={styles.modalBody} style={{ display: 'flex', gap: '20px', minWidth: '650px', alignItems: 'stretch' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>이름과 수치(숫자 또는 S, A 등 등급)를 입력하세요.</p>
            <button className="wiki-btn" onClick={() => { console.log("[RadarEditor] 스탯 항목 노드 추가"); setFormList([...formList, { label: '', val: 'C' }]); }} style={{ padding: '4px 8px', fontSize: '12px' }}>+ 스탯 추가</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            {formList.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <input className={styles.toolInput} value={f.label} onChange={(e) => { const n = [...formList]; n[i].label = e.target.value; setFormList(n); }} placeholder="스탯명" style={{ flex: 1 }} />
                 <input type="text" className={styles.toolInput} value={f.val} onChange={(e) => { const n = [...formList]; n[i].val = e.target.value; setFormList(n); }} placeholder="수치/등급" style={{ width: '80px', textAlign: 'center' }} />
                 <button onClick={() => { console.log(`[RadarEditor] 항목 삭제: 인덱스 ${i}`); const n = [...formList]; n.splice(i, 1); setFormList(n); }} style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}><Icon name="close" /></button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: '280px', background: 'var(--table-bg-alt)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '5px', marginTop: '10px' }}>
          <Icon name="bar-chart" lead /> 실시간 차트 프리뷰
        </div>
          {chartData.length >= 3 ? (
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="var(--border-color)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-primary)', fontSize: 10, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 8 }} />
                  <Radar name="스탯" dataKey="value" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.3} isAnimationActive={true} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#e53e3e', fontWeight: 'bold', textAlign: 'center', padding: '20px' }}>꼭짓점이 3개 이상일 때<br/>레이더 그래프가 가동됩니다.</div>
          )}
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button className={styles.cancelBtn} onClick={onCancel}>취소</button>
        <button className={styles.confirmBtn} onClick={handleConfirm}>에디터에 삽입</button>
      </div>
    </>
  );
};
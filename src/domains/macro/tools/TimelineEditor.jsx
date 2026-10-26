// 파일 위치: src/components/macro/tools/TimelineEditor.jsx
// 기능 요약: Drag & Drop 노드 정렬 기능이 탑재된 연대기 및 사건 타임라인 에디터
// 버전: v2.0.0

import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import styles from '../MacroToolbar.module.css';
import Icon from '../../../components/common/icons/Icon';

export const TimelineEditor = ({ selectedText, onInsert, onCancel }) => {
  console.log("[TimelineEditor] 라이프사이클 인프라 체크");
  const [formList, setFormList] = useState(() => {
    let initialList = [];
    if (selectedText && selectedText.includes('[TIMELINE]')) {
      const lines = selectedText.split('\n');
      let inTimeline = false;
      lines.forEach(line => {
        const t = line.trim();
        if (t === '[TIMELINE]') { inTimeline = true; return; }
        if (t === '[/TIMELINE]') { inTimeline = false; return; }
        if (inTimeline && t) {
          const parts = t.split('::::');
          if (parts.length >= 1) {
            initialList.push({ id: `tl-${Date.now()}-${Math.random()}`, date: (parts[0]||'').trim(), title: (parts[1]||'').trim(), desc: (parts[2]||'').trim().replace(/<br>/g, '\n') });
          }
        }
      });
    }
    if (initialList.length === 0) initialList.push({ id: `tl-${Date.now()}`, date: '', title: '', desc: '' });
    return initialList;
  });

  // 기능: '사건 상세 내용' 칸에서 Tab을 누르면 (기본 탭 순서상 바로 다음인 이 행의 삭제(✖)
  // 버튼을 건너뛰고) 다음 사건의 '날짜' 칸으로 곧장 이동한다. 마지막 사건이면 새 사건을 하나
  // 만들고 그 '날짜' 칸으로 이동한다 — 새로 추가된 행은 다음 렌더링이 끝나야 실제 DOM에
  // 생기므로, 포커스는 formList가 갱신된 뒤 useEffect에서 처리한다.
  const dateInputRefs = useRef([]);
  const pendingFocusIndexRef = useRef(null);

  useEffect(() => {
    if (pendingFocusIndexRef.current !== null) {
      const idx = pendingFocusIndexRef.current;
      pendingFocusIndexRef.current = null;
      dateInputRefs.current[idx]?.focus();
    }
  }, [formList]);

  const handleDescTab = (e, i) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    if (i === formList.length - 1) {
      const newRow = { id: `tl-${Date.now()}`, date: '', title: '', desc: '' };
      pendingFocusIndexRef.current = formList.length;
      setFormList([...formList, newRow]);
    } else {
      dateInputRefs.current[i + 1]?.focus();
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(formList);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFormList(items);
  };

  const handleConfirm = () => {
    console.log("[TimelineEditor] 데이터 컴파일 집행");
    let snippet = `\n[TIMELINE]\n`;
    let count = 0;
    formList.forEach(f => {
      if (f.date || f.title || f.desc) {
        snippet += `${f.date}::::${f.title}::::${f.desc.replace(/\n/g, '<br>')}\n`;
        count++;
      }
    });
    snippet += `[/TIMELINE]\n`;
    if (count === 0) return alert("내용을 하나 이상 입력해야 합니다.");
    onInsert(snippet);
  };

  return (
    <>
      <div className={styles.modalBody}>
        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>사건을 시간 순서대로 작성하세요. <b>(<Icon name="menu" />)</b> 버튼을 끌어올려 순서를 바꿀 수 있습니다.</p>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="timeline-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px', marginBottom: '15px' }}>
                {formList.map((f, i) => (
                  <Draggable key={f.id} draggableId={f.id} index={i}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} style={{ ...provided.draggableProps.style, display: 'flex', gap: '10px', background: 'var(--bg-color)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', alignItems: 'flex-start', boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none', opacity: snapshot.isDragging ? 0.9 : 1 }}>
                        <div {...provided.dragHandleProps} style={{ fontSize: '20px', color: 'var(--text-secondary)', cursor: 'grab', paddingTop: '5px', flexShrink: 0 }}><Icon name="menu" /></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input ref={el => dateInputRefs.current[i] = el} className={styles.toolInput} style={{ width: '140px', flex: 'none', fontWeight: 'bold' }} value={f.date} onChange={(e) => { const n = [...formList]; n[i].date = e.target.value; setFormList(n); }} placeholder="날짜 (예: 2026.06.27)" />
                            <input className={styles.toolInput} style={{ flex: 1, fontWeight: 'bold', minWidth: 0 }} value={f.title} onChange={(e) => { const n = [...formList]; n[i].title = e.target.value; setFormList(n); }} placeholder="사건 제목" />
                          </div>
                          <textarea className={styles.toolInput} style={{ resize: 'vertical', minHeight: '40px', width: '100%', boxSizing: 'border-box' }} value={f.desc} onChange={(e) => { const n = [...formList]; n[i].desc = e.target.value; setFormList(n); }} onKeyDown={(e) => handleDescTab(e, i)} placeholder="사건 상세 내용" />
                        </div>
                        <button style={{ border: 'none', background: 'transparent', color: '#e53e3e', fontSize: '16px', cursor: 'pointer', padding: '5px', flexShrink: 0 }} onClick={() => { const n = [...formList]; n.splice(i, 1); setFormList(n); }}><Icon name="close" /></button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <button type="button" className="wiki-btn" onClick={() => setFormList([...formList, { id: `tl-${Date.now()}`, date: '', title: '', desc: '' }])} style={{ width: '100%', border: '1px dashed var(--primary-color)', background: 'transparent', color: 'var(--primary-color)', padding: '12px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>+ 새로운 사건 추가</button>
      </div>
      <div className={styles.modalFooter}>
        <button className={styles.cancelBtn} onClick={onCancel}>취소</button>
        <button className={styles.confirmBtn} onClick={handleConfirm}>에디터에 삽입</button>
      </div>
    </>
  );
};
// 파일 위치: src/pages/BulkStudio/BulkModals.jsx
// 기능 요약: 전역 찾아 바꾸기 플러그인과 독립된 대형 마크다운 텍스트에어리어 에디터 모달을 렌더링하는 UI 컴포넌트

import React, { useState, useEffect, useRef } from 'react';
import { IconPen, IconSearch, IconClipboard, IconTable } from '../../components/common/icons/DomainIcons';
import BulkPasteGrid from './BulkPasteGrid';

export const BulkModals = ({
  bodyModal, setBodyModal, handleCellChange,
  findReplaceModal, setFindReplaceModal, columns, rows, executeFindReplace,
  pasteModal, setPasteModal, importRowsFromText, importRowsFromGrid
}) => {

  const [findVal, setFindVal] = useState('');
  const [replaceVal, setReplaceVal] = useState('');
  const [targetCol, setTargetCol] = useState('ALL');
  const [bodyText, setBodyText] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteMode, setPasteMode] = useState('text'); // 'grid' | 'text' — 열 때마다 text(텍스트로 붙여넣기)부터 시작한다

  // 본문 모달 동기화
  useEffect(() => {
    if (bodyModal.isOpen) setBodyText(bodyModal.text || '');
  }, [bodyModal.isOpen, bodyModal.text]);

  // Esc로 지금 열려있는 모달을 닫는다 (셋 중 열려있는 거 하나만 닫으면 됨 — 동시에 두 개가
  // 열리는 흐름은 없다).
  useEffect(() => {
    const anyOpen = bodyModal.isOpen || findReplaceModal.isOpen || pasteModal.isOpen;
    if (!anyOpen) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (bodyModal.isOpen) setBodyModal({ isOpen: false });
      else if (findReplaceModal.isOpen) setFindReplaceModal({ isOpen: false });
      else if (pasteModal.isOpen) setPasteModal({ isOpen: false });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [bodyModal.isOpen, findReplaceModal.isOpen, pasteModal.isOpen, setBodyModal, setFindReplaceModal, setPasteModal]);

  const handleSaveBody = () => {
    handleCellChange(bodyModal.rowIdx, 'pageBodyRaw', bodyText);
    setBodyModal({ isOpen: false, rowIdx: null, text: '' });
  };

  const handleExecuteFr = () => {
    executeFindReplace(targetCol, findVal, replaceVal);
  };

  const pasteGridRef = useRef(null);

  // 붙여넣기 모달을 열 때마다 표에 지금 있는 인물들을 그대로 그리드로 불러온다 — 예전엔
  // 매번 빈 칸으로 시작해서 새로 추가하는 용도로만 쓰였는데, 그러다 보니 '추가'를 누르는
  // 순간 모달에 있던 내용이 통째로 사라지는 것처럼 느껴졌다(어차피 새로 열어도 또 빈 칸).
  // 이제는 열 때마다 표 내용을 다시 불러오니, 기존 인물도 여기서 고칠 수 있고 '추가'를
  // 눌러도 다음에 열면 방금 반영된 내용이 그대로 보인다.
  useEffect(() => {
    if (pasteModal.isOpen) {
      setPasteText('');
      setPasteMode('text');
      pasteGridRef.current?.loadFromRows(rows, columns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteModal.isOpen]);

  const pasteLineCount = pasteText.split('\n').filter(l => l.trim() !== '').length;
  const pastePreviewCount = Math.max(0, pasteLineCount - 1);

  const handleExecutePaste = () => {
    const result = pasteMode === 'grid' ? pasteGridRef.current?.submit() : importRowsFromText(pasteText);
    if (!result || result.error) return alert(result?.error || '반영할 내용이 없습니다.');
    const parts = [];
    if (result.count > 0) parts.push(`신규 ${result.count}명`);
    if (result.updatedCount > 0) parts.push(`기존 수정 ${result.updatedCount}명`);
    alert(`${parts.join(' · ')} 반영되었습니다. (아직 저장 전입니다 — 확인 후 전체 저장을 눌러주세요)`);
    setPasteModal({ isOpen: false });
  };

  // 표/텍스트 두 탭 중 어느 쪽에서 고치든 서로 반영되도록, 탭을 넘어가는 순간 지금 보던
  // 쪽의 내용을 다른 쪽 형식으로 옮겨준다. (텍스트 → 표 방향은 첫 줄이 "이름 - ..." 헤더가
  // 아니면 어느 칸이 뭔지 알 수 없어서 그냥 표를 안 건드리고 둔다 — loadFromText 참고.)
  const handlePasteModeChange = (mode) => {
    if (mode === 'text' && pasteMode === 'grid') {
      const text = pasteGridRef.current?.getAsText();
      if (text) setPasteText(text);
    } else if (mode === 'grid' && pasteMode === 'text') {
      pasteGridRef.current?.loadFromText(pasteText);
    }
    setPasteMode(mode);
  };

  return (
    <>
      {/* 1. 마크다운 본문 상세 편집 모달 */}
      {bodyModal.isOpen && (
        <div className="bulk-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div className="bulk-modal-content" style={{ background: 'var(--bg-color)', width: '90%', maxWidth: '800px', height: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--table-bg-alt)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 900, color: 'var(--primary-color)' }}><IconPen size={16} /> 상세 본문 편집</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setBodyModal({ isOpen: false })}>&times;</button>
            </div>
            <textarea 
              value={bodyText} 
              onChange={e => setBodyText(e.target.value)} 
              placeholder="상세 본문 내용을 마크다운으로 작성하십시오." 
              style={{ flex: 1, padding: '20px', border: 'none', outline: 'none', resize: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.6, fontFamily: 'inherit' }}
              autoFocus
            />
            <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--table-bg-alt)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }} onClick={() => setBodyModal({ isOpen: false })}>취소</button>
              <button style={{ background: 'var(--primary-color)', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }} onClick={handleSaveBody}>본문 내용 임시 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 전역 찾아 바꾸기 플러그인 모달 */}
      {findReplaceModal.isOpen && (
        <div className="bulk-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div className="bulk-modal-content" style={{ background: 'var(--bg-color)', width: '90%', maxWidth: '400px', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--table-bg-alt)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 900, color: 'var(--primary-color)' }}><IconSearch size={16} /> 찾아 바꾸기</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setFindReplaceModal({ isOpen: false })}>&times;</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>대상 속성(열)</label>
                <select value={targetCol} onChange={e => setTargetCol(e.target.value)} style={{ width: '100%', marginTop: '5px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', background: 'var(--surface-color)', color: 'var(--primary-color)', outline: 'none' }}>
                  <option value="ALL">모든 속성 (이름 포함)</option>
                  <option value="본문(마크다운)">본문(마크다운)</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>찾을 내용</label>
                <input type="text" value={findVal} onChange={e => setFindVal(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', marginTop: '5px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', background: 'var(--surface-color)', color: 'var(--text-primary)', outline: 'none' }} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>바꿀 내용</label>
                <input type="text" value={replaceVal} onChange={e => setReplaceVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleExecuteFr()} style={{ width: '100%', boxSizing: 'border-box', marginTop: '5px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', background: 'var(--surface-color)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            </div>
            <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--table-bg-alt)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }} onClick={() => setFindReplaceModal({ isOpen: false })}>취소</button>
              <button style={{ background: 'var(--primary-color)', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }} onClick={handleExecuteFr}>모두 바꾸기</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 붙여넣기로 여러 캐릭터를 한 번에 추가/수정하는 모달 — 표의 기존 인물도 그대로 불러와서 같이 고칠 수 있다 */}
      {pasteModal.isOpen && (
        <div className="bulk-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div className="bulk-modal-content" style={{ background: 'var(--bg-color)', width: '90%', maxWidth: pasteMode === 'grid' ? '960px' : '720px', height: '75vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--table-bg-alt)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 900, color: 'var(--primary-color)' }}><IconClipboard size={16} /> 붙여넣기로 추가/수정</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: '999px', padding: '3px', border: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => handlePasteModeChange('grid')}
                    aria-pressed={pasteMode === 'grid'}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '11.5px', fontWeight: 'bold', background: pasteMode === 'grid' ? 'var(--primary-color)' : 'transparent', color: pasteMode === 'grid' ? 'white' : 'var(--text-secondary)' }}
                  >
                    <IconTable size={12} /> 표로 입력
                  </button>
                  <button
                    onClick={() => handlePasteModeChange('text')}
                    aria-pressed={pasteMode === 'text'}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '11.5px', fontWeight: 'bold', background: pasteMode === 'text' ? 'var(--primary-color)' : 'transparent', color: pasteMode === 'text' ? 'white' : 'var(--text-secondary)' }}
                  >
                    텍스트로 붙여넣기
                  </button>
                </div>
                <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setPasteModal({ isOpen: false })}>&times;</button>
              </div>
            </div>

            {/* 탭을 오가도 각자 입력하던 내용을 잃지 않도록 둘 다 항상 마운트해두고 display로만 전환한다 */}
            <div style={{ display: pasteMode === 'grid' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ padding: '14px 20px 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                지금 표에 있는 인물이 그대로 불러와져 있습니다 — 값을 고치면 그 인물이 수정되고, 새 줄에 이름을 적으면 새로 추가됩니다.
                Tab으로 다음 칸, Enter로 아래 칸 이동, '-'는 직접 안 쳐도 됩니다. 미리 써둔 텍스트나 엑셀·구글시트·노션 표는 아무 칸에나 붙여넣으면 흩뿌려집니다.
              </div>
              <BulkPasteGrid ref={pasteGridRef} columns={columns} onSubmit={importRowsFromGrid} />
            </div>
            <div style={{ display: pasteMode === 'text' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ padding: '14px 20px 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                첫 줄은 헤더(속성 이름), 그 아래로 한 명씩 한 줄. <strong>이름</strong> 칸은 꼭 있어야 하고, <strong>본문</strong> 칸은 상세 본문으로 들어갑니다. 헤더에 없는 속성은 자동으로 열이 만들어집니다.<br/>
                이미 표에 있는 이름이면 그 인물이 수정되고, 없는 이름이면 새로 추가됩니다. 엑셀·구글시트·노션 표를 그대로 붙여넣어도 되고(탭 구분 자동 인식), 아래처럼 <code>이름 - 나이 - 성별 - ...</code> 식으로 직접 적어도 됩니다. '표로 입력' 탭과는 서로 자동으로 옮겨집니다.
              </div>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleExecutePaste(); }}
                placeholder={'이름 - 나이 - 성별 - 소속 - 직책 - 능력 - 등급 - 본문\n서지안 - 29 - 여성 - 헌터 관리국, 게이트배분과 - 공무원, 주임 - 없음 - 없음 - 일더미에 찌든 현실주의자.'}
                style={{ flex: 1, margin: '12px 20px', padding: '14px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', resize: 'none', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.6, fontFamily: 'inherit' }}
              />
              <div style={{ padding: '0 20px 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {pastePreviewCount > 0 ? `${pastePreviewCount}명분 내용이 반영됩니다. (Ctrl+Enter로 바로 반영)` : '헤더 아래로 데이터를 한 줄 이상 적어주세요.'}
              </div>
            </div>

            <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--table-bg-alt)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }} onClick={() => setPasteModal({ isOpen: false })}>취소</button>
              <button style={{ background: 'var(--primary-color)', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }} onClick={handleExecutePaste}>반영</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
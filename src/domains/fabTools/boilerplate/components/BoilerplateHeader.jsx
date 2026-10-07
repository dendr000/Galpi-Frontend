// src/domains/fabTools/boilerplate/components/BoilerplateHeader.jsx
import React from 'react';
import { IconFolder, IconPlus, IconEdit, IconTrash } from '../../components/FabIcons';

const BoilerplateHeader = ({ bpData, clearSearch }) => {
  return (
    <>
      {/* 폴더 시스템 컨트롤 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <IconFolder size={16} style={{ color: 'var(--primary-color)' }} />
          <select 
            value={bpData.activeFolder} 
            onChange={e => {
              bpData.changeFolder(e.target.value);
              clearSearch();
            }}
            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontWeight: 'bold', outline: 'none' }}
          >
            {bpData.bpFolders.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="wiki-btn" onClick={bpData.handleAddFolder} style={{ padding: '6px 8px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }} title="폴더 추가"><IconPlus size={14} /></button>
          <button className="wiki-btn" onClick={bpData.handleEditFolder} style={{ padding: '6px 8px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }} title="폴더 수정"><IconEdit size={14} /></button>
          <button className="wiki-btn" onClick={bpData.handleDeleteFolder} style={{ padding: '6px 8px', background: 'var(--surface-color)', border: '1px solid #e53e3e', color: '#e53e3e', display: 'flex', alignItems: 'center' }} title="폴더 삭제"><IconTrash size={14} /></button>
        </div>
      </div>

      {/* 환경설정 토글 영역 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 15px', marginBottom: '12px', padding: '10px', background: 'var(--table-bg-alt)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}>
          <input type="checkbox" checked={bpData.isBpAuto} onChange={bpData.toggleBpAuto} style={{ accentColor: 'var(--primary-color)', width: '14px', height: '14px', cursor: 'pointer' }} />
          스페이스바 자동 치환 발동
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
          title="폴더를 골라 정리한 뒤 이 창을 닫으면, 에디터에서 모든 폴더의 상용구를 다시 쓸 수 있게 '전체'로 되돌립니다. 끄면 고른 폴더가 그대로 유지됩니다."
        >
          <input type="checkbox" checked={bpData.isBpResetOnClose} onChange={bpData.toggleBpResetOnClose} style={{ accentColor: 'var(--primary-color)', width: '14px', height: '14px', cursor: 'pointer' }} />
          닫으면 '전체'로 자동 복귀
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}>
          <input type="checkbox" checked={bpData.isBpPreview} onChange={bpData.toggleBpPreview} style={{ accentColor: 'var(--primary-color)', width: '14px', height: '14px', cursor: 'pointer' }} />
          타이핑 중 실시간 추천 팝업 표시
        </label>
      </div>
    </>
  );
};

export default BoilerplateHeader;
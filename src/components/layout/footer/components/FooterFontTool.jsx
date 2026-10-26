// 파일 위치: src/components/layout/footer/components/FooterFontTool.jsx
// 기능 요약: 다루기 불편한 원시 JSON 텍스트 에디터를 폐기하고, 조립된 FontDictRow 목록 렌더링 및 Ctrl+S 자동 저장 센서를 관장하는 UI 허브

import React, { useEffect } from 'react';
import styles from '../Footer.module.css';
import { FontIcon, CloseIcon, PlusIcon, SaveIcon } from './FooterIcons';
import { useFontDict } from '../hooks/useFontDict';
import FontDictRow from './FontDictRow';
import Icon from '../../../common/icons/Icon';

const FooterFontTool = ({ onClose }) => {
  const { dictList, isSaving, addRow, removeRow, updateRow, saveDict } = useFontDict(onClose);

  // 모달이 열려있는 동안에만 전역으로 Ctrl+S(저장) 이벤트 감지
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        saveDict();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [saveDict]);

  return (
    <div className={styles['tool-panel']} style={{ width: '480px' }}>
      <div className={styles['tool-header']}>
        <span style={{ fontWeight: '900', fontSize: '14px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FontIcon size={18} />
          폰트 매핑 사전 (Key-Value)
        </span>
        <button className={styles['close-btn']} onClick={onClose} title="닫기">
          <CloseIcon size={18} />
        </button>
      </div>
      <div className={styles['tool-body']}>
        <div style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', lineHeight: '1.5' }}>
          <div style={{ color: 'var(--text-primary)' }}><Icon name="lightbulb" lead /> 폰트 파일을 렌더링할 한글명으로 1:1 매핑합니다.</div>
          - 파일명 칸을 클릭하면 <span style={{ color: 'var(--primary-color)' }}>자동 복사</span> 됩니다. (읽기 전용)<br/>
          - <span style={{ color: 'var(--primary-color)' }}>Ctrl + S</span> 를 눌러 전체 사전을 즉시 저장할 수 있습니다.
        </div>
        
        <div style={{ height: '260px', overflowY: 'auto', paddingRight: '5px' }}>
          {dictList.map(item => (
            <FontDictRow 
              key={item.id} 
              item={item} 
              onChange={updateRow} 
              onRemove={removeRow} 
            />
          ))}
          {dictList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 'bold' }}>
              등록된 매핑 데이터가 없습니다.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
          <button 
            className="wiki-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--table-bg-alt)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '13px', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }} 
            onClick={addRow}
            title="새 항목 추가"
          >
            <PlusIcon size={14} /> 매핑 추가
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="wiki-btn" 
              style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '13px', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }} 
              onClick={onClose}
            >
              취소
            </button>
            <button 
              className="wiki-btn" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary-color)', color: 'white', border: 'none', fontSize: '13px', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }} 
              onClick={saveDict} 
              disabled={isSaving}
            >
              <SaveIcon size={14} />
              {isSaving ? '저장 중...' : '사전 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterFontTool;
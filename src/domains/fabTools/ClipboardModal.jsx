import React from 'react';
import ModalOverlay from '../../components/common/ModalOverlay';
import { useModalStore } from '../../store/useModalStore';
import Icon from '../../components/common/icons/Icon';

const ClipboardModal = ({ showToast }) => {
  const { closeModal, clipboardHistory, clearClipboard } = useModalStore();

  return (
    <ModalOverlay title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="clipboard" /> 클립보드 히스토리</span>} onClose={closeModal} actions={<button onClick={() => { clearClipboard(); }} style={{ border: '1px solid #e53e3e', color: '#e53e3e', background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}>전체 삭제</button>}>
      {clipboardHistory.length === 0 ? (
        <div className="modal-empty" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>스크랩하거나 복사한 텍스트 임시 파편 내역이 존재하지 않습니다.</div>
      ) : (
        clipboardHistory.map((text, i) => (
          <div key={i} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', background: 'var(--table-bg-alt)', padding: '2px 6px', borderRadius: '4px' }}>#{i+1}</span>
              <button 
                className="bp-action-btn edit" 
                style={{ fontSize: '11px', padding: '4px 10px', background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', cursor: 'pointer' }} 
                onClick={() => { 
                  navigator.clipboard.writeText(text); 
                  showToast("클립보드 인프라에 재할당 완료!"); 
                  closeModal(); 
                }}
              >
                다시 복사
              </button>
            </div>
            <div style={{ fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{text}</div>
          </div>
        ))
      )}
    </ModalOverlay>
  );
};

export default ClipboardModal;
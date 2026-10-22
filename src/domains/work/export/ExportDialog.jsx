// Copyright (c) dendr000. MIT License.
// 공개용 HTML 내보내기 옵션 창: 기밀 처리, 이미지 포함, 하위 문서 포함을 고르고 내보낸다.
import React, { useState } from 'react';

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 };
const panel = { width: 'min(460px, calc(100vw - 32px))', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '22px', boxShadow: 'var(--shadow-md)' };
const row = { display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0', fontSize: '14px', cursor: 'pointer' };
const btn = { padding: '8px 18px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', fontWeight: 700, cursor: 'pointer' };

const ExportDialog = ({ open, onClose, onExport, hasClassified }) => {
  const [classified, setClassified] = useState('mask');
  const [images, setImages] = useState(true);
  const [pages, setPages] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await onExport({ classified: hasClassified ? classified : 'mask', images, pages });
      setBusy(false);
      onClose();
    } catch (e) {
      console.error('[ExportDialog] 내보내기 실패:', e);
      setBusy(false);
      setError('내보내기에 실패했습니다. 이미지 포함을 끄고 다시 시도해 보세요.');
    }
  };

  return (
    <div style={overlay}>
      <div role="dialog" aria-modal="true" aria-label="공개용 HTML 내보내기" style={panel}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>공개용 HTML 내보내기</h2>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          이 작품을 읽기 전용 HTML 파일 하나로 내려받습니다. 숨김 캐릭터는 항상 빠집니다.
        </p>

        {hasClassified && (
          <fieldset style={{ border: '1px solid var(--border-color)', borderRadius: '8px', margin: '0 0 12px 0', padding: '8px 12px' }}>
            <legend style={{ fontSize: '13px', fontWeight: 800, padding: '0 6px' }}>기밀 캐릭터</legend>
            <label style={row}>
              <input type="radio" name="export-classified" checked={classified === 'mask'} onChange={() => setClassified('mask')} />
              가림 (이름과 도장만 남김)
            </label>
            <label style={row}>
              <input type="radio" name="export-classified" checked={classified === 'exclude'} onChange={() => setClassified('exclude')} />
              제외
            </label>
            <label style={row}>
              <input type="radio" name="export-classified" checked={classified === 'keep'} onChange={() => setClassified('keep')} />
              그대로
            </label>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              기밀 처리는 인물 카드에만 적용됩니다. 개요, 설정, 문서 본문에 직접 쓴 내용은 그대로 나갑니다.
            </div>
          </fieldset>
        )}

        <label style={row}>
          <input type="checkbox" checked={images} onChange={(e) => setImages(e.target.checked)} />
          이미지 포함 (작게 줄여 파일에 담음)
        </label>
        <label style={row}>
          <input type="checkbox" checked={pages} onChange={(e) => setPages(e.target.checked)} />
          하위 문서 포함
        </label>

        {error && <div role="alert" style={{ marginTop: '10px', color: '#c92a2a', fontSize: '13px', fontWeight: 700 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px', alignItems: 'center' }}>
          {busy && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>만드는 중...</span>}
          <button type="button" style={btn} onClick={onClose} disabled={busy}>취소</button>
          <button type="button" style={{ ...btn, borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }} onClick={submit} disabled={busy}>내보내기</button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;

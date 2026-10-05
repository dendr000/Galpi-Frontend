// 파일 위치: src/pages/BulkStudio/BulkSidebar.jsx
// 기능 요약: 실제 작품 페이지 캐릭터 카드와 100% 동일한 레이아웃을 제공하는 실시간 뷰어 컴포넌트

import React, { useState, useEffect } from 'react';
import MarkdownRenderer from '../../domains/macro/MarkdownRenderer';
import { IconEye } from '../../components/common/icons/DomainIcons';
import { sanitizeFilenameTitle } from '../../utils/filenameSanitizer';

const BulkSidebar = ({ isPreviewOpen, activeRow, labels, workTitle, workMeta }) => {
  const [variantIdx, setVariantIdx] = useState(0);

  useEffect(() => {
    setVariantIdx(0);
  }, [activeRow?.id]);

  if (!activeRow) {
    return (
      <aside className={`bulk-sidebar ${!isPreviewOpen ? 'sidebarClosed' : ''}`}>
        <div className="previewHeader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><IconEye size={16} /> 실시간 뷰어</div>
        <div className="previewContent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '14px', lineHeight: '1.6' }}>
            우측 표의 입력칸을 클릭하시면<br/><br/>캐릭터 카드가 실시간으로<br/>렌더링됩니다.
          </div>
        </div>
      </aside>
    );
  }

  const title = activeRow.name ? activeRow.name.trim() : "이름 없음";
  const themeColor = activeRow.themeColor || "var(--primary-color)";
  const cExt = workMeta?.charExt || "png";
  const imgX = activeRow.cardImgX !== undefined ? activeRow.cardImgX : 50;
  const imgY = activeRow.cardImgY !== undefined ? activeRow.cardImgY : 50;

  const variants = workMeta?.imgVariants || [];
  const fullVariants = ["", ...variants.filter(v => v.trim() !== "")];
  const suffix = fullVariants[variantIdx] ? "_" + fullVariants[variantIdx] : "";
  
  const isNew = String(activeRow.id).startsWith("new_");
  const imgSrc = (title !== "이름 없음" && !isNew)
    ? `/img/character/${encodeURIComponent(sanitizeFilenameTitle(workTitle) + "_" + sanitizeFilenameTitle(title) + suffix)}.${cExt.replace(/^\./, '')}`
    : "";

  const handleImageClick = (e) => {
    if (e.shiftKey) {
      e.preventDefault();
      if (fullVariants.length > 1) {
        setVariantIdx((prev) => (prev + 1) % fullVariants.length);
      }
    }
  };

  // ★ 1. 이름 옆 텍스트 추출 로직
  let label1Text = "";
  if (labels.label1 && activeRow[labels.label1]) {
    label1Text = `(${activeRow[labels.label1]})`;
  }

  // ★ 2. 이름 아래 텍스트 추출 로직 (콤마 분리 파싱)
  const renderLabel2Rows = () => {
    if (!labels.label2) return null;
    const targetCols = labels.label2.split(',').map(s => s.trim()).filter(Boolean);
    
    return targetCols.map(col => {
      if (!activeRow[col]) return null;
      return (
        <div key={col} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{col}</span>
          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{activeRow[col]}</span>
        </div>
      );
    });
  };

  return (
    <aside className={`bulk-sidebar ${!isPreviewOpen ? 'sidebarClosed' : ''}`}>
      <div className="previewHeader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><IconEye size={16} /> 실시간 뷰어</div>
      <div className="previewContent">
        
        {/* 실제 작품 페이지 캐릭터 카드 레이아웃 완벽 동기화 */}
        <div style={{ margin: '0 auto', width: '100%', maxWidth: '320px', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderTop: `4px solid ${themeColor}`, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          
          {/* 캐릭터 썸네일 이미지 (React DOM 파괴 방어 및 CSS 폴백 레이어 적용) */}
          <div style={{ width: '100%', height: '320px', overflow: 'hidden', background: 'var(--bg-color)', position: 'relative' }}>
            {imgSrc ? (
              <>
                {/* 1. 이미지 로드 실패 시 나타날 대체 텍스트를 이미지 뒤(zIndex: 0)에 미리 배치합니다. */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f3f5', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '13px', zIndex: 0 }}>
                  이미지 없음
                </div>
                {/* 2. 실제 이미지는 zIndex: 1로 텍스트를 덮고 있으며, 엑스박스 발생 시 innerHTML 훼손 없이 본인만 조용히 숨깁니다. */}
                <img
                  src={imgSrc}
                  onClick={handleImageClick}
                  title="Shift+클릭하여 바리에이션 변경"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${imgX}% ${imgY}%`, cursor: 'pointer', position: 'relative', zIndex: 1 }}
                  onError={(e) => { 
                    console.warn(`[BulkSidebar] 썸네일 이미지 로드 실패(404). React DOM 충돌 방지를 위해 요소 자체를 숨김 처리합니다. 경로: ${imgSrc}`);
                    e.target.onerror = null; // 무한 루프 방지
                    e.target.style.display = 'none'; 
                  }}
                  alt={title}
                />
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f3f5', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '13px' }}>이미지 없음</div>
            )}
          </div>

          {/* 카드 하단 정보 박스 */}
          <div style={{ padding: '15px' }}>
            {/* 타이틀 및 이름 옆(label1) 정보 */}
            <h4 style={{ margin: '0 0 15px 0', color: themeColor, fontSize: '18px', fontWeight: 900 }}>
              {title} <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{label1Text}</span>
            </h4>
            
            {/* 이름 아래(label2) 정보 영역 */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {renderLabel2Rows()}
            </div>
          </div>
        </div>

        {/* 상세 본문 마크다운 렌더링 박스 */}
        {activeRow.pageBodyRaw && (
          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '25px', margin: '0 auto', width: '100%', maxWidth: '800px', boxSizing: 'border-box', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <MarkdownRenderer rawText={activeRow.pageBodyRaw.replace(/^\[([^*].*?)\]/gm, '# $1')} />
          </div>
        )}

      </div>
    </aside>
  );
};

export default BulkSidebar;
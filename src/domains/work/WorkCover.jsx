// 파일 위치: src/pages/WorkDetail/components/WorkCover.jsx

import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosCore';
import { extractMeta } from '../../utils/markdownParser';
import styles from '../../pages/WorkDetail/WorkDetail.module.css';
import Icon from '../../components/common/icons/Icon';

const WorkCover = ({ work, workId, coverExt, coverUrl, coverY, setCoverY, isCoverEdit, setIsCoverEdit, isCoverDragging, setIsCoverDragging, setWork }) => {
  const navigate = useNavigate();
  const startY = useRef(0);

  const handleCoverMouseDown = (e) => {
    if (!isCoverEdit) return;
    setIsCoverDragging(true);
    startY.current = e.clientY;
    e.preventDefault();
  };

  const handleCoverMouseMove = (e) => {
    if (!isCoverDragging || !isCoverEdit) return;
    const dy = (e.clientY - startY.current) / 350 * 100;
    startY.current = e.clientY;
    setCoverY(prev => Math.max(0, Math.min(100, prev - dy * 1.5)));
  };

  const handleCoverMouseUp = () => setIsCoverDragging(false);

  const saveCoverPosition = async () => {
    const parsed = extractMeta(work.description);
    parsed.meta.coverY = coverY;
    const finalDesc = `[META_DATA:${JSON.stringify(parsed.meta)}]\n${parsed.clean}`;
    try {
      await api.put(`/api/works/${workId}`, { ...work, description: finalDesc });
      setWork(prev => ({ ...prev, description: finalDesc }));
      setIsCoverEdit(false);
    } catch(e) {
        alert("위치 저장 실패");
    }
  };

  return (
    <div id="work-header-container" style={{ marginBottom: '20px' }}>
      {coverExt ? (
        <div 
          className={`${styles.workHeroBanner} gt-hero ${isCoverDragging ? styles.isDragging : ''}`}
          style={{ display: 'block', backgroundImage: `url('${coverUrl}')`, backgroundPosition: `50% ${coverY}%`, cursor: isCoverEdit ? (isCoverDragging ? 'ns-resize' : 'grab') : 'default' }}
          onMouseDown={handleCoverMouseDown} onMouseMove={handleCoverMouseMove} onMouseUp={handleCoverMouseUp} onMouseLeave={handleCoverMouseUp}
        >
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroTitleContainer}>
            {/* data-title: 사이버펑크 네온/그래피티 테마가 CSS content:attr()로 복제 글리치
                레이어를 그리는 데 쓴다 (themes/cyberpunk-neon.css, cyberpunk-graffiti.css) */}
            <h1 className={`${styles.heroTitle} gt-hero-title`} data-title={work.title}>{work.title}</h1>
          </div>
          <div className={`${styles.coverControls} ${isCoverEdit ? styles.activeDrag : ''}`}>
            {!isCoverEdit ? (
              <button className="wiki-btn" style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)', borderRadius: '20px', padding: '6px 16px', fontWeight: 'bold' }} onClick={() => setIsCoverEdit(true)}>
                <Icon name="image" lead /> 위치 및 크기 변경
              </button>
            ) : (
              <>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold', background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>
                  <Icon name="move" lead /> 마우스 드래그로 이동하세요.
                </span>
                <button className="wiki-btn" style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '20px', padding: '6px 16px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }} onClick={saveCoverPosition}>
                  <Icon name="save" lead /> 저장
                </button>
                <button className="wiki-btn" style={{ background: '#e53e3e', color: 'white', border: 'none', borderRadius: '20px', padding: '6px 16px', fontWeight: 'bold' }} onClick={() => setIsCoverEdit(false)}>
                  <Icon name="close" lead /> 취소
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={`${styles.wikiTitleArea} gt-hero gt-hero-fallback`}>
          <h1 className={`${styles.wikiTitle} gt-hero-title`} data-title={work.title}>{work.title}</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="wiki-btn" style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} onClick={() => navigate(`/edit?type=work&action=edit&id=${workId}`)}>
              <Icon name="settings" lead /> 작품 설정
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkCover;
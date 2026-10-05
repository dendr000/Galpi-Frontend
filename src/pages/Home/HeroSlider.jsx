// 파일 위치: src/pages/Home/HeroSlider.jsx
// 비즈니스 로직을 분리하고, SVG 아이콘과 Flex 레이아웃을 통해 디자인 정렬을 완벽하게 맞춘 순수 뷰(View) 컴포넌트로 재탄생했습니다.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import { useHeroSlider } from './hooks/useHeroSlider';
import { IconPen, IconTag } from '../../components/common/icons/DomainIcons';
import { sanitizeFilenameTitle } from '../../utils/filenameSanitizer';

const HeroSlider = ({ works }) => {
  const navigate = useNavigate();
  const { slideWorks, currentIdx } = useHeroSlider(works);

  if (slideWorks.length === 0) return null;

  return (
    <div className={styles['hero-slider-wrapper']}>
      <div 
        className={styles['hero-slider-inner']} 
        style={{ transform: `translateX(-${currentIdx * 100}%)` }}
      >
        {slideWorks.map(w => {
          const m = w.metaInfo?.meta || {};
          let coverUrl = "";
          if (m.coverExt) {
            coverUrl = `/img/cover/${encodeURIComponent(sanitizeFilenameTitle(w.title) + "." + m.coverExt.trim().replace(/^\./, ''))}`;
          } else if (m.cover) {
            coverUrl = `/img/cover/${encodeURIComponent(m.cover.replace('cover/', ''))}`;
          }

          const cx = m.coverX !== undefined ? m.coverX : 50;
          const cy = m.coverY !== undefined ? m.coverY : 50;
          const cz = m.coverZ !== undefined ? m.coverZ : "cover";

          const genreHtml = w.genre ? w.genre.split(',').map((g, i) => (
            <span key={i} className={styles['hero-genre-tag']}>{g.trim()}</span>
          )) : null;

          return (
            <div 
              key={w.id} 
              className={styles['hero-slide']}
              style={{
                backgroundImage: `url('${coverUrl}')`,
                backgroundPosition: `${cx}% ${cy}%`,
                backgroundSize: cz === "cover" ? "cover" : `${cz}%`
              }}
              onClick={() => {
                console.log(`[HeroSlider] 배너 클릭 라우팅 집행: 작품 ID ${w.id}`);
                navigate(`/work/${w.id}`);
              }}
            >
              <div className={styles['hero-overlay']}></div>
              <div className={styles['hero-content']}>
                <h1 className={styles['hero-title']} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {w.title}
                </h1>
                <div className={styles['hero-desc']} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconPen size={14} color="rgba(255,255,255,0.8)" /> {w.creator || '미상'}
                  </span>
                  <span style={{ opacity: 0.5 }}>|</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconTag size={14} color="rgba(255,255,255,0.8)" /> {genreHtml}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeroSlider;
// 파일 위치: src/domains/character/CharacterQuickNav.jsx
// 기능 요약: 캐릭터 상세 정보 하단에 배치되어 클릭 시 페이지 이동 없이 활성 캐릭터(상세 정보)만 전환하는 빠른 네비게이션 컴포넌트
// 버전: v1.0.0

import React from 'react';
import Icon from '../../components/common/icons/Icon';

const CharacterQuickNav = ({ characters, activeCharId, setActiveCharId, styles }) => {
  console.log("[CharacterQuickNav] 캐릭터 빠른 이동(퀵 네비) 컴포넌트 렌더링 시작");

  const handleNavClick = (id) => {
    console.log(`[CharacterQuickNav] 빠른 네비게이션 클릭 감지. 대상 ID: ${id}`);
    // 페이지 스크롤은 건드리지 않고, 아래 상세 정보(활성 캐릭터)만 전환한다
    setActiveCharId(id);
  };

  return (
    <div className={`${styles.quickNavContainer} gt-quicknav`}>
      <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Icon name="bolt" lead /> 캐릭터 빠른 이동
      </div>
      <div className={styles.quickNavBtnList}>
        {characters.map(c => {
          const tc = c.themeColor || 'var(--primary-color)';
          const isActive = activeCharId === c.id;
          return (
            <button
              key={c.id}
              className={`${styles.quickNavBtn} gt-quicknav-btn`}
              style={{ borderColor: tc, color: isActive ? 'white' : tc, backgroundColor: isActive ? tc : 'transparent' }}
              onClick={() => handleNavClick(c.id)}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterQuickNav;
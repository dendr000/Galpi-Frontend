// 파일 위치: src/domains/character/CharacterDetailSection.jsx
// 기능 요약: 현재 활성화(선택)된 캐릭터의 상세 마크다운 본문을 파싱하여 렌더링하는 컴포넌트
// 버전: v1.0.0

import React from 'react';
import MarkdownRenderer from '../../domains/macro/MarkdownRenderer';
import Icon from '../../components/common/icons/Icon';

const CharacterDetailSection = ({ activeChar, charSectionNum, styles, onBacklink, onBackToGrid }) => {
  if (!activeChar) return null;
  console.log(`[CharacterDetailSection] 캐릭터 마크다운 상세 정보 렌더링. 타겟 캐릭터: ${activeChar.name}`);
  
  let rawText = "등록된 본문 내용이 없습니다.";
  try {
    rawText = activeChar.pageBody?.rawText || activeChar.pageBodyRaw || (activeChar._rawDynamic && JSON.parse(activeChar._rawDynamic).pageBody?.rawText) || "등록된 본문 내용이 없습니다.";
  } catch(e) {
    console.warn(`[CharacterDetailSection] 본문 파싱 에러 발생. 기본값을 출력합니다.`, e);
  }

  return (
    <section id="character-detail-section" className={styles.wikiSection}>
      <div className={`${styles.sectionHeader} gt-section-header`}>
        <h2 id="sec-chardetail" className={`${styles.sectionHeaderTitle} gt-section-title auto-toc-target`}>
          {charSectionNum + 1}. [{activeChar.name}] 상세 정보
        </h2>
        {onBackToGrid && (
          <button
            type="button"
            className="wiki-btn"
            style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--surface-color)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            title="캐릭터 목록의 이 카드로 돌아가기"
            onClick={() => onBackToGrid(activeChar._baseCharId || activeChar.id)}
          >
            <Icon name="arrow-up" size={13} /> 그리드로
          </button>
        )}
      </div>
      <MarkdownRenderer rawText={rawText} startH1={charSectionNum + 2} onNodeClick={onBacklink} />
    </section>
  );
};

export default CharacterDetailSection;
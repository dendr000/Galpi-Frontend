// 파일 위치: src/domains/character/CharacterGrid.jsx
// 기능 요약: 작품 상세 페이지 내에서 분류 기준에 따라 캐릭터 카드를 격자 형태로 배치하고 속성값(이름 옆/아래)을 렌더링하는 독립 서브 컴포넌트
// 버전: v1.2.1

import React from 'react';
import { IconImage, IconPlus } from '../../components/common/icons/DomainIcons';
import { sanitizeFilenameTitle } from '../../utils/filenameSanitizer';
import AffiliationLinks from './AffiliationLinks';
import RatingBadges from './RatingBadges';
import ClassifiedStamp from './ClassifiedStamp';
import FilterChips from './FilterChips';
import { hasActiveFilter } from './characterFilter';
import { getRatings } from './ratings';
import { NO_CLASSIFIED } from './classified';

const CharacterGrid = ({
  styles = {}, 
  charSectionNum = 1,
  groupCriteria = "관계",
  setGroupCriteria,
  setIsBatchImgModalOpen,
  navigate,
  workId,
  sortedGroupNames = [], // ★ map 크래시 방어 (기본값 빈 배열 할당)
  groupedChars = {},     // ★ 객체 크래시 방어 (기본값 빈 객체 할당)
  cardVariants = {},
  setCardVariants,
  fullVariants = [],
  work = { title: "" },
  charExt = "png",
  activeCharId,
  setActiveCharId,
  handleCharDragStart = () => {},
  handleCharDragOver = () => {},
  handleCharDragEnd = () => {},
  sortKeys = [],       // 정렬 기준으로 고를 수 있는 속성 이름들
  sortKey = '',        // 선택된 정렬 속성(빈 값이면 수동 순서)
  sortDir = 'asc',
  setSort = () => {},
  wikiPages = [],      // 소속 값과 같은 제목의 하위 문서를 링크로 잇는 데 쓴다
  ratingAxes = [],     // 등급 배지 설정(판정 축과 기준표)
  ratingScale = [],
  classified = NO_CLASSIFIED, // 기밀 표시와 가리기 상태(useClassifiedMask)
  filterGroups = [],          // 칩 필터 그룹(소속, 등급)과 선택 상태
  filterSelection = {},
  onFilterToggle = () => {},
  onFilterClear = () => {},
  filterShown = 0,            // 필터를 거친 뒤 보이는 인원과 전체 인원
  filterTotal = 0
}) => {
  console.log("[CharacterGrid] 등장인물 갤러리 그리드 컴포넌트 렌더링 개시");

  const handleGroupCriteriaChange = (e) => {
    console.log(`[CharacterGrid] 분류 기준 변경 감지: ${e.target.value}`);
    setGroupCriteria(e.target.value);
  };

  const handleBatchModalOpen = () => {
    console.log("[CharacterGrid] 일괄 이미지 위치 조정 모달 트리거 활성화");
    setIsBatchImgModalOpen(true);
  };

  // 정렬 선택값은 "방향:속성이름" 형태(예: "desc:서열"), 수동 순서는 빈 문자열
  const handleSortChange = (e) => {
    const v = e.target.value;
    if (!v) { setSort('', 'asc'); return; }
    const i = v.indexOf(':');
    setSort(v.slice(i + 1), v.slice(0, i));
  };

  const handleNewCharClick = () => {
    console.log("[CharacterGrid] 새 캐릭터 추가 페이지 라우팅 집행");
    navigate(`/edit?type=char&action=new&workId=${workId}`);
  };

  return (
    <section id="sec-3" className={styles.wikiSection}>
      <div className={`${styles.sectionHeader} gt-section-header`}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 15px' }}>
          <h2 id="sec-characters" className={`${styles.sectionHeaderTitle} gt-section-title auto-toc-target`} style={{ whiteSpace: 'nowrap' }}>
            {charSectionNum}. 등장인물 목록
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            <label style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>분류 기준:</label>
            <select
              value={groupCriteria}
              onChange={handleGroupCriteriaChange}
              className="gt-section-select"
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)', background: 'var(--surface-color)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="관계">관계별</option>
              <option value="소속">소속별</option>
              <option value="등급">등급별</option>
              <option value="종족">종족별</option>
              <option value="성별">성별별</option>
            </select>
          </div>
          {sortKeys.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              <label style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} htmlFor="char-sort-select">정렬:</label>
              <select
                id="char-sort-select"
                aria-label="정렬 기준"
                value={sortKey ? `${sortDir}:${sortKey}` : ''}
                onChange={handleSortChange}
                className="gt-section-select"
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)', background: 'var(--surface-color)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">수동 순서</option>
                {sortKeys.flatMap(k => [
                  <option key={`asc:${k}`} value={`asc:${k}`}>{k} (오름차순)</option>,
                  <option key={`desc:${k}`} value={`desc:${k}`}>{k} (내림차순)</option>
                ])}
              </select>
            </div>
          )}
          {classified.has && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}>
              <input
                type="checkbox"
                aria-label="기밀 가리기"
                checked={classified.mask}
                onChange={(e) => classified.setMask(e.target.checked)}
              />
              기밀 가리기
            </label>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
          <button
            className="wiki-btn gt-btn-edit"
            title="일괄 이미지 위치 조정"
            style={{ padding: '4px 10px', fontSize: '13px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
            onClick={handleBatchModalOpen}
          >
            <IconImage size={14} />
          </button>
          <button
            className="wiki-btn gt-btn-edit"
            style={{ padding: '4px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
            onClick={handleNewCharClick}
          >
            <IconPlus size={13} /> 새 캐릭터 추가
          </button>
        </div>
      </div>

      <FilterChips groups={filterGroups} selection={filterSelection} onToggle={onFilterToggle} onClear={onFilterClear} shown={filterShown} total={filterTotal} />
      {hasActiveFilter(filterSelection) && filterShown === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px', background: 'var(--table-bg-alt)', borderRadius: '8px', border: '1px dashed var(--border-color)', marginBottom: '20px' }}>
          조건에 맞는 인물이 없습니다.
        </div>
      )}

      <div>
        {sortedGroupNames.map(gName => {
          const charList = groupedChars[gName] || []; // ★ 해당 그룹에 캐릭터 배열이 없을 경우 빈 배열로 대체하여 크래시 방지
          console.log(`[CharacterGrid] 그룹 섹션 빌드 ➔ 그룹명: ${gName}, 인원 수: ${charList.length}`);
          return (
            <div key={gName} className={`${styles.relationGroup} gt-relation-group`}>
              <h3 className={`${styles.relationHeader} gt-relation-header`}>
                {gName} <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({charList.length})</span>
              </h3>
              
              <div className={styles.characterGridContainer}>
                {charList.map(c => {
                  const vIdx = cardVariants[c.id] || 0;
                  const isSecret = classified.isClassified(c);
                  const concealed = classified.isConcealed(c);
                  const blur = concealed ? { filter: 'blur(9px)', userSelect: 'none' } : null;
                  const suffix = fullVariants[vIdx] ? `_${fullVariants[vIdx]}` : "";
                  const workTitle = sanitizeFilenameTitle(work?.title || "작품");
                  const safeName = sanitizeFilenameTitle(c.name);
                  const cardImgSrc = `/img/character/${encodeURIComponent(workTitle + "_" + safeName + suffix + "." + charExt)}`;
                  const cardBaseImgSrc = `/img/character/${encodeURIComponent(workTitle + "_" + safeName + "." + charExt)}`;

                  // ★ 인포박스와 cardVariants를 공유하므로, 업로드된 적 없는 바리에이션 이미지가
                  // 저장돼 있으면 카드도 똑같이 빈칸으로 방치되던 버그 — 기본 이미지로 되돌리고
                  // 저장된 인덱스도 리셋한다.
                  const handleCardImgError = (e) => {
                    if (suffix === "") { e.target.style.display = 'none'; e.target.parentElement.style.background = 'var(--table-bg-alt)'; return; }
                    e.target.onerror = () => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'var(--table-bg-alt)'; };
                    e.target.src = cardBaseImgSrc;
                    setCardVariants(prev => ({ ...prev, [c.id]: 0 }));
                  };

                  // ★ JSON 이중 파싱 에러 방지 및 속성 추출 로직
                  let dp = {};
                  try {
                    const rawDynamic = c.dynamicProperties || c._rawDynamic;
                    if (rawDynamic) {
                      let parsed = JSON.parse(rawDynamic);
                      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                      dp = parsed || {};
                    }
                  } catch (e) {
                    console.warn(`[CharacterGrid] 캐릭터(${c.name}) JSON 속성 파싱 실패:`, e);
                  }

                  const themeColor = dp.themeColor || c.themeColor || 'var(--primary-color)';
                  const cardImgX = dp.cardImgX !== undefined ? dp.cardImgX : (c.cardImgX !== undefined ? c.cardImgX : 50);
                  const cardImgY = dp.cardImgY !== undefined ? dp.cardImgY : (c.cardImgY !== undefined ? c.cardImgY : 50);
                  const cardImgScale = dp.cardImgScale !== undefined ? dp.cardImgScale : (c.cardImgScale !== undefined ? c.cardImgScale : 1);

                  // 1. 이름 옆 (label1) 파싱
                  const label1Key = dp._cardLabel1 || "나이";
                  const mappedKey1 = label1Key === '나이' ? 'age' : label1Key === '성별' ? 'gender' : label1Key === '종족' ? 'species' : label1Key;
                  const val1 = dp[mappedKey1] ?? dp[label1Key] ?? c[mappedKey1] ?? c[label1Key];
                  const label1Text = (val1 !== undefined && val1 !== null && String(val1).trim() !== "") ? `(${val1})` : "";

                  // 2. 이름 아래 (label2) 파싱
                  const label2Str = dp._cardLabel2 || "등급, 소속, 능력";
                  const label2Keys = label2Str.split(',').map(s => s.trim()).filter(Boolean);
                  
                  const renderedLabels = label2Keys.map(key => {
                    const mappedKey = key === '나이' ? 'age' : key === '성별' ? 'gender' : key === '종족' ? 'species' : key;
                    const val = dp[mappedKey] ?? dp[key] ?? c[mappedKey] ?? c[key];
                    
                    if (val === undefined || val === null || String(val).trim() === '') return null;
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>{key}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }} title={val}>
                          {key === '소속' ? <AffiliationLinks value={val} wikiPages={concealed ? [] : wikiPages} onOpenPage={(id) => navigate(`/work/${workId}?pageId=${id}`)} /> : val}
                        </span>
                      </div>
                    );
                  }).filter(Boolean);

                  return (
                    <div 
                      key={c._baseCharId || c.id} 
                      id={`char-card-${c._baseCharId || c.id}`}
                      className={`${styles.noteCard} gt-card`}
                      style={{ 
                        borderTop: `4px solid ${themeColor}`, 
                        backgroundColor: activeCharId === c.id ? 'var(--table-bg-alt)' : 'var(--surface-color)',
                        // ★ 기존의 하얀 여백 규격을 해치지 않으면서 글자 길이에 맞춰 세로로 늘어나게만 설정
                        height: 'max-content'
                      }} 
                      onClick={(e) => {
                        if (concealed) {
                          // 가려진 카드는 첫 클릭에서 열람만 한다(선택하지 않음)
                          e.stopPropagation();
                          classified.reveal(c.id);
                          return;
                        }
                        if (e.shiftKey) {
                          e.preventDefault(); 
                          e.stopPropagation();
                        } else {
                          setActiveCharId(activeCharId === c.id ? null : c.id);
                        }
                      }}
                      draggable={sortKey ? "false" : "true"}
                      onDragStart={(e) => { handleCharDragStart(e, c, gName); }}
                      onDragOver={(e) => handleCharDragOver(e, c, gName)}
                      onDrop={(e) => e.preventDefault()}
                      onDragEnd={(e) => { handleCharDragEnd(e, gName); }}
                    >
                      {/* 상단 이미지 영역 (원래의 패딩 규격 내에서 렌더링되도록 원상복구) */}
                      <div className={`${styles.cardImgWrap} gt-card-img`}>
                        <img 
                          src={cardImgSrc} 
                          style={{ 
                            objectPosition: `${cardImgX}% ${cardImgY}%`,
                            transform: `scale(${cardImgScale})`,
                            transition: 'transform 0.2s ease, object-position 0.2s ease',
                            ...blur
                          }} 
                          data-concealed={concealed ? '' : undefined}
                          onError={handleCardImgError}
                          alt={c.name}
                        />
                        {isSecret && <ClassifiedStamp style={{ position: 'absolute', top: '8px', right: '8px' }} />}
                      </div>

                      {/* 이름 및 이름 옆 라벨 */}
                      <h4 style={{ margin: renderedLabels.length > 0 ? '10px 0 10px 0' : '0 0 5px 0', color: themeColor, fontSize: '15px', fontWeight: 900 }}>
                        {c.name} <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{label1Text}</span>
                      </h4>

                        {/* 이름 아래 라벨 리스트 */}
                      {renderedLabels.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', ...blur }} data-concealed={concealed ? '' : undefined}>
                          {renderedLabels}
                        </div>
                      )}
                      <RatingBadges ratings={getRatings(c, ratingAxes, ratingScale)} style={{ marginTop: '8px', ...blur }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CharacterGrid;
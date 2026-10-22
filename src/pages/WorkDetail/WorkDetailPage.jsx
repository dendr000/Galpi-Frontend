// 파일 위치: src/pages/WorkDetail/WorkDetailPage.jsx
// 기능 요약: 전용 커스텀 데이터 훅으로부터 컴포넌트 라이프사이클 상태를 주입받아 도메인 단위 서브 모듈들을 조합하여 화면에 표출하는 순수 허브 레이아웃 파일
// 버전: v3.1.0 (비즈니스 상태 로직 완전 격리 개편본)

import React, { useEffect, useState } from 'react';
import styles from '../../pages/WorkDetail/WorkDetail.module.css';
import './themes/wuxia.css';
import './themes/wuxia-ink.css';
import './themes/wuxia-blood.css';
import './themes/wuxia-ascend.css';
import './themes/cyberpunk-neon.css';
import './themes/cyberpunk-terminal.css';
import './themes/cyberpunk-graffiti.css';
import './themes/apocalypse-rad.css';
import './themes/apocalypse-infect.css';
import './themes/apocalypse-camp.css';
import './themes/hero-comic.css';
import './themes/hero-hud.css';
import './themes/hero-urban.css';
import './themes/hunter-gate.css';
import './themes/hunter-hologram.css';
import './themes/joseon-talisman.css';
import './themes/joseon-shrine.css';
import './themes/joseon-lantern.css';
import './themes/horror-archive.css';
import './themes/horror-store.css';
import './themes/horror-corridor.css';
import { resolveGenreTheme } from '../../domains/work/genreTheme';
import GenreCursor from '../../components/common/GenreCursor';
import { extractMeta } from '../../utils/markdownParser';
import { sanitizeFilenameTitle } from '../../utils/filenameSanitizer';
import MarkdownRenderer from '../../domains/macro/MarkdownRenderer';
import { IconPen } from '../../components/common/icons/DomainIcons';
import FloatingLeftTree from '../../domains/work/FloatingLeftTree';
import FloatingToc from '../../domains/work/FloatingToc';

// 도메인 기능 컴포넌트 묶음 임포트
import WorkCover from '../../domains/work/WorkCover';
import WorkCategoryBar from '../../domains/work/WorkCategoryBar';
import SubPageList from '../../domains/work/SubPageList';

import CharacterInfobox from '../../domains/character/CharacterInfobox';
import CharacterGrid from '../../domains/character/CharacterGrid';
import CharacterDetailSection from '../../domains/character/CharacterDetailSection';
import CharacterQuickNav from '../../domains/character/CharacterQuickNav';
import BatchImageModal from '../../domains/character/BatchImageModal';

// ★ 핵심 데이터 격리 처리용 통합 커스텀 데이터 훅 연결
import { useWorkDetailData } from '../../domains/work/useWorkDetailData';
import { useCharacterDrag } from '../../domains/character/useCharacterDrag';
import { useWorkBacklink } from '../../domains/work/useWorkBacklink';
import { useSelectCharFromUrl } from '../../domains/work/useSelectCharFromUrl';
import { getAffiliationMembers } from '../../domains/work/organization';
import { useCharacterSort } from '../../domains/character/useCharacterSort';
import { collectSortKeys, sortCharsByProperty } from '../../domains/character/characterSort';
import { getVisibleCharacters, buildCharacterGroups, getGroupOrderArray } from '../../domains/character/characterGroups';
import { useClassifiedMask } from '../../domains/character/useClassifiedMask';
import { collectFilterGroups, filterChars, toggleFilterValue } from '../../domains/character/characterFilter';
import PageMemberList from '../../domains/character/PageMemberList';
import RatingScaleTable from '../../domains/character/RatingScaleTable';
import { parseRatingAxes, parseRatingScale } from '../../domains/character/ratings';

const WorkDetailPage = () => {
  console.log("[WorkDetailPage] 조립형 레이아웃 뷰 가동 개시");

  // 데이터 훅 선언을 통해 내부 상태 및 상태 변경 메서드 일괄 인젝션
  const data = useWorkDetailData();

  // 커스텀 드래그 인터랙션 제어 훅 바인딩
  const { handleCharDragStart, handleCharDragOver, handleCharDragEnd } = useCharacterDrag(data.characters, data.setCharacters, data.groupCriteria);

  // 본문의 [[이름]] 파란 링크: 같은 작품 캐릭터면 선택+스크롤, 다른 작품 제목이면 그 작품으로 이동
  const handleBacklink = useWorkBacklink({
    characters: data.characters, formSwaps: data.formSwaps, workId: data.workId,
    setActiveCharId: data.setActiveCharId, navigate: data.navigate,
  });

  // 캐릭터 그리드 정렬 선택(속성 이름, 방향): 작품별로 저장되고, 비어 있으면 수동 순서
  const { sortKey, sortDir, setSort } = useCharacterSort(data.workId);

  // 캐릭터 목록 위의 칩 필터 선택({ 속성이름: [선택한 값들] }). 저장하지 않고 이 화면에서만 유지한다
  const [filterSelection, setFilterSelection] = useState({});
  const handleFilterToggle = (key, value) => setFilterSelection(prev => toggleFilterValue(prev, key, value));
  const handleFilterClear = () => setFilterSelection({});

  // 기밀 표시와 "기밀 가리기" 상태(작품별 저장). 그리드, 정보 상자, 소속 인물 목록이 같은 상태를 쓴다
  const classified = useClassifiedMask(data.workId, data.characters);

  // 주소의 ?charId= (소속 인물 목록에서 넘어올 때)로 열리면 그 캐릭터를 선택하고 카드로 스크롤
  useSelectCharFromUrl({
    loading: data.loading, charIdParam: data.charIdParam, characters: data.characters, setActiveCharId: data.setActiveCharId,
  });

  // GNB 팔레트 버튼이 테마를 순환시키면(별도 API 호출) 여기서도 즉시 반영되도록 이벤트를 듣는다
  useEffect(() => {
    const handleThemeCycled = (e) => {
      if (String(e.detail.workId) !== String(data.workId)) return;
      data.setWork(prev => prev && ({ ...prev, description: e.detail.description }));
    };
    window.addEventListener('galpi-theme-cycled', handleThemeCycled);
    return () => window.removeEventListener('galpi-theme-cycled', handleThemeCycled);
  }, [data.workId]);

  // "최근 열람 작품"(FAB 메뉴) 기록 — 예전엔 RecentModal이 읽기만 하고 아무도 이 키에 쓰질
  // 않아서 항상 빈 목록이었다. 이 작품에 진입할 때마다 맨 앞으로 올리고(중복 제거), 너무
  // 길어지지 않게 20개로 제한한다.
  useEffect(() => {
    if (!data.work?.id) return;
    try {
      const ids = JSON.parse(localStorage.getItem('galpi-recent-works') || '[]');
      const deduped = ids.filter(id => String(id) !== String(data.work.id));
      deduped.unshift(data.work.id);
      localStorage.setItem('galpi-recent-works', JSON.stringify(deduped.slice(0, 20)));
    } catch (e) { /* 로컬스토리지 접근 불가 환경이면 조용히 무시 */ }
  }, [data.work?.id]);

  // ★ 장르 테마는 #galpi-genre-zone 안에서만 [data-genre-theme] 속성으로 적용돼서, 그 바깥의
  // 전역 요소(하단 푸터 등)는 지금 보고 있는 작품이 무슨 테마든 항상 똑같은 기본 모습이었다.
  // body에 그대로 같은 속성명을 동기화했더니, 각 테마 CSS가 전부 "[data-genre-theme=...]"를
  // 스코프 없이(#galpi-genre-zone 한정 없이) 그대로 쓰고 있어서 body 자체에도 배경/클립패스가
  // 그대로 적용돼버려 페이지 아래쪽이 통째로 잘려 보이지 않는 심각한 회귀가 났었다. 그래서
  // 아예 다른 속성명(data-footer-theme)을 써서 기존 테마 규칙과 절대 충돌하지 않게 했다
  // (Footer.module.css/각 테마 CSS의 gt-footer 규칙은 이 새 속성만 본다).
  useEffect(() => {
    if (!data.work) return;
    const parsed = extractMeta(data.work.description || "");
    const theme = resolveGenreTheme(data.work.genre, parsed.meta.themeOverride);
    if (theme) document.body.setAttribute('data-footer-theme', theme);
    else document.body.removeAttribute('data-footer-theme');
    return () => document.body.removeAttribute('data-footer-theme');
  }, [data.work?.genre, data.work?.description]);

  if (data.loading || !data.work) {
    return <div className="fixed-container" style={{ padding: '50px 20px', color: 'var(--text-secondary)', fontWeight:'bold' }}>데이터베이스 스캔 중...</div>;
  }

  // 렌더링에 요구되는 메타데이터 및 이미지 경로 세팅
  const parsedDesc = extractMeta(data.work.description || "");
  const coverExt = parsedDesc.meta.coverExt;
  const charExt = parsedDesc.meta.charExt || "png";
  const imgVariants = parsedDesc.meta.imgVariants || [];
  // 등급 배지 설정(작품 편집기의 "등급 판정 축", "등급 기준표")
  const ratingAxes = parseRatingAxes(parsedDesc.meta.ratingAxes);
  const ratingScale = parseRatingScale(parsedDesc.meta.ratingScale);
  const fullVariants = ["", ...imgVariants.filter(v => v.trim() !== "")]; 
  const coverUrl = `/img/cover/${encodeURIComponent(sanitizeFilenameTitle(data.work.title) + "." + (coverExt || 'png'))}`;

  const activePage = data.pageId ? data.wikiPages.find(p => String(p.id) === String(data.pageId)) : null;
  const activeChar = data.characters.find(c => c.id === data.activeCharId);
  const genreTheme = resolveGenreTheme(data.work.genre, parsedDesc.meta.themeOverride);

  // 숨김 캐릭터 제외와 폼 스왑 반영(본체/서브폼 전환)
  const { baseChars, displayChars } = getVisibleCharacters(data.characters, data.formSwaps);

  // 칩 필터: 칩은 화면에 보이는 캐릭터 전체 기준으로 만들고, 그리드에는 선택에 맞는 캐릭터만 넘긴다
  const filterGroups = collectFilterGroups(displayChars);
  const visibleChars = filterChars(displayChars, filterSelection);

  // 분류 기준별 그룹 묶기와 그룹 안 정렬(수동 순서 위에 속성 정렬을 덮어씀)
  const { groupedChars, sortedGroupNames } = buildCharacterGroups({
    chars: visibleChars, allCharacters: data.characters, groupCriteria: data.groupCriteria,
    groupOrderArray: getGroupOrderArray(parsedDesc.meta, data.groupCriteria), sortKey, sortDir,
  });
  const sortKeys = collectSortKeys(baseChars);

  return (
    <div className="main-content-wrap">
      {/* 1단계: 플로팅 사이드바 위젯 부착 구역 */}
      <FloatingLeftTree workId={data.workId} pageId={data.pageId} wikiPages={data.wikiPages} />
      <FloatingToc tocList={data.tocList} workId={data.workId} pageId={data.pageId} activePage={activePage} />
      <GenreCursor theme={genreTheme} zoneId="galpi-genre-zone" />

      <div id="galpi-genre-zone" className={`wiki-container fixed-container ${styles.wikiContainer}`} data-genre-theme={genreTheme || undefined}>
        
        {/* 2단계: 최상단 상향 링크 빵부스러기 경로 바 영역 */}
        {activePage && (
          <div className={styles.breadcrumbNav}>
            <span className={styles.breadcrumbLink} onClick={() => data.navigate(`/work/${data.workId}`)}>📚 {data.work.title}</span> 
            <span className={styles.breadcrumbSep}>&gt;</span>
            <span className={styles.breadcrumbCurrent}>📄 {activePage.title}</span>
          </div>
        )}

        {/* 3단계: 히어로 대표 표지 비주얼 배너 영역 */}
        {!activePage && (
          <WorkCover 
            work={data.work} workId={data.workId} coverExt={coverExt} coverUrl={coverUrl} 
            coverY={data.coverY} setCoverY={data.setCoverY} 
            isCoverEdit={data.isCoverEdit} setIsCoverEdit={data.setIsCoverEdit} 
            isCoverDragging={data.isCoverDragging} setIsCoverDragging={data.setIsCoverDragging} 
            setWork={data.setWork} 
          />
        )}

        {/* 4단계: 장르/분류 및 테마 선택 제어 패널 영역 */}
        {!activePage && (
          <div id="galpi-theme-row" style={{ borderRadius: '6px' }}>
            <WorkCategoryBar work={data.work} workId={data.workId} setWork={data.setWork} styles={styles} />
          </div>
        )}

        {/* 5단계: 메인 그리드 및 사이드 이중 레이아웃 구역 */}
        <div className={styles.wikiContentWrapper}>
          <main className={styles.wikiMain}>
            
            {/* 하위 위키 문서 뷰어 모드 및 메인 개요/세계관 분기 출력 */}
            {activePage ? (
              <section className={styles.wikiSection}>
                <div className={`${styles.sectionHeader} gt-section-header`}>
                  <h2 className={`${styles.sectionHeaderTitle} gt-section-title`} style={{ color: 'var(--primary-color)' }}>{activePage.title}</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="wiki-btn gt-btn-edit" style={{ padding: '4px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => data.navigate(`/edit?type=page&action=edit&workId=${data.workId}&id=${activePage.id}`)}><IconPen size={13} /> 문서 편집</button>
                    <button className="wiki-btn gt-btn-del" style={{ padding: '4px 10px', fontSize: '13px', background: 'transparent', color: '#e53e3e', border: '1px dashed #e53e3e' }} onClick={async () => {
                      if (window.confirm("⚠️ 경고: 이 하위 문서를 영구 삭제하시겠습니까?")) {
                        try {
                          await api.delete(`/api/wikipages/${activePage.id}`);
                          data.navigate(`/work/${data.workId}`);
                        } catch(e) { alert("삭제 실패"); }
                      }
                    }}>삭제</button>
                  </div>
                </div>
                <MarkdownRenderer rawText={activePage.content} onNodeClick={handleBacklink} />
                <PageMemberList
                  members={sortCharsByProperty(getAffiliationMembers(data.characters, activePage.title), sortKey, sortDir)}
                  workId={data.workId} work={data.work} charExt={charExt} navigate={data.navigate} styles={styles} sortKey={sortKey}
                  classified={classified}
                />
              </section>
            ) : (
              <>
                <section id="sec-1" className={styles.wikiSection}>
                  <div className={`${styles.sectionHeader} gt-section-header`}>
                    <h2 id="sec-overview" className={`${styles.sectionHeaderTitle} gt-section-title auto-toc-target`}>1. 개요</h2>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 12px 0', lineHeight: 1.6, color: 'var(--text-secondary)' }}>제작자: <strong>{data.work.creator || '미상'}</strong> | 상태: <strong>[{data.work.status || '진행 중'}]</strong></p>
                    {parsedDesc.meta.overview && <MarkdownRenderer rawText={parsedDesc.meta.overview} onNodeClick={handleBacklink} />}
                  </div>
                </section>

                <section id="sec-2" className={styles.wikiSection}>
                  <div className={`${styles.sectionHeader} gt-section-header`}>
                    <h2 id="sec-worldview" className={`${styles.sectionHeaderTitle} gt-section-title auto-toc-target`}>2. 설정</h2>
                    <button className="wiki-btn gt-btn-edit" style={{ padding: '4px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => data.navigate(`/edit?type=work&action=edit&id=${data.work.id}`)}><IconPen size={13} /> 편집</button>
                  </div>
                  <MarkdownRenderer rawText={parsedDesc.clean} startH1={3} onNodeClick={handleBacklink} />
                </section>

                <RatingScaleTable axes={ratingAxes} scale={ratingScale} styles={styles} />
              </>
            )}

            {/* 하위 소속 폴더 리스트 모듈 매운 조립 */}
            <SubPageList wikiPages={data.wikiPages} pageId={data.pageId} workId={data.workId} navigate={data.navigate} styles={styles} />

            {/* 정렬 연동 캐릭터 그리드 모듈 조립 */}
            {!activePage && (
              <CharacterGrid
                styles={styles}
                charSectionNum={data.charSectionNum}
                groupCriteria={data.groupCriteria}
                setGroupCriteria={data.setGroupCriteria}
                setIsBatchImgModalOpen={data.setIsBatchImgModalOpen}
                navigate={data.navigate}
                workId={data.workId}
                sortedGroupNames={sortedGroupNames}
                groupedChars={groupedChars}
                cardVariants={data.cardVariants}
                setCardVariants={data.setCardVariants}
                fullVariants={fullVariants}
                work={data.work}
                charExt={charExt}
                activeCharId={data.activeCharId}
                setActiveCharId={data.setActiveCharId}
                handleCharDragStart={handleCharDragStart}
                handleCharDragOver={handleCharDragOver}
                handleCharDragEnd={handleCharDragEnd}
                sortKeys={sortKeys}
                sortKey={sortKey}
                sortDir={sortDir}
                setSort={setSort}
                wikiPages={data.wikiPages}
                ratingAxes={ratingAxes}
                ratingScale={ratingScale}
                classified={classified}
                filterGroups={filterGroups}
                filterSelection={filterSelection}
                onFilterToggle={handleFilterToggle}
                onFilterClear={handleFilterClear}
                filterShown={visibleChars.length}
                filterTotal={displayChars.length}
              />
            )}

            {/* 현재 활성화된 캐릭터의 상세 프로필 설정 문서 출력 */}
            {!activePage && activeChar && (
              <CharacterDetailSection activeChar={activeChar} charSectionNum={data.charSectionNum} styles={styles} onBacklink={handleBacklink} />
            )}

            {/* 캐릭터 하단 스크롤 트랙용 퀵 네비게이터 바 조립 */}
            {!activePage && activeChar && (
              <CharacterQuickNav characters={displayChars} activeCharId={data.activeCharId} setActiveCharId={data.setActiveCharId} styles={styles} />
            )}
            
          </main>
          
          {/* 스마트 정보 박스 배치 구역 */}
          <aside className={styles.wikiAside}>
            <CharacterInfobox char={activeChar} workId={data.workId} workTitle={data.work.title} charExt={charExt} imgVariants={imgVariants} setCharacters={data.setCharacters} setActiveCharId={data.setActiveCharId} characters={data.characters} cardVariants={data.cardVariants} setCardVariants={data.setCardVariants} formSwaps={data.formSwaps} setFormSwaps={data.setFormSwaps} wikiPages={data.wikiPages} onOpenPage={(id) => data.navigate(`/work/${data.workId}?pageId=${id}`)} ratingAxes={ratingAxes} ratingScale={ratingScale} classified={classified} />
          </aside>
        </div>
      </div>

      {/* 실시간 썸네일 Y축 드래그 조정 일괄 레이어 모달 */}
      <BatchImageModal isOpen={data.isBatchImgModalOpen} onClose={() => data.setIsBatchImgModalOpen(false)} characters={data.characters} work={data.work} charExt={charExt} batchImgY={data.batchImgY} setBatchImgY={data.setBatchImgY} batchImgX={data.batchImgX} setBatchImgX={data.setBatchImgX} setCharacters={data.setCharacters} />
    </div>
  );
};

export default WorkDetailPage;
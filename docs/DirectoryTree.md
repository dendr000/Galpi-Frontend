  ```bash
src/
 ├── App.jsx                                    # 애플리케이션 최상위 라우팅 및 전역 환경설정 주입 코어 파일
 ├── App.chrome.test.jsx                        # 화면별 앱 틀(메뉴 바, 상단 바 등) 연결 시험
 ├── main.jsx                                   # React 웹 애플리케이션 DOM 주입 및 서비스 구동 진입점 파일
 │
 ├── api/
 │   └── axiosCore.js                           # 백엔드 데이터베이스 서버와의 비동기 통신용 Axios 기본 인스턴스 설정
 │
 ├── assets/
 │   └── image.png                              # 시스템 UI 구성용 범용 정적 이미지 파일 리소스
 │
 ├── store/                                     # [전역 상태 관리 스토어]
 │   ├── useAppStore.js                         # 클라이언트 비즈니스 뼈대를 통제하는 Zustand 기반 전역 핵심 상태 스토어
 │   ├── useModalStore.js                       # 레이어 팝업 및 기능 모달들의 동적 개폐 상태 전용 관리 스토어
 │   ├── useSettingStore.js                     # 글꼴 크기, 서체 종류, 레이아웃 해상도 등 커스텀 외관 설정 저장 스토어
 │   └── useSettingStore.test.js                # 설정 저장소의 새 기본 폭과 옛 설정 한 번만 옮기기(마이그레이션) 시험
 │
 ├── styles/                                    # [전역 및 컴포넌트별 CSS 모음]
 │   ├── appShellCss.test.js                    # 앱 틀 CSS 규칙(폭 제한 해제, 메뉴 바 높이 변수) 시험
 │   ├── bulk.css                               # 스프레드시트형 캐릭터 속성 다중 원장 수정용 전용 CSS 스타일시트
 │   ├── category.css                           # 장르 및 태그별 작품 목록 필터링 대시보드 전용 CSS 스타일시트
 │   ├── edit.css                               # 위키 보드 및 신규 작품 설정 작성 에디터 전용 CSS 스타일시트
 │   ├── galpi.css                              # 애플리케이션 전역 공통 레이아웃 및 뼈대 물리 배치 컨트롤 스타일시트
 │   ├── global.css                             # CSS 루트 테마 변수 선언 및 기본 정렬(Reset) 전역 스타일시트
 │   ├── index.css                              # 최상단 HTML 도큐먼트 기본 화면 정렬용 기초 CSS 스타일시트
 │   ├── memo-page.css                          # 무한 스크롤 확장형 플로팅 메모장 전용 CSS 스타일시트
 │   └── novel-viewer.css                       # 가독성 극대화를 위한 웹소설 뷰어 템플릿 전용 CSS 스타일시트
 │
 ├── utils/                                     # [순수 자바스크립트 유틸리티 함수]
 │   ├── appChrome.js                           # 화면(주소)별 앱 틀 표시 규칙(메뉴 바, 상단 바, 떠 있는 메뉴, 푸터)
 │   ├── appChrome.test.js                      # 앱 틀 표시 규칙 시험
 │   ├── askText.js                             # 글자 한 줄을 묻는 공용 함수(앱 안 입력 모달 사용, window.prompt 대체)
 │   ├── backlinkRouter.js                      # 설정 텍스트 간 동적 참조 관계 구문 분석 기반 경로 역추적 라우팅 유틸
 │   ├── consoleGate.js                         # 콘솔 로그(log, debug, info)를 켜고 끄는 로직(개발 서버 켬, 배포 끔, 저장값 우선)
 │   ├── installConsoleGate.js                  # 앱 시작 때 가장 먼저 불러와 로그 켜고 끄기를 적용하고 galpiDebug 를 만든다
 │   ├── layoutWidth.js                         # 앱 폭 규칙(전체 폭/본문 폭 제한), 작품 영역 클래스, 저장된 설정 버전 옮기기
 │   ├── layoutWidth.test.js                    # 폭 규칙과 설정 옮기기 시험
 │   └── markdownParser.js                      # 마크다운 구문 파싱 및 최상단 프론트매터(Meta) JSON 추출 파서 엔진
 │
 ├── hooks/                                     # [애플리케이션 전역 커스텀 훅]
 │   ├── useBacklinkRouter.js                   # 문서 본문 내 백링크 태그 선택 시 라우터를 변환해주는 커스텀 액션 훅
 │   ├── useBossKey.js                          # 몰컴용 스위칭 화면 락 기능 단축키 바인딩 전역 커스텀 훅
 │   ├── useWindowWidth.js                      # 창 폭(px)을 돌려주고 창 크기가 바뀌면 갱신하는 훅
 │   ├── useWindowWidth.test.jsx                # 창 폭 훅 시험
 │   └── useHorizontalScroll.js                 # 마우스 수직 휠 입력을 컨테이너 가로 스크롤 벡터로 치환해주는 전역 훅
 │
 ├── components/                                # [공통 UI 컴포넌트 구역]
 │   ├── common/
 │   │   ├── BossBlindLayer.jsx                 # 보스키 트리거 감지 시 브라우저를 즉각 마스킹 처리하는 위장막 레이어
 │   │   ├── FindBar.jsx                        # Ctrl+F 페이지 찾기창(Electron exe 에는 기본 찾기 창이 없어 직접 제공)
 │   │   ├── findInPage.js                       # 페이지 찾기 엔진(글자 노드 검색, CSS Highlight 표시)
 │   │   ├── icons/
 │   │   │   ├── Icon.jsx                       # 이모티콘 대신 쓰는 SVG 아이콘 컴포넌트(글자색과 글자 크기를 따름)
 │   │   │   └── iconRegistry.js                # assets/icons/*.svg 를 이름으로 꺼내 쓰는 등록부와 문자열 HTML 용 iconHtml
 │   │   ├── ModalOverlay.jsx                   # 팝업 모달창 활성화 시 뒷배경을 어둡게 처리하는 공통 UI 레이어 컴포넌트
 │   │   ├── SettingModal.jsx                   # 사용자 뷰 설정 변경값을 스토어에 바인딩하는 시스템 환경설정 팝업
 │   │   └── TextPromptModal.jsx                # window.prompt 대신 쓰는 앱 안의 글자 입력 모달(Electron exe 는 prompt 미지원)
 │   └── layout/
 │       ├── FabMenu.jsx                        # 우측 하단 유틸리티 도구들을 호출하는 플로팅 액션 버튼(FAB) 레이아웃
 │       ├── GlobalContextMenu.jsx              # 마우스 우클릭 기본 동작을 차단하고 커스텀 컨텍스트 메뉴를 표출하는 모듈
 │       ├── Gnb.jsx                            # 최상단 상시 고정형 로고 및 글로벌 네비게이션 바
 │       ├── menuBar/                           # 화면 맨 위 메뉴 바(파일, 편집, 보기, 설정) 모음
 │       │   ├── MenuBar.jsx                    # 메뉴 바 화면, 열림 상태, 키보드 조작
 │       │   ├── MenuBar.module.css             # 메뉴 바 전용 CSS 모듈(높이 28px, 열린 목록 겹침 순서 2500)
 │       │   ├── MenuBar.test.jsx               # 메뉴 바 마우스, 키보드, 기존 기능 연결 시험
 │       │   ├── menuDefinitions.js             # 메뉴 구성과 항목별 활성 조건, 실행 동작을 정하는 순수 함수
 │       │   ├── menuDefinitions.test.js        # 메뉴 구성 시험
 │       │   ├── menuActions.js                 # 메뉴 바와 상단 바가 함께 쓰는 공용 동작(다크 모드, 테마 순환, 찾기 열기)
 │       │   └── menuActions.test.js            # 공용 동작 시험
 │       └── search/                            # 헤더 검색 추천
 │           ├── HeaderSearch.jsx               # 검색창과 추천 목록(키보드/클릭 이동)
 │           ├── searchSuggest.js               # 후보 만들기와 추천 순위 계산(순수 함수)
 │           └── searchSettings.js              # 숨김 분류 작품 포함 여부 설정(localStorage + 이벤트)
 │
 ├── domains/                                   # [핵심 비즈니스 로직 및 기능별 묶음]
 │   ├── work/
 │   │   ├── backlink.js                        # 본문 [[이름]] 링크가 가리키는 같은 작품 캐릭터/다른 작품을 찾는 순수 로직
 │   │   ├── FloatingLeftTree.jsx               # 하위 위키 문서들의 부모-자식 계층 구조를 시각화하는 플로팅 사이드 트리
 │   │   ├── FloatingLeftTree.dock.test.jsx     # 문서 트리의 붙은 모드와 접힌 모드 시험
 │   │   ├── FloatingToc.jsx                    # 실시간 DOM 헤딩을 추적하여 부드러운 스크롤 이동을 지원하는 플로팅 목차
 │   │   ├── FloatingToc.test.jsx               # 목차의 붙은 모드와 접힌 모드 시험
 │   │   ├── panelLayout.js                     # 양옆 패널을 본문 옆에 붙일지 정하는 규칙(기준 폭 1650px)
 │   │   ├── panelLayout.test.js                # 패널 붙이기 규칙 시험
 │   │   ├── InlineCategoryForm.jsx             # 장르 태그 배지를 실시간 비동기로 즉시 추가하는 인라인 전용 입력 폼
 │   │   ├── newPageUrl.js                      # 새 하위 문서 편집 주소(parentId 유무)와 "같은 위치" 상위 문서 번호를 계산하는 순수 함수
 │   │   ├── organization.js                    # 소속 값과 같은 제목의 하위 문서를 잇고 소속 인물을 모으는 순수 로직
 │   │   ├── export/                            # 공개용 HTML 내보내기(작품 페이지를 읽기 전용 단일 파일로)
 │   │   │   ├── ExportDialog.jsx               # 기밀 처리, 이미지, 문서 포함 옵션을 고르는 창
 │   │   │   ├── downloadFile.js                # 글자 내용을 파일로 내려받게 하는 도우미
 │   │   │   ├── exportHtml.js                  # 준비된 데이터로 단일 HTML 문서를 조립하는 순수 함수(모든 글자 이스케이프)
 │   │   │   ├── exportStyles.js                # 내보낸 파일에 넣는 스타일(라이트/다크 자동, 매크로 위젯 CSS 포함)
 │   │   │   ├── exportWork.js                  # 데이터 준비와 HTML 조립을 묶고 파일 이름, 날짜를 정한다
 │   │   │   ├── imageToDataUri.js              # 이미지를 줄여 webp 데이터 주소로 바꾸는 브라우저 전용 함수
 │   │   │   ├── inlineImages.js                # 본문 속 /img/ 이미지를 데이터 주소로 바꾸거나 제거
 │   │   │   ├── prepareExportModel.js          # 보이는 캐릭터, 기밀 처리, 이미지, 본문 변환으로 내보낼 데이터를 준비
 │   │   │   ├── sanitizeExportHtml.js          # 스크립트, 이벤트 속성, 위험한 주소를 제거해 본문 HTML 을 안전하게
 │   │   │   └── useWorkExport.js               # 화면의 현재 상태로 내보내고 내려받는 함수를 돌려주는 훅
 │   │   ├── SubPageList.jsx                    # 현재 경로에 배속된 자식 문서들을 노션 스타일 그리드로 표출하는 모듈
 │   │   ├── WorkCategoryBar.jsx                # 지정된 분류 태그들을 호버 링크로 정렬 및 삭제 관리하는 도메인 바
 │   │   ├── WorkCover.jsx                      # 작품 상세 상단 타이틀 이미지를 휠 확대 및 드래그 위치 제어하는 배너
 │   │   ├── TreeContextMenu.jsx                # 문서 트리 우클릭 메뉴(body 로 꺼내 그림, Esc 와 바깥 클릭으로 닫힘)
 │   │   ├── useWorkBacklink.js                 # [[이름]] 링크 클릭 시 캐릭터 선택+스크롤 또는 작품 이동을 처리하는 커스텀 훅
 │   │   ├── tocScan.js                         # 목차용 제목 스캔에서 큰 창 안의 제목을 빼는 도우미
 │   │   ├── useSelectCharFromUrl.js            # 주소의 ?charId= 로 열리면 그 캐릭터를 선택하고 카드로 스크롤하는 훅
 │   │   └── useWorkDetailData.js               # 작품 상세 화면의 데이터 로드, 목차 스캔, 상태 관리를 전담하는 커스텀 훅
 │   ├── character/
 │   │   ├── BatchImageModal.jsx                # 모든 등장인물의 썸네일 세로 정렬 및 확대 배율을 동시 조작하는 일괄 모달
 │   │   ├── AffiliationLinks.jsx               # 소속 값을 쉼표 단위로 보여 주고 같은 제목의 하위 문서가 있으면 링크로 그리는 조각
 │   │   ├── CharacterDetailSection.jsx         # 선택된 인물의 세부 원장 및 마크다운 본문을 안전하게 렌더링하는 컨테이너
 │   │   ├── CharacterGrid.jsx                  # 속성값 정렬 기준에 매핑된 인물 카드를 격자 배열하는 갤러리 컴포넌트
 │   │   ├── CharacterInfobox.jsx               # 우측 영역에 상시 밀착하여 캐릭터 핵심 프로필 정보를 요약 표출하는 인포박스
 │   │   ├── CharacterQuickNav.jsx              # 상세 정보 하단에 배치되어 해당 캐릭터 카드로 초점을 강제 이동시키는 바
 │   │   ├── characterGroups.js                 # 숨김/폼 스왑 반영과 분류 그룹 묶기, 그룹 안 정렬을 계산하는 순수 로직
 │   │   ├── groupHide.js                       # 작품 설정 "그룹에서 숨길 값"을 읽고 저장하는 로직
 │   │   ├── characterFilter.js                 # 소속, 등급 칩 필터의 칩 모으기와 걸러내기 순수 로직(그룹 안 OR, 그룹 사이 AND)
 │   │   ├── FilterChips.jsx                    # 캐릭터 목록 위의 소속, 등급 칩 필터 UI
 │   │   ├── classified.js                      # 캐릭터의 기밀 여부(기밀 속성) 판정과 기본 상태
 │   │   ├── ClassifiedStamp.jsx                # 기밀 캐릭터에 붙이는 "기밀" 도장
 │   │   ├── useClassifiedMask.js               # "기밀 가리기" 켜짐(작품별 저장)과 열람 기록을 가진 커스텀 훅
 │   │   ├── charViewSettings.js                # 본문 보기 설정(자동 이동, 더블클릭 큰 창)을 이 PC에 저장하고 읽는 로직
 │   │   ├── useGridSelectScroll.js             # 그리드 카드를 선택하면 본문으로, "그리드로"로 카드로 스크롤하는 훅
 │   │   ├── CharacterViewModal.jsx             # 본문(왼쪽)과 인포박스(오른쪽)를 크게 보여 주고 방향키로 넘기는 큰 창
 │   │   ├── CharacterViewModal.css             # 큰 창의 검색 상자, 주변 캐릭터 띠, 인포박스 배치 꾸밈
 │   │   ├── charSearch.js                      # 큰 창 검색(이름 포함, 앞부분 일치 우선)과 캐릭터 테마 색 읽기
 │   │   ├── CharViewSettingsMenu.jsx           # 목록 위 "보기 설정" 메뉴(자동 이동, 더블클릭 큰 창)
 │   │   ├── characterSort.js                   # 속성값(서열, 나이 등)으로 캐릭터를 정렬하는 순수 로직
 │   │   ├── PageMemberList.jsx                 # 하위 문서 아래에 같은 소속의 인물을 카드로 모아 보여 주는 목록
 │   │   ├── RatingBadges.jsx                   # 등급을 "R 3" 같은 작은 칩으로 보여 주는 조각
 │   │   ├── RatingScaleTable.jsx               # 작품 페이지의 등급 기준표(판정 축, 등급 기준)
 │   │   ├── ratings.js                         # 등급 설정(판정 축, 기준표) 해석과 캐릭터 배지 계산 순수 로직
 │   │   ├── useCharacterSort.js                # 작품별 정렬 선택(속성, 방향)을 저장하는 커스텀 훅
 │   │   └── useCharacterDrag.js                # 마우스 드래그 이벤트를 추적하여 캐릭터 카드 간 영구 정렬 순서를 바꾸는 훅
 │   ├── memo/
 │   │   ├── FabMemoWidget.jsx                  # 플로팅 액션 버튼 메뉴와 유기적으로 호환되는 소형 레이어 메모 위젯
 │   │   ├── FabMemoWidget.module.css           # 간이 플로팅 메모 위젯 전용 스코프 락 모듈 CSS 스타일시트
 │   │   ├── MemoEditor.jsx                     # 메모의 서식 정제 및 텍스트 데이터 실시간 스트리밍을 수행하는 에디터
 │   │   ├── MemoModal.jsx                      # 개별 저장된 인덱스 메모 카드를 확장 확인하는 팝업 모달 컴포넌트
 │   │   └── MemoSidebar.jsx                    # 생성된 모든 메모들을 폴더 및 시간순 구조로 정렬하는 서브 네비게이터
 │   ├── macro/
 │   │   ├── BarGraph.jsx                       # 매크로 원장 데이터를 해독하여 막대그래프를 직접 드로잉하는 SVG 컴포넌트
 │   │   ├── BarGraphViewer.jsx                 # 마크다운 텍스트 내 막대그래프 특수 매크로 감지 시 시각화해주는 뷰어 위젯
 │   │   ├── BasicMacroTools.jsx                # 마크다운 에디팅 중 매크로 구문을 자동 가이드 주입하는 가속 유틸 모듈
 │   │   ├── MacroToolbar.jsx                   # 위키 편집 페이지에 부착되는 그래프/타임라인 등 매크로 원터치 특수 툴바
 │   │   ├── MacroToolbar.module.css            # 매크로 퀵 툴바 인터페이스 전용 모듈 CSS 스타일시트
 │   │   ├── MarkdownRenderer.jsx               # 원본 마크다운 텍스트를 위키 링크와 결합하여 안전한 HTML로 변환하는 엔진
 │   │   ├── MarkdownViewer.jsx                 # 일반 독립 텍스트 설정 문서를 열람용 마크다운 보드로 표출하는 뷰어 컴포넌트
 │   │   ├── RadarChart.jsx                     # 능력치 배열을 해독하여 오각형 등 정다각형 레이더 차트를 그리는 SVG 모듈
 │   │   ├── RadarChartViewer.jsx               # 레이더 차트 매크로 스크립트를 시각적 다각형 그래프 위젯으로 환원하는 뷰어
 │   │   ├── RelationEditor.jsx                 # 인물 간 화살표 방향 및 텍스트 링크 가중치 설정용 보조 편집 패널
 │   │   ├── RelationGraph.jsx                  # SVG 오비탈 궤도 연산을 통해 전체 등장인물 상호 관계망을 그리는 엔진
 │   │   ├── Timeline.jsx                       # 연도 및 사건 데이터셋을 하향식 일직선 타임라인 레이아웃으로 그리는 모듈
 │   │   └── TimelineViewer.jsx                 # 연대기 스크립트 감지 시 그래픽스 타임라인 패널로 트랜스파일해주는 위젯
 │   └── fabTools/
 │       ├── BoilerplateModal.jsx               # 자주 쓰이는 문서 템플릿 및 설정 상용구를 즉시 붙여넣는 유틸리티 팝업
 │       ├── ClipboardModal.jsx                 # 시스템 멀티 클립보드 복사 이력을 역추적하여 데이터 보존을 돕는 모달
 │       ├── DictModal.jsx                      # 위키 집필 도중 외부 사전 데이터를 브라우저 이탈 없이 호출하는 연동 모달
 │       ├── RecentModal.jsx                    # 최근 편집하거나 방문한 설정 페이지 간의 최단거리 워프 링크 가이드 모달
 │       └── SearchModal.jsx                    # 전역 설정 단어 및 키워드 초고속 인덱싱용 전역 통합 검색 레이어 팝업
 │
 └── pages/                                     # [화면 라우팅 엔드포인트 구역]
     ├── BulkStudio/
     │   ├── BulkModals.jsx                     # 찾아바꾸기 및 마크다운 편집 등 일괄 수정 부가 기능 모달 컨테이너
     │   ├── BulkSidebar.jsx                    # 실제 캐릭터 카드 UI 레이아웃과 100% 동일한 실시간 프리뷰 뷰어 컴포넌트
     │   ├── BulkStudio.module.css              # 일괄 수정 데이터 스튜디오 전용 모듈 CSS 스타일시트
     │   ├── BulkStudioPage.jsx                 # 전체 등장인물의 다차원 원장 속성 데이터를 엑셀식 그리드로 수정하는 페이지
     │   ├── BulkTable.jsx                      # 가상화(Virtual) 렌더링 엔진과 자동완성 드롭다운이 융합된 데이터 그리드 코어
     │   ├── columnMovePrompt.js                # 속성(열) 이름을 눌렀을 때 몇 번째로 옮길지 묻고 숫자로 돌려주는 함수
     │   ├── BulkTableRow.jsx                   # 재렌더링 부하 격리 및 고정(Sticky) 셀의 시각적 겹침 방지 처리용 단일 행 컴포넌트
     │   ├── BulkToolbar.jsx                    # 탭 스위칭, 속성 추가, 일괄 덮어쓰기 등 워크스페이스 상단 데이터 제어 툴바
     │   └── useBulkStudioData.js               # 디바운싱 검색 자동완성, 예약어 필터링, 단축키 이벤트를 관장하는 커스텀 훅
     ├── Category/
     │   ├── Category.module.css                # 카테고리 인덱스 화면 전용 모듈 CSS 스타일시트
     │   └── CategoryPage.jsx                   # 분류별 설정 문서 및 작품 필터링 페이지
     ├── Editor/
     │   ├── EditorPage.jsx                     # 통합 설정 에디터 작업 및 문서 작성 UI 렌더링 페이지
     │   ├── EditorPage.module.css              # 에디터 작업 페이지 전용 모듈 CSS 스타일시트
     │   ├── creatorExt.js                      # 같은 제작자 작품들이 가장 많이 쓴 이미지 확장자 계산(순수 함수)
     │   ├── EditorSearch.jsx                   # 에디터 내부 실시간 링크 주입용 검색 컴포넌트
     │   └── useEditorData.js                   # 비동기 서버 통신, 데이터 직렬화/파싱, 메타데이터 보존 및 예약어 필터링 훅
     ├── Home/
     │   ├── Home.module.css                    # 메인 대시보드 화면 전용 모듈 CSS 스타일시트
     │   ├── HomePage.jsx                       # 전체 작품 목록 스캔 및 메인 대시보드 페이지
     │   ├── HeroSlider.jsx                     # 메인 상단 커버 배너(오른쪽으로만 계속 넘어가는 슬라이더)
     │   ├── heroSlides.js                      # 슬라이드 대상 고르기, 셔플, 커버 이미지 주소 만들기(순수 함수)
     │   ├── hooks/
     │   │   ├── useHeroSlider.js               # 5초 타이머와 끝없이 이어지는 위치 계산
     │   │   └── useHomeFetch.js                # 작품/캐릭터/숨김 분류 조회와 숨김 분류 필터
     │   └── utils/
     │       └── filterHiddenWorks.js           # 숨김 분류 작품 걸러내기(순수 함수)
     ├── MemoWorkspace/
     │   ├── MemoWorkspace.module.css           # 무한 캔버스 메모장 전용 모듈 CSS 스타일시트
     │   └── MemoWorkspacePage.jsx              # 통합 메모 캔버스 제어 및 관리 페이지
     ├── NotFound/
     │   └── NotFoundPage.jsx                   # 404 예외 경로 진입 시 출력되는 폴백 페이지
     ├── NovelViewer/
     │   ├── NovelViewer.module.css             # 소설 독서 뷰어 화면 전용 모듈 CSS 스타일시트
     │   └── NovelViewerPage.jsx                # 작성된 원고 열람 및 뷰어 커스텀 제어 페이지
     └── WorkDetail/
         ├── WorkDetail.module.css              # 작품 상세 정보 화면 전용 모듈 CSS 스타일시트
         ├── WorkDetailPage.jsx                 # 데이터 패치 및 도메인 UI 컴포넌트 총괄 조립 페이지
         └── WorkDetailPage.layout.test.jsx     # 작품 페이지 폭 규칙(전체 폭/본문 폭 제한) 시험
```
  
Fab-Memo 관련 트리를 보려면 [이 링크](./domains/fab/memo.md)로 이동하세요.
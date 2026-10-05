<!-- Galpi/Galpi-Frontend/docs/domains/fab/memo.md -->
[전체 보기](../../DirectoryTree.md)  

```bash
memo/
├── shared/                                # [팹(FAB)과 워크스페이스(Workspace)가 공통으로 사용하는 핵심 엔진 및 UI]
│   ├── components/                        # [공통 에디터 하위 UI 컴포넌트]
│   │   ├── MemoBookmarkModal.jsx          # 에디터 내 삽입된 책갈피 위치로 스크롤 텔레포트 이동을 돕는 '찾아가기' 모달
│   │   ├── MemoEditorBody.jsx             # ContentEditable 기반의 실제 텍스트 입력 및 DOM 렌더링 구역
│   │   ├── MemoFindReplaceBar.jsx         # 툴바 내부에서 텍스트 일괄 치환(Find/Replace) 비제어 폼을 렌더링하는 패널
│   │   ├── MemoFoldControlBar.jsx         # 접기 박스(Accordion) 포커스 시 박스 영구 삭제 버튼을 렌더링하는 전용 패널
│   │   ├── MemoFootnotePopover.jsx        # 각주 마우스 호버(뷰 모드) 및 클릭(편집/삭제 모드) 제어용 팝오버
│   │   ├── MemoFormatMainBar.jsx          # 텍스트 서식(볼드 등), 링크, 표, 템플릿 삽입 버튼을 포함하는 기본 메인 툴바
│   │   ├── MemoIcons.jsx                  # 메모장 전역에서 사용되는 범용 SVG 벡터 아이콘 모음집
│   │   ├── MemoLinkPopover.jsx            # 드래그한 텍스트에 내부 하이퍼링크를 삽입하거나 수정하는 모달
│   │   ├── MemoTableControlBar.jsx        # 표 포커스 시 활성화되는 행/열/셀 정렬/너비 및 배경색 제어 전용 패널
│   │   ├── MemoTagBar.jsx                 # 에디터 최하단에서 태그를 입력하고 파란색 알약(Pill) 형태로 보여주는 UI
│   │   └── TagSearchModal.jsx             # 특정 태그 클릭 시 해당 태그가 포함된 메모 리스트를 중앙에 띄워주는 검색 모달
│   │
│   ├── hooks/                             # [공통 비즈니스 로직 및 상태 관리 커스텀 훅]
│   │   ├── drag/                          # [블록 드래그 앤 드롭 물리 엔진 훅]
│   │   │   ├── dragDOMBuilder.js          # 드래그 핸들 및 인디케이터 DOM 요소를 동적으로 생성/주입하는 유틸리티
│   │   │   ├── useBlockDragDrop.js        # HTML5 DnD 이벤트를 낚아채어 물리적인 DOM 위치 스왑을 집행하는 엔진
│   │   │   └── useBlockHoverSensor.js     # Y축 레이캐스팅을 통해 마우스 호버 및 블록 엣지를 감지하는 센서
│   │   │
│   │   ├── events/                        # [정밀 DOM 마우스/키보드 이벤트 훅]
│   │   │   ├── useMemoSelection.js        # 브라우저 기본 Ctrl+A 폭주를 막는 표/아코디언 정밀 스캐너 및 복사 격리 로직
│   │   │   └── useMemoTableNav.js         # 표 내부에서 Tab/Enter로 엑셀처럼 셀을 이동하는 스마트 네비게이션 로직
│   │   │
│   │   ├── table/                         # [표 내부 DOM 제어 및 서식 지정 물리 엔진 훅]
│   │   │   ├── useTableFocus.js           # Selection API 기반의 표 내부 셀 포커싱 상태 감지 센서
│   │   │   ├── useTableFormat.js          # 셀 정렬, 배경색 변경, 너비 확장 및 제목 행 토글 등 스타일 제어 로직
│   │   │   └── useTableStructure.js       # 행 추가/삭제 및 표 전체 영구 삭제를 관장하는 구조 변형 액션 로직
│   │   │
│   │   ├── useMemoAutoSave.js             # 에디터와 제목 입력창의 타이핑 이벤트를 감지하여 3초간 입력이 없을 시 백그라운드 자동 저장(Debounce)을 집행하는 센서 훅
│   │   ├── useMemoBlockDrag.js            # drag 하위 모듈들을 조립하여 메인 에디터로 주입하는 드래그 허브(Hub) 훅
│   │   ├── useMemoBookmark.js             # 텍스트 노드 기반 책갈피 마커 삽입 및 정밀 스크롤 이동(ScrollIntoView) 훅
│   │   ├── useMemoEvents.js               # 단축키(저장, 각주 등), 라우팅 차단 및 스위칭(SPA 이동)을 관장하는 전역 이벤트 훅
│   │   ├── useMemoFindReplace.js          # 에디터 본문 내 특정 문자열을 찾아 일괄 치환(Find/Replace)하는 연산 훅
│   │   ├── useMemoFootnote.js             # CSS 카운터 기반 각주 마커 주입 및 모달 뷰/편집 모드 전환 제어 훅
│   │   ├── useMemoFormat.js               # 볼드, 기울임, 템플릿 삽입 등 HTML 기반(execCommand) 텍스트 포맷 제어 훅
│   │   ├── useMemoLink.js                 # Selection API(Range)를 이용해 텍스트 좌표를 추적하고 링크를 주입/수정하는 로직
│   │   ├── useMemoSave.js                 # 작성된 본문과 추출된 태그를 직렬화하여 백엔드 DB(Axios)와 통신하는 저장 전담 훅
│   │   └── useMemoTableCtrl.js            # table 하위 모듈들을 조립하여 메인 에디터로 주입하는 표 제어 허브(Hub) 훅
│   │
│   └── utils/                             # [순수 자바스크립트 유틸리티]
│       └── memoTreeUtils.js               # 평면적 폴더 배열과 메모를 순회하여 슬래시(/) 기반 계층형 깊이(Depth) 트리를 빌드하는 파서
│
├── fab/                                   # [우측 하단 플로팅 메모장(FAB) 전용 컴포넌트 및 로직]
│   ├── components/                        # [탐색기 및 래퍼 전용 하위 UI 컴포넌트]
│   │   ├── FabMemoEditorHeader.jsx        # (기존 MemoEditorHeader.jsx) 에디터 상단 헤더 UI (제목 입력, 글자 수 통계, 저장 상태 표기, 페이지 이동 버튼)
│   │   ├── FabMemoFormatBar.jsx           # (기존 MemoFormatBar.jsx) 여러 서브 툴바 컴포넌트를 조건에 맞게 렌더링해주는 툴바 컨테이너 래퍼
│   │   ├── FabMemoSidebar.jsx             # (기존 MemoSidebar.jsx) 좌측 메모 탐색기 래퍼 (폴더 트리, 스마트 폴더, 태그 탐색기 등 분리된 모듈 조립)
│   │   ├── MemoContextMenu.jsx            # 메모 및 폴더 제어용 우클릭/더보기 컨텍스트 팝업 메뉴
│   │   ├── MemoItem.jsx                   # 사이드바 탐색기 내부에 표시되는 개별 메모 카드(아이콘, 제목, 액션 버튼) UI
│   │   ├── MemoSmartFolders.jsx           # '최근 7일', '미분류' 등 동적 필터링을 제공하는 가상 스마트 폴더 UI
│   │   ├── MemoTagExplorer.jsx            # 사이드바 하단에서 사용된 태그 빈도를 집계하여 보여주는 탐색기 아코디언
│   │   └── MemoTreeRenderer.jsx           # 다중 계층(Depth) 폴더 구조를 재귀적으로 렌더링하는 사이드바 전용 컴포넌트
│   │
│   ├── hooks/                             # [탐색기 및 팹 전용 비즈니스 로직 훅]
│   │   ├── useFabMemoEditor.js            # (기존 useMemoEditor.js) 에디터 관련 하위 훅들을 모두 결합하여 UI 컨테이너에 주입하는 중앙 관제탑 훅
│   │   ├── useMemoFolder.js               # 폴더 생성, 이름 변경, 삭제(기타 폴더 연쇄 이관) 및 로컬/DB 동기화 전담 훅
│   │   ├── useMemoMenu.js                 # 컨텍스트 메뉴 좌표 계산 및 외부 클릭 닫힘, 폴더 간 이동 로직 전담 훅
│   │   ├── useMemoSidebar.js              # 사이드바 내의 폴더 트리, 정렬, 태그 검색 등 여러 훅을 조립하는 탐색기 허브 훅
│   │   ├── useMemoSortAndDrag.js          # 셀렉트 박스(이름순/최신순) 및 전역 태그(selectedTag) 기반의 교차 필터링 상태 관리 훅
│   │   ├── useMemoTags.js                 # 메모 전체 데이터를 순회하여 태그 빈도수를 집계하고 내림차순 정렬하는 연산 훅
│   │   └── useMemoTree.js                 # 다중 계층 폴더 트리의 접힘/펼침(isExpanded) 상태를 독립적으로 기억하는 훅
│   │
│   ├── FabMemoEditor.jsx                  # (기존 MemoEditor.jsx) 메모장 리치 텍스트 에디터 메인 컨테이너 (훅 조립 및 서브 컴포넌트 렌더링)
│   └── FabMemoWidget.jsx                  # 우측 하단 플로팅 액션 버튼(FAB) 형태의 메모장 위젯 메인 컨트롤러 및 최상위 레이아웃
│
└── workspace/                             # [넓은 화면의 메모 워크스페이스 전용 모듈]
    └── MemoModal.jsx                      # 화면 전체를 덮는 확장형 및 중앙 팝업형 메모장 모달 전용 래퍼 컨테이너
```
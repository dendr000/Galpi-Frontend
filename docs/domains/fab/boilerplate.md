```bash
boilerplate/
 ├── utils/
 │   ├── boilerplateStyles.js       # 공통 Input UI 스타일 객체
 │   ├── activeFolder.js            # 활성 폴더 규칙(닫으면 '전체'로 자동 복귀 설정, 활성 폴더 기준 상용구 선별)
 │   └── activeFolder.test.js       # 위 규칙 단위 테스트
 ├── hooks/
 │   ├── useBoilerplateSearch.js    # Enter 지연 검색 엔진 훅 (신규 분리)
 │   ├── useBoilerplateData.js      # (기존 파일 이동)
 │   ├── useBoilerplateCore.js      # (기존 파일 이동)
 │   └── useBoilerplateListener.js  # (기존 파일 이동)
 ├── components/
 │   ├── BoilerplateHeader.jsx      # 폴더 제어 및 환경설정 체크박스 UI
 │   ├── BoilerplateForm.jsx        # 단건 추가/수정 폼 UI
 │   ├── BoilerplateBulkForm.jsx    # 일괄 등록(벌크) 폼 UI
 │   ├── BoilerplateSearchBar.jsx   # 검색 바 UI
 │   ├── BoilerplateList.jsx        # 상용구 검색 결과 리스트 UI
 │   └── BoilerplateSuggestPopup.jsx# 실시간 추천 팝업 (기존 파일 이동)
 ├── BoilerplateModal.jsx           # 조립 관제탑 래퍼 (닫을 때 활성 폴더 복귀 처리)
 └── BoilerplateModal.test.jsx      # 모달 닫기 동작 테스트 (jsdom)
 ```
// Copyright (c) dendr000. MIT License.
// 앱 폭 규칙: 기본은 창 전체 폭(full), 사용자가 고르면 본문 폭 제한(center, 1200px).
// 화면 컴포넌트가 폭 규칙을 한 곳에서 같이 쓰도록 순수 함수로 모아 둔다.

// 설정 저장 형식의 버전. 기본값이 바뀔 때 올린다.
// 1: 기본 폭을 center 에서 full 로 변경. 2: 줄 간격 기본 1.8, 자동 저장 기본 3초(연결 안 돼 있던 옛 기본값 1.6, 0 정리).
export const SETTINGS_VERSION = 2;

const isFull = (layoutWidth) => layoutWidth !== 'center';

// 앱 최상위 칸(.galpi-app)의 최대 폭.
export const getAppMaxWidth = ({ layoutWidth, isBulkMode = false, isEditorMode = false, isMemoMode = false }) => {
  if (isBulkMode || isEditorMode || isMemoMode) return '100%';
  return isFull(layoutWidth) ? '100%' : '1200px';
};

// 작품 페이지 장르 테마 영역(#galpi-genre-zone)의 클래스.
// full: 영역이 창 전체를 채워 테마 배경이 가장자리까지 이어지고, 안쪽 칼럼(innerClass)만 읽기 폭을 가진다.
// center: 예전처럼 1200px 가운데 칸.
export const getWorkZoneLayout = (layoutWidth) => (
  isFull(layoutWidth)
    ? { zoneClass: 'wiki-container galpi-work-full', innerClass: 'galpi-work-inner' }
    : { zoneClass: 'wiki-container fixed-container', innerClass: '' }
);

// 홈, 분류 같은 일반 화면 칸의 클래스.
// full: 1200px 제한(fixed-container)을 galpi-page-fluid 가 풀어 창 폭을 채운다. center: 예전처럼 1200px.
export const getPageContainerClass = (layoutWidth) => (
  isFull(layoutWidth) ? 'fixed-container galpi-page-fluid' : 'fixed-container'
);

// 저장돼 있던 설정을 새 버전으로 옮긴다. 옛 기본값(center)만 한 번 full 로 바꾸고,
// 이후 사용자가 직접 고른 값은 건드리지 않는다(zustand persist 의 migrate 에서 호출).
export const migrateSettings = (persisted, version) => {
  const state = persisted && typeof persisted === 'object' ? { ...persisted } : {};
  if (version < 1 && state.layoutWidth === 'center') state.layoutWidth = 'full';
  if (version < 2) {
    // 옛 기본값은 어디에도 적용된 적이 없다. 본문이 실제로 쓰던 값과 편집기가 실제로 저장하던 시간으로 맞춘다.
    if (state.lineHeight === '1.6') state.lineHeight = '1.8';
    if (state.autoSaveInterval === '0') state.autoSaveInterval = '3';
  }
  return state;
};

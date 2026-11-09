// Copyright (c) dendr000. MIT License.
// 앱 폭 규칙: 기본은 창 전체 폭(full), 사용자가 고르면 본문 폭 제한(center, 1200px).
// 화면 컴포넌트가 폭 규칙을 한 곳에서 같이 쓰도록 순수 함수로 모아 둔다.

// 설정 저장 형식의 버전. 기본값이 바뀔 때 올린다(1: 기본 폭을 center 에서 full 로 변경).
export const SETTINGS_VERSION = 1;

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

// 저장돼 있던 설정을 새 버전으로 옮긴다. 옛 기본값(center)만 한 번 full 로 바꾸고,
// 이후 사용자가 직접 고른 값은 건드리지 않는다(zustand persist 의 migrate 에서 호출).
export const migrateSettings = (persisted, version) => {
  const state = persisted && typeof persisted === 'object' ? { ...persisted } : {};
  if (version < 1 && state.layoutWidth === 'center') state.layoutWidth = 'full';
  return state;
};

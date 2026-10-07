// Copyright (c) dendr000. MIT License.
// 파일 위치: src/domains/fabTools/boilerplate/utils/activeFolder.js
// 기능 요약: 상용구 "활성 폴더"(에디터에서 실제로 치환에 쓰이는 폴더 범위) 규칙 — 모달을 닫을 때
//            '전체'로 자동 복귀시키는 설정과, 활성 폴더 기준으로 상용구를 거르는 순수 함수.
//
// 배경: 모달에서 폴더를 고르면 그 폴더가 localStorage('galpi-bp-active-folder')에 저장되고,
//       에디터 쪽 감지기(useBoilerplateListener)가 치환할 때마다 그 값을 읽어 "그 폴더 + 공통"의
//       상용구만 쓴다. 폴더를 정리하려고 골라 둔 채 모달을 닫으면 다른 폴더의 상용구가 말없이 안
//       먹히는 문제가 있어서, 닫을 때 '전체'로 되돌리는 설정(기본 켜짐)을 둔다.
//       localStorage 는 인자로 받아서(storage) 테스트에서 가짜로 바꿔 끼울 수 있게 한다.

export const ALL_FOLDER = '전체';
export const COMMON_FOLDER = '공통';
export const ACTIVE_FOLDER_KEY = 'galpi-bp-active-folder';
export const RESET_ON_CLOSE_KEY = 'galpi-bp-reset-on-close';

// 값이 없거나 'false' 가 아니면 켜짐 — galpi-bp-auto / galpi-bp-preview 와 같은 규칙(기본 켜짐).
export const isResetOnCloseEnabled = (storage) => storage.getItem(RESET_ON_CLOSE_KEY) !== 'false';

export const getActiveFolder = (storage) => storage.getItem(ACTIVE_FOLDER_KEY) || ALL_FOLDER;

// 모달을 닫을 때 호출. 설정이 켜져 있고 특정 폴더가 선택돼 있을 때만 '전체'로 되돌리고 true 를
// 돌려준다(이미 '전체'면 불필요한 쓰기를 하지 않음). 다른 설정 키는 건드리지 않는다.
export const resetActiveFolderIfEnabled = (storage) => {
  if (!isResetOnCloseEnabled(storage)) return false;
  if (getActiveFolder(storage) === ALL_FOLDER) return false;
  storage.setItem(ACTIVE_FOLDER_KEY, ALL_FOLDER);
  return true;
};

// 에디터에서 실제로 쓰이는 상용구 — '전체'면 전부, 특정 폴더면 그 폴더 + '공통' 폴더.
export const selectActiveBoilerplates = (list, activeFolder) =>
  list.filter(
    (b) => activeFolder === ALL_FOLDER || b.category === activeFolder || b.category === COMMON_FOLDER,
  );

// Copyright (c) dendr000. MIT License.
// 헤더 검색 설정: "숨김 분류에 걸린 작품도 검색 추천에 포함할지". 기본은 포함(켜짐)이다.
// 값은 localStorage에 저장하고, 바꾸면 이벤트를 쏴서 열려 있는 헤더 검색이 바로 따라오게 한다.

export const SEARCH_INCLUDE_HIDDEN_KEY = 'galpi-search-include-hidden';
export const SEARCH_SETTINGS_EVENT = 'galpi-search-settings-changed';

export const getIncludeHidden = () => {
  try {
    return localStorage.getItem(SEARCH_INCLUDE_HIDDEN_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const setIncludeHidden = (value) => {
  try {
    localStorage.setItem(SEARCH_INCLUDE_HIDDEN_KEY, String(Boolean(value)));
  } catch {
    /* 저장이 막혀 있어도 이번 실행 중에는 이벤트로 반영한다 */
  }
  window.dispatchEvent(new Event(SEARCH_SETTINGS_EVENT));
};

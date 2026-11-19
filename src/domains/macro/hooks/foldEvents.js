// Copyright (c) dendr000. MIT License.
// 문단 "모두 접기/펼치기" 신호 이름. 목차 버튼이 보내고 본문 접기 훅이 받는다.
export const FOLD_ALL_EVENT = 'galpi-fold-all';

export const requestFoldAll = (collapsed) => {
  window.dispatchEvent(new CustomEvent(FOLD_ALL_EVENT, { detail: { collapsed } }));
};

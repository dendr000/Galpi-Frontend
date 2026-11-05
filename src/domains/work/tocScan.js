// Copyright (c) dendr000. MIT License.
// 목차를 만들려고 페이지의 제목을 훑을 때, 큰 창(data-char-modal) 안의 제목은 뺀다.
// 큰 창은 본문 구역과 같은 글을 한 번 더 그리므로, 빼지 않으면 목차에 같은 항목이 겹치고 번호가 어긋난다.
export const queryTocHeadings = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector)).filter((el) => !el.closest('[data-char-modal]'));

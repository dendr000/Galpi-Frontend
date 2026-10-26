// Copyright (c) dendr000. MIT License.
// 페이지 안 글자 찾기 엔진. 브라우저의 window.find 는 입력칸 안 글자까지 찾아서 찾기창 자신에 걸리고,
// 걸리지 않게 창을 숨기면 입력칸이 포커스를 잃어 한글 조합이 끊겼다. 그래서 문서의 글자 노드를 직접 훑어
// 일치하는 범위(Range)를 모으고, 선택이나 포커스를 건드리지 않는 CSS Highlight 로 표시한다.

export const HIGHLIGHT_ALL = 'galpi-find';
export const HIGHLIGHT_CURRENT = 'galpi-find-current';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'TEMPLATE']);

// 화면에 보이지 않는 요소(display:none, hidden 속성)는 건너뛴다. 같은 요소는 한 번만 계산한다.
const makeVisibilityChecker = () => {
  const cache = new Map();
  const check = (el) => {
    if (!el || el === document.body || el === document.documentElement) return true;
    if (cache.has(el)) return cache.get(el);
    let ok = !SKIP_TAGS.has(el.tagName) && !el.hasAttribute('hidden') && getComputedStyle(el).display !== 'none';
    if (ok) ok = check(el.parentElement);
    cache.set(el, ok);
    return ok;
  };
  return check;
};

// root 아래 글자 노드에서 query 와 일치하는 모든 범위를 문서 순서로 돌려준다.
// exclude 는 찾기창 자신처럼 제외할 요소. 한 글자 노드 안에서만 찾는다(굵게 등으로 나뉜 글자 사이는 이어 찾지 않음).
export const collectMatches = (root, query, exclude) => {
  const needle = String(query || '').normalize('NFC').trim().toLowerCase();
  if (!needle) return [];
  const visible = makeVisibilityChecker();
  const ranges = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || (exclude && exclude.contains(node)) || !visible(parent)) continue;
    const hay = node.nodeValue.toLowerCase();
    for (let from = hay.indexOf(needle); from !== -1; from = hay.indexOf(needle, from + needle.length)) {
      const range = document.createRange();
      range.setStart(node, from);
      range.setEnd(node, from + needle.length);
      ranges.push(range);
    }
  }
  return ranges;
};

const supported = () => typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';

export const clearHighlights = () => {
  if (!supported()) return;
  CSS.highlights.delete(HIGHLIGHT_ALL);
  CSS.highlights.delete(HIGHLIGHT_CURRENT);
};

// 모든 일치는 연한 색, 현재 일치(currentIndex)는 진한 색으로 표시한다. 선택과 포커스는 바꾸지 않는다.
export const applyHighlights = (ranges, currentIndex) => {
  if (!supported()) return;
  clearHighlights();
  if (!ranges.length) return;
  CSS.highlights.set(HIGHLIGHT_ALL, new Highlight(...ranges));
  if (currentIndex >= 0 && currentIndex < ranges.length) CSS.highlights.set(HIGHLIGHT_CURRENT, new Highlight(ranges[currentIndex]));
};

// 현재 일치가 화면 가운데쯤 오도록 스크롤한다.
export const scrollToMatch = (range) => {
  const el = range && range.startContainer && range.startContainer.parentElement;
  if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center', inline: 'nearest' });
};

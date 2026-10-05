// 파일 위치: src/pages/Editor/findMatches.js
// 기능 요약: 텍스트 안에서 검색어가 나오는 모든 위치를 찾는 순수 함수. state/ref를 안 건드리므로
// "바꾸기" 직후처럼 아직 rawText state에는 반영 안 됐지만 이미 알고 있는 새 문자열에도 곧바로
// 재사용할 수 있다(React 리렌더를 기다리는 stale closure 문제를 피한다).
export const findMatchesIn = (text, query) => {
  if (!query) return [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let startIndex = 0;
  const found = [];
  while ((startIndex = lowerText.indexOf(lowerQuery, startIndex)) > -1) {
    found.push({ start: startIndex, end: startIndex + query.length });
    startIndex += query.length;
  }
  return found;
};

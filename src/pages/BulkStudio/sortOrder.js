// 파일 위치: src/pages/BulkStudio/sortOrder.js
// 기능 요약: 일괄 관리 스튜디오에서 새로 추가/붙여넣는 행의 _sortOrderNum 시작값 계산.
//
// 새로 추가되는 행마다 _sortOrderNum이 전부 미설정 기본값(999)로 똑같이 들어가면, 저장할 때
// 여러 명을 Promise.allSettled로 동시에 POST하므로 서버 응답(=DB id 부여) 순서가 붙여넣은
// 순서와 무관하게 뒤섞이고, 작품 페이지는 sortOrder가 같으면 그 뒤섞인 순서로 보여주는 버그가
// 있었다. 붙여넣은/추가한 순서를 sortOrder 값 자체에 미리 못박아 두면 저장 완료 순서가 어떻든
// 항상 의도한 순서대로 정렬된다. 새 행은 (이 반환값 + 1, +2, ...)를 받는다.
export const getNextSortOrderBase = (currentRows) => {
  let max = 999;
  currentRows.forEach((r) => {
    if (typeof r._sortOrderNum === 'number' && r._sortOrderNum > max) max = r._sortOrderNum;
  });
  return max;
};

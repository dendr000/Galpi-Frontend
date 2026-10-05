// 파일 위치: src/domains/character/characterOrder.js
// 기능 요약: 캐릭터 카드 정렬에 쓰이는 값(sortOrder 계열)을 읽고 옮기는 순수 로직.
// 백엔드 Character 엔티티에는 sortOrder 컬럼이 없다 — 정렬 값은 전부 dynamicProperties(JSON)
// 안에 있다: dp.sortOrder(전체 기본값)와 dp._groupSortOrders[그룹명](그룹별 드래그 순서).

// 작품 페이지가 한 그룹 안에서 캐릭터를 정렬할 때 쓰는 키: 그룹 전용 순서 → 기본 순서 → 999.
export const getGroupSortOrder = (dp, groupKey) => dp._groupSortOrders?.[groupKey] ?? dp.sortOrder ?? 999;

// 캐릭터를 수정·저장할 때 새로 만드는 dp 객체에 원본 dynamicProperties의 이미지 위치와 정렬
// 값을 옮겨 담는다(안 옮기면 저장할 때마다 사라진다). dp를 직접 수정하고 그대로 반환한다.
export const carryOverCharacterSystemProps = (dp, originalChar) => {
  dp.cardImgX = originalChar.cardImgX !== undefined ? originalChar.cardImgX : 50;
  dp.cardImgY = originalChar.cardImgY !== undefined ? originalChar.cardImgY : 50;
  dp.cardImgScale = originalChar.cardImgScale !== undefined ? originalChar.cardImgScale : 1;
  if (originalChar._groupSortOrders) {
    dp._groupSortOrders = originalChar._groupSortOrders;
  }
  // _groupSortOrders만 옮기고 그 폴백인 dp.sortOrder를 안 옮기면 수정한 캐릭터만 sortOrder가
  // 999로 떨어져 목록 맨 앞으로 튀어 오른다(실제로 났던 버그).
  if (originalChar.sortOrder !== undefined) {
    dp.sortOrder = originalChar.sortOrder;
  }
  return dp;
};

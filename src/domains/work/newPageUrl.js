// Copyright (c) dendr000. MIT License.
// 새 하위 문서를 만드는 편집 화면 주소. parentId 가 없으면 작품 바로 아래(최상위) 문서가 된다.
export const newPageUrl = (workId, parentId) =>
  `/edit?type=page&action=new&workId=${workId}${parentId ? `&parentId=${parentId}` : ''}`;

// "같은 위치에" 만들 때 쓸 상위 문서 번호: 그 문서와 같은 상위 문서(최상위 문서면 없음).
export const siblingParentId = (page) => (page && page.parentId ? page.parentId : null);

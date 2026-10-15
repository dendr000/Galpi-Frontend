// Copyright (c) dendr000. MIT License.
// 파일 위치: src/pages/BulkStudio/columnMovePrompt.js
// 일괄 편집 표에서 속성(열) 이름을 눌렀을 때 "몇 번째로 옮길까요?"를 묻고 숫자로 돌려준다.
import { askText } from '../../utils/askText';

// index: 현재 위치(0부터), total: 전체 열 개수. 취소하거나 숫자가 아니면 null.
export const askColumnPosition = async (columnName, index, total) => {
  const answer = await askText(
    `"${columnName}"을(를) 몇 번째 속성으로 옮길까요? (현재 ${index + 1}번째, 2~${total}번째 중)`,
    String(index + 1),
  );
  if (answer === null || answer === undefined) return null;
  const n = parseInt(answer, 10);
  return Number.isNaN(n) ? null : n;
};

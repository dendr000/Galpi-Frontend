// Copyright (c) dendr000. MIT License.
// 작품 페이지 양옆 패널(왼쪽 문서 트리, 오른쪽 목차와 정보 상자)을 본문 옆에 붙일지 정하는 규칙.
// 창이 이 폭보다 좁으면 패널이 본문을 누르지 않도록 손잡이로 접힌다(반쪽 창 등).
// 1650px 이면 두 패널(각 260)과 영역 안쪽 여백(48), 본문 옆 정보 상자(340 + 간격 30)를 빼도 본문이 약 730px 남는다.
// (정보 상자는 장르 테마가 영역 안에서만 적용되므로 패널로 옮기지 않고 본문 옆에 둔다.)
export const DOCK_MIN_WIDTH = 1650;

export const getPanelState = ({ width, leftOpen = true, rightOpen = true } = {}) => {
  const canDock = Number(width) >= DOCK_MIN_WIDTH;
  return { canDock, leftDocked: canDock && !!leftOpen, rightDocked: canDock && !!rightOpen };
};

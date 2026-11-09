// Copyright (c) dendr000. MIT License.
// 화면(주소)별로 앱 틀(메뉴 바, 상단 바, 떠 있는 메뉴, 푸터)을 보일지 정한다. 순수 함수라 화면 없이 시험한다.

const FOCUS_PREFIXES = ['/edit', '/bulk', '/memo'];

// 편집기, 일괄 편집, 메모처럼 한 가지 작업에 집중하는 화면인지.
export const isFocusScreen = (pathname) => FOCUS_PREFIXES.some((prefix) => (pathname || '').startsWith(prefix));

export const getChromeVisibility = (pathname) => {
  const path = pathname || '';
  const isBulk = path.startsWith('/bulk');
  return {
    showMenuBar: true, // 모든 화면에 있다. 높이는 --app-menubar-h(28px)
    showGnb: !isFocusScreen(path), // 집중 화면은 자체 머리글이 있어 상단 바를 숨긴다
    showFab: !isBulk,
    showFooter: !isBulk,
  };
};

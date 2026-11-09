// Copyright (c) dendr000. MIT License.
// 상단 메뉴 바와 상단 바(Gnb)가 함께 쓰는 앱 동작. 같은 동작을 두 벌로 만들지 않으려고 한 곳에 둔다.
import api from '../../../api/axiosCore';
import { cycleWorkTheme, THEME_LABELS } from '../../../domains/work/genreTheme';

// 메뉴에서 화면 안쪽 상태를 건드려야 하는 동작(예: 작품 페이지의 내보내기 창 열기)을 알리는 window 이벤트 이름.
export const MENU_ACTION_EVENT = 'galpi-menu-action';

export const dispatchMenuAction = (type) => {
  window.dispatchEvent(new CustomEvent(MENU_ACTION_EVENT, { detail: { type } }));
};

export const isDarkMode = () => document.body.getAttribute('data-theme') === 'dark';

// 다크 모드를 바꾸고 이 PC 에 저장한다(저장이 막힌 환경에서도 이번 화면에는 적용한다).
export const toggleDarkMode = () => {
  const next = isDarkMode() ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  try {
    localStorage.setItem('wiki-theme', next);
  } catch {
    // 저장은 못 해도 지금 화면에는 적용했다
  }
};

// 이 작품의 분류에 어울리는 테마를 순서대로 순환시킨다(자동 -> 테마1 -> 테마2 -> ... -> 자동).
// 분류에 해당하는 테마가 하나도 없으면 안내만 하고 아무것도 바꾸지 않는다.
export const cycleThemeForWork = async (workId) => {
  if (!workId) return;
  const row = document.getElementById('galpi-theme-row');
  try {
    const { data: work } = await api.get(`/api/works/${workId}`);
    const result = await cycleWorkTheme(work);
    if (!result) {
      alert('이 작품 분류엔 아직 준비된 테마가 없어요.');
      return;
    }
    window.dispatchEvent(new CustomEvent('galpi-theme-cycled', { detail: { workId, ...result } }));
    if (row) {
      row.classList.remove('galpi-theme-pulse');
      void row.offsetWidth; // 리플로우 강제: 같은 클래스를 다시 붙여도 애니메이션이 재생되도록
      row.classList.add('galpi-theme-pulse');
    }
    console.log(`[테마] 순환: ${THEME_LABELS[result.theme] || result.theme}`);
  } catch (e) {
    console.error('[테마] 순환 실패', e);
  }
};

// exe(Electron)의 찾기 창(FindBar)은 Ctrl+F 키 입력으로 열리므로 같은 키 입력을 보내 연다.
export const openFindBar = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }));
};

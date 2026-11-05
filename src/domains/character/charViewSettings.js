// Copyright (c) dendr000. MIT License.
// 캐릭터 본문 보기 설정. 앱 전체에 하나만 두고 이 PC(localStorage)에 저장한다.
// - autoScroll: 그리드에서 카드를 선택하면 아래 본문으로 이동
// - dblClickModal: 카드를 더블클릭하면 큰 창으로 열기
export const CHAR_VIEW_KEY = 'galpi.charView';

const DEFAULTS = { autoScroll: true, dblClickModal: true };

// 저장소를 쓸 수 없거나 값이 깨졌어도 항상 완전한 설정 객체를 돌려준다.
export const getCharViewSettings = () => {
  let saved = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(CHAR_VIEW_KEY) || '{}');
    if (parsed && typeof parsed === 'object') saved = parsed;
  } catch (e) { /* 저장소 사용 불가, 깨진 JSON: 기본값 */ }
  const result = {};
  Object.keys(DEFAULTS).forEach((k) => {
    result[k] = typeof saved[k] === 'boolean' ? saved[k] : DEFAULTS[k];
  });
  return result;
};

// 바꿀 항목만 넘기면 나머지는 유지한다. 저장에 실패해도 화면은 멈추지 않는다.
export const setCharViewSettings = (patch) => {
  const next = { ...getCharViewSettings(), ...patch };
  try { localStorage.setItem(CHAR_VIEW_KEY, JSON.stringify(next)); } catch (e) { /* 저장 실패는 무시 */ }
  return next;
};

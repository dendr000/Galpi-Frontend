// Copyright (c) dendr000. MIT License.
// 파일 위치: src/utils/askText.js
// 글자 한 줄을 사용자에게 묻는 공용 함수. window.prompt() 는 Electron(exe)이 지원하지 않아
// 호출해도 아무 일도 안 일어나므로, 앱 안의 입력 모달(TextPromptModal)이 떠 있으면 그것을 쓴다.
// 모달이 아직 없는 환경(테스트 등)에서만 window.prompt 로 되돌아간다.
// 결과: 입력한 글자 / 취소하면 null (Promise).
export const askText = (message, defaultValue = '') => {
  if (typeof window.openTextPromptModal === 'function') {
    return window.openTextPromptModal(message, defaultValue);
  }
  return Promise.resolve(window.prompt(message, defaultValue));
};

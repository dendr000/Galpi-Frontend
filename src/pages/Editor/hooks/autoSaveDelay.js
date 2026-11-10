// Copyright (c) dendr000. MIT License.
// 환경 설정의 "자동 저장" 값을 편집기 자동 저장 지연(밀리초)으로 바꾼다. 순수 함수라 화면 없이 시험한다.
// 자동 저장은 끌 수 없다(저장 안 한 글을 잃지 않도록). 고를 수 있는 것은 입력이 멈춘 뒤 저장하기까지의 시간이다.

export const DEFAULT_AUTO_SAVE_SECONDS = 3;

// 설정 화면의 선택지. value 는 설정에 저장되는 문자열(초)이다.
export const AUTO_SAVE_OPTIONS = [
  { value: '3', label: '입력 후 3초 (기본)' },
  { value: '30', label: '입력 후 30초' },
  { value: '60', label: '입력 후 1분' },
];

// 양수가 아니거나 숫자가 아닌 값(옛 설정의 "0" 포함)은 기본값으로 본다.
export const getAutoSaveDelayMs = (setting) => {
  const seconds = Number(setting);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_AUTO_SAVE_SECONDS * 1000;
};

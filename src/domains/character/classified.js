// Copyright (c) dendr000. MIT License.
// 캐릭터의 기밀 여부 판정. `기밀` 속성에 값이 있으면 기밀이고, 아니오 계열 값이면 기밀이 아니다.
import { getPropValue } from './characterSort';

const NO_VALUES = new Set(['아니오', '아니요', '아님', 'n', 'no', 'false', '0', 'x', '없음', '해제']);

export const isClassified = (char) => {
  const v = getPropValue(char, '기밀').toLowerCase();
  return v !== '' && !NO_VALUES.has(v);
};

// 기밀 기능을 쓰지 않는 호출자(또는 테스트)를 위한 기본값: 아무것도 기밀이 아니고 아무것도 가려지지 않는다.
export const NO_CLASSIFIED = {
  has: false, mask: false, setMask: () => {}, reveal: () => {},
  isClassified: () => false, isConcealed: () => false,
};

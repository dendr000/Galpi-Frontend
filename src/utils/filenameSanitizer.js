// 파일 위치: src/utils/filenameSanitizer.js
// 기능 요약: 작품명/캐릭터명을 이미지 파일명으로 쓸 때, Windows에서 파일명에 못 쓰는 문자(? : * " < > | \ /)를
// 생김새가 거의 같은 전각(全角) 유니코드 문자로 바꿔준다. 제목은 원래 문자(반각) 그대로 두고 싶고,
// 실제 이미지 파일은 반각 특수문자를 못 쓰니 파일명을 만들 때만 이 함수를 거치면 된다 — 예를 들어
// 작품명이 "이건 사랑일까?"라면 표지 이미지 파일명은 "이건 사랑일까？.png"(전각 물음표)로 저장하면 된다.
const ILLEGAL_CHAR_MAP = {
  '?': '？', ':': '：', '*': '＊', '"': '＂',
  '<': '＜', '>': '＞', '|': '｜', '\\': '＼', '/': '／',
};
const ILLEGAL_CHAR_PATTERN = /[?:*"<>|\\/]/g;

export const sanitizeFilenameTitle = (str) =>
  (str || '').replace(ILLEGAL_CHAR_PATTERN, (ch) => ILLEGAL_CHAR_MAP[ch]);

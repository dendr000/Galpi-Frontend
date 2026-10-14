// Copyright (c) dendr000. MIT License.
// 파일 위치: src/domains/memo/shared/utils/newMemoTemplate.js
// 새 메모를 만들 때 폴더에 따라 본문에 미리 채워 둘 내용을 정하는 순수 함수.
import { buildFoldBoxHtml, BLANK_LINE_HTML } from './foldBoxHtml';

export const USER_NOTE_FOLDER = '유저노트';

// 폴더 경로의 마지막 이름이 '유저노트' 인 폴더(최상위든 다른 폴더 밑이든)를 유저노트 폴더로 본다.
// '유저노트/하위' 처럼 그 안의 하위 폴더나 이름이 비슷한 폴더는 해당하지 않는다.
export const isUserNoteFolder = (folder) =>
  String(folder || '').split('/').pop().trim() === USER_NOTE_FOLDER;

// 유저노트 폴더의 새 메모 본문: 접기 박스 '대화 프로필', 접기 박스 '유저노트', 빈 줄 순서.
export const buildUserNoteContent = () =>
  buildFoldBoxHtml('대화 프로필') + buildFoldBoxHtml(USER_NOTE_FOLDER) + BLANK_LINE_HTML;

// 새 메모의 초기 본문. 해당하는 규칙이 없는 폴더는 기존처럼 빈 문자열.
export const getNewMemoContent = (folder) => (isUserNoteFolder(folder) ? buildUserNoteContent() : '');

// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { isUserNoteFolder, buildUserNoteContent, getNewMemoContent } from './newMemoTemplate';

describe('isUserNoteFolder', () => {
  it('이름이 유저노트인 폴더만 해당한다', () => {
    expect(isUserNoteFolder('유저노트')).toBe(true);
    expect(isUserNoteFolder('채팅/유저노트')).toBe(true);
  });

  it('다른 폴더와 유저노트의 하위 폴더는 해당하지 않는다', () => {
    expect(isUserNoteFolder('기타')).toBe(false);
    expect(isUserNoteFolder('유저노트/하위')).toBe(false);
    expect(isUserNoteFolder('유저노트2')).toBe(false);
    expect(isUserNoteFolder('내유저노트')).toBe(false);
  });

  it('비어 있거나 없는 값은 해당하지 않는다', () => {
    expect(isUserNoteFolder('')).toBe(false);
    expect(isUserNoteFolder(undefined)).toBe(false);
    expect(isUserNoteFolder(null)).toBe(false);
  });
});

describe('buildUserNoteContent', () => {
  const root = document.createElement('div');
  root.innerHTML = buildUserNoteContent();
  const titles = [...root.querySelectorAll('.fold-title')].map((el) => el.textContent);

  it('첫 줄은 대화 프로필, 둘째 줄은 유저노트 접기 박스다', () => {
    expect(titles).toEqual(['대화 프로필', '유저노트']);
  });

  it('접기 박스 바로 뒤, 셋째 줄에 빈 줄이 있다', () => {
    const rows = [...root.children];
    expect(rows).toHaveLength(3);
    expect(rows[0].querySelector('.fold-title').textContent).toBe('대화 프로필');
    expect(rows[1].querySelector('.fold-title').textContent).toBe('유저노트');
    expect(rows[2].outerHTML).toBe('<div><br></div>');
  });
});

describe('getNewMemoContent', () => {
  it('유저노트 폴더면 자동 내용을 돌려준다', () => {
    expect(getNewMemoContent('유저노트')).toBe(buildUserNoteContent());
  });

  it('다른 폴더면 빈 문자열이다', () => {
    expect(getNewMemoContent('기타')).toBe('');
    expect(getNewMemoContent('웹툰/작품')).toBe('');
    expect(getNewMemoContent(undefined)).toBe('');
  });
});

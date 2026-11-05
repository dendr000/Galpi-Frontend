// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { searchChars, getCharThemeColor } from './charSearch';

const chars = [
  { id: 1, name: '카시안 드레이크' },
  { id: 2, name: '이벨린 로엔' },
  { id: 3, name: '세라 레오니드' },
  { id: 4, name: '레온' },
];

describe('searchChars', () => {
  it('이름에 검색어가 들어 있는 캐릭터를 돌려준다', () => {
    expect(searchChars(chars, '로엔').map((c) => c.id)).toEqual([2]);
  });

  it('이름이 검색어로 시작하는 것을 먼저, 나머지는 원래 순서대로 보여 준다', () => {
    expect(searchChars(chars, '레').map((c) => c.id)).toEqual([4, 1, 3]);
  });

  it('영문 대소문자를 구분하지 않는다', () => {
    expect(searchChars([{ id: 1, name: 'Leon' }], 'LEO').map((c) => c.id)).toEqual([1]);
  });

  it('앞뒤 공백은 무시하고, 가운데 공백은 이름과 똑같이 맞춰 본다', () => {
    expect(searchChars(chars, '  레온 ').map((c) => c.id)).toEqual([4]);
    expect(searchChars(chars, '세라 레').map((c) => c.id)).toEqual([3]);
  });

  it('검색어가 비어 있으면 아무것도 돌려주지 않는다', () => {
    expect(searchChars(chars, '')).toEqual([]);
    expect(searchChars(chars, '   ')).toEqual([]);
    expect(searchChars(chars, undefined)).toEqual([]);
  });

  it('개수를 제한할 수 있다', () => {
    expect(searchChars(chars, '레', 2)).toHaveLength(2);
  });

  it('일치하는 것이 없거나 목록이 없어도 오류 없이 빈 배열', () => {
    expect(searchChars(chars, '없는이름')).toEqual([]);
    expect(searchChars(undefined, '레')).toEqual([]);
    expect(searchChars([{ id: 9 }], '레')).toEqual([]);
  });
});

describe('getCharThemeColor', () => {
  it('저장된 속성(JSON)의 테마 색을 우선 쓴다', () => {
    expect(getCharThemeColor({ themeColor: '#111111', dynamicProperties: '{"themeColor":"#222222"}' })).toBe('#222222');
  });

  it('두 번 감싸인 JSON 문자열도 읽는다', () => {
    expect(getCharThemeColor({ dynamicProperties: JSON.stringify(JSON.stringify({ themeColor: '#333333' })) })).toBe('#333333');
  });

  it('속성에 없으면 캐릭터의 themeColor, 그것도 없으면 기본 색', () => {
    expect(getCharThemeColor({ themeColor: '#444444' })).toBe('#444444');
    expect(getCharThemeColor({})).toBe('var(--primary-color)');
  });

  it('JSON 이 깨져 있어도 오류 없이 기본 색', () => {
    expect(getCharThemeColor({ dynamicProperties: '{깨짐' })).toBe('var(--primary-color)');
  });
});

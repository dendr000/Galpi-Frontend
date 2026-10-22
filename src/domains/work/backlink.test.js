// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { normalizeName, findCharacterTarget, findWorkTarget } from './backlink';

const ch = (id, name, dp) => ({ id, name, dynamicProperties: dp ? JSON.stringify(dp) : undefined });

describe('normalizeName', () => {
  it('공백을 모두 지우고 소문자로 바꾼다', () => {
    expect(normalizeName('  레온 폰  아인하르트 ')).toBe('레온폰아인하르트');
    expect(normalizeName('Lian')).toBe('lian');
  });
  it('값이 없으면 빈 문자열', () => {
    expect(normalizeName(undefined)).toBe('');
    expect(normalizeName(null)).toBe('');
  });
});

describe('findCharacterTarget', () => {
  const chars = [ch(1, '릴리'), ch(2, '레온 폰 아인하르트'), ch(3, '숨은 인물', { _isHidden: true })];

  it('이름이 같으면(공백, 대소문자 무시) 그 캐릭터를 찾는다', () => {
    expect(findCharacterTarget(chars, {}, '레온폰아인하르트')).toEqual({ baseId: 2, activeId: 2 });
  });
  it('부분 일치는 찾지 않는다', () => {
    expect(findCharacterTarget(chars, {}, '레온')).toBeNull();
  });
  it('숨김 캐릭터는 카드가 없으므로 찾지 않는다', () => {
    expect(findCharacterTarget(chars, {}, '숨은 인물')).toBeNull();
  });
  it('폼 스왑 중이면 화면에 보이는 쪽 id 를 선택 대상으로 돌려주고, 카드는 본체 id 로 찾는다', () => {
    const withAlt = [ch(1, '본체'), ch(9, '서브폼')];
    expect(findCharacterTarget(withAlt, { 1: 9 }, '서브폼')).toEqual({ baseId: 1, activeId: 9 });
    expect(findCharacterTarget(withAlt, { 1: 9 }, '본체')).toEqual({ baseId: 1, activeId: 9 });
  });
  it('빈 키워드나 빈 목록이면 null', () => {
    expect(findCharacterTarget(chars, {}, '  ')).toBeNull();
    expect(findCharacterTarget([], {}, '릴리')).toBeNull();
    expect(findCharacterTarget(undefined, {}, '릴리')).toBeNull();
  });
  it('깨진 속성 JSON 이어도 보이는 캐릭터로 취급한다', () => {
    const broken = [{ id: 5, name: '깨짐', dynamicProperties: '{not json' }];
    expect(findCharacterTarget(broken, {}, '깨짐')).toEqual({ baseId: 5, activeId: 5 });
  });
});

describe('findWorkTarget', () => {
  const works = [
    { id: 10, title: '아르카디아 연대기' },
    { id: 11, title: '현재 작품' },
  ];
  it('제목이 같으면(공백 무시) 작품을 찾는다', () => {
    expect(findWorkTarget(works, '아르카디아연대기', 11)).toEqual(works[0]);
  });
  it('지금 보고 있는 작품 자신은 제외한다', () => {
    expect(findWorkTarget(works, '현재 작품', 11)).toBeNull();
  });
  it('없으면 null', () => {
    expect(findWorkTarget(works, '없는 작품', 11)).toBeNull();
    expect(findWorkTarget(undefined, '아무', 11)).toBeNull();
  });
});

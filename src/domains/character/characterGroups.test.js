// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { getVisibleCharacters, buildCharacterGroups, getGroupOrderArray } from './characterGroups';

const dp = (obj) => JSON.stringify(obj);
const ch = (id, over = {}) => ({ id, name: `c${id}`, 관계: '일반', ...over });
const ids = (list) => list.map((c) => c.id);

describe('getVisibleCharacters', () => {
  it('숨김 캐릭터를 뺀 목록(baseChars)과 폼 스왑을 반영한 보이는 목록(displayChars)을 돌려준다', () => {
    const chars = [ch(1), ch(2, { dynamicProperties: dp({ _isHidden: true }) }), ch(3)];
    const { baseChars, displayChars } = getVisibleCharacters(chars, {});
    expect(ids(baseChars)).toEqual([1, 3]);
    expect(displayChars.map((c) => [c.id, c._baseCharId])).toEqual([[1, 1], [3, 3]]);
  });

  it('폼 스왑이 있으면 그 캐릭터 자리에 서브폼을 보여 주되 _baseCharId 는 본체 id', () => {
    const chars = [ch(1), ch(9, { name: '서브폼', dynamicProperties: dp({ _isHidden: true }) })];
    const { displayChars } = getVisibleCharacters(chars, { 1: 9 });
    expect(displayChars).toHaveLength(1);
    expect(displayChars[0]).toMatchObject({ id: 9, name: '서브폼', _baseCharId: 1 });
  });

  it('스왑 대상이 없으면 본체 그대로', () => {
    const { displayChars } = getVisibleCharacters([ch(1)], { 1: 99 });
    expect(displayChars[0]).toMatchObject({ id: 1, _baseCharId: 1 });
  });

  it('속성 JSON 이 깨진 캐릭터는 보이는 것으로 취급한다', () => {
    const { baseChars } = getVisibleCharacters([ch(1, { dynamicProperties: '{깨짐' })], {});
    expect(ids(baseChars)).toEqual([1]);
  });

  it('목록이 없으면 빈 배열', () => {
    expect(getVisibleCharacters(undefined, {})).toEqual({ baseChars: [], displayChars: [] });
  });
});

describe('buildCharacterGroups', () => {
  const build = (chars, over = {}) => {
    const { displayChars } = getVisibleCharacters(chars, {});
    return buildCharacterGroups({
      chars: displayChars, allCharacters: chars, groupCriteria: '관계', groupOrderArray: [], sortKey: '', sortDir: 'asc', ...over,
    });
  };

  it('분류 속성 값으로 묶는다. 쉼표로 여러 값이면 여러 그룹에 들어간다', () => {
    const { groupedChars } = build([ch(1, { 소속: '북부, 사교' }), ch(2, { 소속: '북부' })], { groupCriteria: '소속' });
    expect(ids(groupedChars['북부'])).toEqual([1, 2]);
    expect(ids(groupedChars['사교'])).toEqual([1]);
  });

  it('값이 없거나 *로만 된 캐릭터는 "미분류"', () => {
    const { groupedChars } = build([ch(1, { 소속: '' }), ch(2, { 소속: '*비밀' })], { groupCriteria: '소속' });
    expect(ids(groupedChars['미분류'])).toEqual([1, 2]);
  });

  it('그룹 순서: 설정한 순서가 먼저, 없는 그룹은 뒤에 원래 순서대로', () => {
    const chars = [ch(1, { 관계: '일반' }), ch(2, { 관계: '친구' }), ch(3, { 관계: '연인' }), ch(4, { 관계: '기타' })];
    const { sortedGroupNames } = build(chars, { groupOrderArray: ['연인', '친구', '일반'] });
    expect(sortedGroupNames).toEqual(['연인', '친구', '일반', '기타']);
  });

  it('그룹 안 수동 순서는 드래그로 정한 그룹 전용 순서, 없으면 기본 순서, 없으면 999 로 정한다', () => {
    const chars = [
      ch(1, { dynamicProperties: dp({ _groupSortOrders: { 일반: 3 } }) }),
      ch(2, { dynamicProperties: dp({ _groupSortOrders: { 일반: 1 } }) }),
      ch(3, { dynamicProperties: dp({ sortOrder: 2 }) }),
      ch(4),
    ];
    expect(ids(build(chars).groupedChars['일반'])).toEqual([2, 3, 1, 4]);
  });

  it('속성 정렬을 고르면 수동 순서 위에 속성값 순서를 덮어쓴다', () => {
    const chars = [ch(1, { 서열: '3' }), ch(2, { 서열: '1' }), ch(3, { 서열: '2' })];
    expect(ids(build(chars, { sortKey: '서열', sortDir: 'asc' }).groupedChars['일반'])).toEqual([2, 3, 1]);
    expect(ids(build(chars, { sortKey: '서열', sortDir: 'desc' }).groupedChars['일반'])).toEqual([1, 3, 2]);
  });

  it('캐릭터가 없으면 빈 결과', () => {
    expect(build([])).toEqual({ groupedChars: {}, sortedGroupNames: [] });
  });
});

describe('getGroupOrderArray', () => {
  it('작품이 정한 그룹 순서(_groupOrder)를 우선한다', () => {
    expect(getGroupOrderArray({ _groupOrder: { 관계: ['친구', '연인'] } }, '관계')).toEqual(['친구', '연인']);
  });
  it('없으면 "관계"는 연인, 친구, 일반이 기본값', () => {
    expect(getGroupOrderArray({}, '관계')).toEqual(['연인', '친구', '일반']);
    expect(getGroupOrderArray(undefined, '관계')).toEqual(['연인', '친구', '일반']);
  });
  it('다른 분류 기준은 기본 순서가 없다', () => {
    expect(getGroupOrderArray({}, '소속')).toEqual([]);
  });
});

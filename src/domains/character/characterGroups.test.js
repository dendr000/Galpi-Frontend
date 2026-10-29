// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { getVisibleCharacters, buildCharacterGroups, getGroupOrderArray, getMultiGroupMode, applyMultiGroupMeta, getGroupTags, getGroupCriteriaOptions } from './characterGroups';

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

  describe('여러 값일 때 어느 그룹에 넣을지(multiGroupMode)', () => {
    const chars = [ch(1, { 소속: 'A, B, C' }), ch(2, { 소속: 'B' }), ch(3, { 소속: '*비밀, D, E' })];
    const names = (mode) => build(chars, { groupCriteria: '소속', multiGroupMode: mode });

    it('all(기본)은 값마다 그룹에 넣는다', () => {
      const { groupedChars } = names('all');
      expect(ids(groupedChars['A'])).toEqual([1]);
      expect(ids(groupedChars['C'])).toEqual([1]);
      expect(ids(groupedChars['E'])).toEqual([3]);
      expect(build(chars, { groupCriteria: '소속' }).sortedGroupNames).toEqual(names('all').sortedGroupNames);
    });

    it('first 는 첫 번째 값의 그룹에만 넣는다', () => {
      const { groupedChars, sortedGroupNames } = names('first');
      expect([...sortedGroupNames].sort()).toEqual(['A', 'B', 'D']);
      expect(ids(groupedChars['A'])).toEqual([1]);
      expect(ids(groupedChars['B'])).toEqual([2]);
    });

    it('last 는 마지막 값의 그룹에만 넣는다', () => {
      const { groupedChars, sortedGroupNames } = names('last');
      expect([...sortedGroupNames].sort()).toEqual(['B', 'C', 'E']);
      expect(ids(groupedChars['C'])).toEqual([1]);
      expect(ids(groupedChars['B'])).toEqual([2]);
    });

    it('*로 시작하는 값은 첫 번째, 마지막을 셀 때도 빼고 센다', () => {
      expect(Object.keys(names('first').groupedChars)).toContain('D');
      expect(Object.keys(names('first').groupedChars)).not.toContain('비밀');
      expect(Object.keys(names('last').groupedChars)).not.toContain('D');
    });

    it('값이 하나뿐이거나 없는 캐릭터는 모드와 상관없이 그대로', () => {
      const one = [ch(1, { 소속: 'A' }), ch(2, { 소속: '' }), ch(3, { 소속: '*x' })];
      for (const mode of ['first', 'last']) {
        const { groupedChars } = build(one, { groupCriteria: '소속', multiGroupMode: mode });
        expect(ids(groupedChars['A'])).toEqual([1]);
        expect(ids(groupedChars['미분류'])).toEqual([2, 3]);
      }
    });

    it('알 수 없는 모드는 all 처럼 동작한다', () => {
      expect(Object.keys(names('뭔가').groupedChars).sort()).toEqual(Object.keys(names('all').groupedChars).sort());
    });
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

describe('getMultiGroupMode', () => {
  it('작품 메타의 값이 유효하면 그대로, 아니면 all', () => {
    expect(getMultiGroupMode({ multiGroup: 'first' })).toBe('first');
    expect(getMultiGroupMode({ multiGroup: 'last' })).toBe('last');
    expect(getMultiGroupMode({ multiGroup: 'all' })).toBe('all');
    expect(getMultiGroupMode({ multiGroup: 'x' })).toBe('all');
    expect(getMultiGroupMode({})).toBe('all');
    expect(getMultiGroupMode(undefined)).toBe('all');
  });
});

describe('applyMultiGroupMeta', () => {
  it('first, last 는 메타에 넣고, all 이거나 비면 메타에서 지운다. 원본은 바꾸지 않는다', () => {
    const base = { keep: 1, multiGroup: 'last' };
    expect(applyMultiGroupMeta(base, { multiGroupMode: 'first' })).toEqual({ keep: 1, multiGroup: 'first' });
    expect(applyMultiGroupMeta({ keep: 1 }, { multiGroupMode: 'last' })).toEqual({ keep: 1, multiGroup: 'last' });
    expect(applyMultiGroupMeta(base, { multiGroupMode: 'all' })).toEqual({ keep: 1 });
    expect(applyMultiGroupMeta(base, {})).toEqual({ keep: 1 });
    expect(applyMultiGroupMeta(base, { multiGroupMode: 'x' })).toEqual({ keep: 1 });
    expect(base).toEqual({ keep: 1, multiGroup: 'last' });
  });
});

describe('getGroupTags', () => {
  it('쉼표로 나눈 값을 돌려주고 *로 시작하는 값은 뺀다', () => {
    expect(getGroupTags({ 소속: '북부, *비밀, 사교' }, '소속')).toEqual(['북부', '사교']);
  });
  it('값이 없거나 *뿐이면 미분류', () => {
    expect(getGroupTags({}, '소속')).toEqual(['미분류']);
    expect(getGroupTags({ 소속: '*x' }, '소속')).toEqual(['미분류']);
  });
  it('first, last 는 첫 번째, 마지막 값 하나만', () => {
    expect(getGroupTags({ 소속: 'A, B, C' }, '소속', 'first')).toEqual(['A']);
    expect(getGroupTags({ 소속: 'A, B, C' }, '소속', 'last')).toEqual(['C']);
  });
  it('나이, 성별, 종족처럼 전용 필드에 든 기본 항목도 읽는다', () => {
    expect(getGroupTags({ age: '20' }, '나이')).toEqual(['20']);
    expect(getGroupTags({ gender: '여성' }, '성별')).toEqual(['여성']);
    expect(getGroupTags({ species: '엘프' }, '종족')).toEqual(['엘프']);
  });
});

describe('getGroupCriteriaOptions', () => {
  const labels = (opts) => opts.map((o) => o.label);
  const values = (opts) => opts.map((o) => o.value);

  it('기본 다섯 개(관계, 소속, 등급, 종족, 성별)는 속성이 없어도 항상 맨 앞에 있다', () => {
    const opts = getGroupCriteriaOptions([]);
    expect(values(opts)).toEqual(['관계', '소속', '등급', '종족', '성별']);
    expect(labels(opts)).toEqual(['관계별', '소속별', '등급별', '종족별', '성별별']);
  });

  it('작품 페이지에 있는 다른 속성은 전부 뒤에 "속성별"로 붙는다(처음 나온 순서)', () => {
    const opts = getGroupCriteriaOptions(['소속', '서열', '나이', '직책', '성별']);
    expect(values(opts)).toEqual(['관계', '소속', '등급', '종족', '성별', '서열', '나이', '직책']);
    expect(labels(opts).slice(5)).toEqual(['서열별', '나이별', '직책별']);
  });

  it('같은 속성은 한 번만 나온다', () => {
    const opts = getGroupCriteriaOptions(['소속', '소속', '직책', '직책']);
    expect(values(opts).filter((v) => v === '소속')).toHaveLength(1);
    expect(values(opts).filter((v) => v === '직책')).toHaveLength(1);
  });

  it('저장해 둔 분류 기준이 지금 없는 속성이어도 목록에 남겨 선택이 비지 않게 한다', () => {
    const opts = getGroupCriteriaOptions(['직책'], '사라진속성');
    expect(values(opts)).toContain('사라진속성');
    expect(getGroupCriteriaOptions(['직책'], '직책').filter((o) => o.value === '직책')).toHaveLength(1);
  });

  it('목록이 없어도(undefined) 오류 없이 기본 다섯 개', () => {
    expect(values(getGroupCriteriaOptions(undefined))).toEqual(['관계', '소속', '등급', '종족', '성별']);
  });
});

describe('buildCharacterGroups 임의의 속성으로 묶기', () => {
  it('직책 같은 사용자 속성으로도 묶는다', () => {
    const chars = [ch(1, { 직책: '기사' }), ch(2, { 직책: '마법사' }), ch(3, { 직책: '기사' })];
    const { displayChars } = getVisibleCharacters(chars, {});
    const { groupedChars } = buildCharacterGroups({ chars: displayChars, allCharacters: chars, groupCriteria: '직책', groupOrderArray: [], sortKey: '', sortDir: 'asc' });
    expect(ids(groupedChars['기사'])).toEqual([1, 3]);
    expect(ids(groupedChars['마법사'])).toEqual([2]);
  });

  it('나이처럼 전용 필드(age)에 든 값으로도 묶는다', () => {
    const chars = [{ id: 1, name: 'a', age: '20' }, { id: 2, name: 'b', age: '30' }, { id: 3, name: 'c', age: '20' }];
    const { displayChars } = getVisibleCharacters(chars, {});
    const { groupedChars } = buildCharacterGroups({ chars: displayChars, allCharacters: chars, groupCriteria: '나이', groupOrderArray: [], sortKey: '', sortDir: 'asc' });
    expect(ids(groupedChars['20'])).toEqual([1, 3]);
    expect(ids(groupedChars['30'])).toEqual([2]);
  });
});

// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { collectFilterGroups, filterChars, toggleFilterValue, hasActiveFilter } from './characterFilter';

const c = (id, props = {}) => ({ id, name: `c${id}`, ...props });
const ids = (list) => list.map((x) => x.id);

describe('collectFilterGroups', () => {
  const chars = [
    c(1, { 소속: '북부, 사교', 등급: 'S급' }),
    c(2, { 소속: '북부', 등급: 'A급' }),
    c(3, { 소속: '남부 , *비밀결사', 등급: 'S급' }),
    c(4, {}),
  ];

  it('소속과 등급 그룹을 처음 나온 순서로, 값마다 인원 수와 함께 모은다', () => {
    expect(collectFilterGroups(chars)).toEqual([
      { key: '소속', options: [{ value: '북부', count: 2 }, { value: '사교', count: 1 }, { value: '남부', count: 1 }] },
      { key: '등급', options: [{ value: 'S급', count: 2 }, { value: 'A급', count: 1 }] },
    ]);
  });

  it('*로 시작하는 값은 칩으로 만들지 않는다', () => {
    const names = collectFilterGroups(chars)[0].options.map((o) => o.value);
    expect(names).not.toContain('비밀결사');
  });

  it('대소문자(와 공백)만 다른 값은 같은 칩으로 세고 처음 쓴 표기를 보여 준다. 글자가 다르면 별개 칩이다', () => {
    const g = collectFilterGroups([c(1, { 소속: 'R.S.A.C.' }), c(2, { 소속: 'r.s.a.c.' }), c(3, { 소속: 'R S A C' })]);
    expect(g[0].options).toEqual([{ value: 'R.S.A.C.', count: 2 }, { value: 'R S A C', count: 1 }]);
  });

  it('값이 하나도 없는 그룹은 만들지 않는다', () => {
    expect(collectFilterGroups([c(1, { 소속: '북부' })]).map((g) => g.key)).toEqual(['소속']);
    expect(collectFilterGroups([c(1)])).toEqual([]);
    expect(collectFilterGroups(undefined)).toEqual([]);
  });

  it('한 캐릭터의 같은 소속 값이 겹쳐 써도 한 번만 센다', () => {
    expect(collectFilterGroups([c(1, { 소속: '북부, 북부' })])[0].options).toEqual([{ value: '북부', count: 1 }]);
  });
});

describe('filterChars', () => {
  const chars = [
    c(1, { 소속: '북부, 사교', 등급: 'S급' }),
    c(2, { 소속: '북부', 등급: 'A급' }),
    c(3, { 소속: '남부', 등급: 'S급' }),
    c(4, {}),
  ];

  it('선택이 없으면 전부 돌려준다', () => {
    expect(ids(filterChars(chars, {}))).toEqual([1, 2, 3, 4]);
    expect(ids(filterChars(chars, { 소속: [] }))).toEqual([1, 2, 3, 4]);
    expect(ids(filterChars(chars, undefined))).toEqual([1, 2, 3, 4]);
  });

  it('같은 그룹 안에서는 하나라도 맞으면 통과한다(OR)', () => {
    expect(ids(filterChars(chars, { 소속: ['사교', '남부'] }))).toEqual([1, 3]);
  });

  it('다른 그룹끼리는 모두 맞아야 통과한다(AND)', () => {
    expect(ids(filterChars(chars, { 소속: ['북부'], 등급: ['S급'] }))).toEqual([1]);
  });

  it('값 비교는 공백과 대소문자를 무시한다', () => {
    expect(ids(filterChars([c(1, { 소속: 'R.S.A.C.' })], { 소속: ['r s a c'] }))).toEqual([]);
    expect(ids(filterChars([c(1, { 소속: 'R.S.A.C.' })], { 소속: ['r.s.a.c.'] }))).toEqual([1]);
  });

  it('값이 없는 캐릭터는 그 그룹을 선택하면 빠진다', () => {
    expect(ids(filterChars(chars, { 등급: ['S급'] }))).toEqual([1, 3]);
  });

  it('*로 시작하는 소속은 매칭하지 않는다', () => {
    expect(ids(filterChars([c(1, { 소속: '*비밀결사' })], { 소속: ['비밀결사'] }))).toEqual([]);
  });

  it('원본 배열을 바꾸지 않는다', () => {
    const copy = [...chars];
    filterChars(chars, { 소속: ['북부'] });
    expect(chars).toEqual(copy);
  });
});

describe('toggleFilterValue', () => {
  it('없던 값을 추가하고, 있던 값은 뺀다', () => {
    expect(toggleFilterValue({}, '소속', '북부')).toEqual({ 소속: ['북부'] });
    expect(toggleFilterValue({ 소속: ['북부'] }, '소속', '남부')).toEqual({ 소속: ['북부', '남부'] });
    expect(toggleFilterValue({ 소속: ['북부', '남부'] }, '소속', '북부')).toEqual({ 소속: ['남부'] });
  });
  it('마지막 값을 빼면 그 그룹 항목 자체를 지운다', () => {
    expect(toggleFilterValue({ 소속: ['북부'], 등급: ['S급'] }, '소속', '북부')).toEqual({ 등급: ['S급'] });
  });
  it('원본을 바꾸지 않는다', () => {
    const sel = { 소속: ['북부'] };
    toggleFilterValue(sel, '소속', '남부');
    expect(sel).toEqual({ 소속: ['북부'] });
  });
});

describe('hasActiveFilter', () => {
  it('선택된 값이 하나라도 있으면 true', () => {
    expect(hasActiveFilter({ 소속: ['북부'] })).toBe(true);
    expect(hasActiveFilter({})).toBe(false);
    expect(hasActiveFilter({ 소속: [] })).toBe(false);
    expect(hasActiveFilter(undefined)).toBe(false);
  });
});

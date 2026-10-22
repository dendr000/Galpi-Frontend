// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { getPropValue, collectSortKeys, sortCharsByProperty } from './characterSort';

const c = (id, props = {}) => ({ id, name: `c${id}`, ...props });
const ids = (list) => list.map((x) => x.id);

describe('getPropValue', () => {
  it('기본 항목 이름은 해당 필드에서 읽는다', () => {
    expect(getPropValue(c(1, { age: '22세' }), '나이')).toBe('22세');
    expect(getPropValue(c(1, { gender: '여성' }), '성별')).toBe('여성');
    expect(getPropValue(c(1, { species: '인간' }), '종족')).toBe('인간');
    expect(getPropValue(c(1, { birthday: '3월 1일' }), '생일')).toBe('3월 1일');
  });
  it('그 밖의 항목은 같은 이름의 필드에서 읽는다', () => {
    expect(getPropValue(c(1, { 서열: '4' }), '서열')).toBe('4');
  });
  it('없으면 빈 문자열', () => {
    expect(getPropValue(c(1), '서열')).toBe('');
    expect(getPropValue(c(1, { 서열: null }), '서열')).toBe('');
  });
});

describe('collectSortKeys', () => {
  it('캐릭터들의 속성 순서 목록을 합쳐 처음 나온 순서로 돌려준다', () => {
    const chars = [c(1, { _propOrder: ['나이', '서열'], age: '20세', 서열: '1' }), c(2, { _propOrder: ['서열', '직책'], 서열: '2', 직책: 'x' })];
    expect(collectSortKeys(chars)).toEqual(['나이', '서열', '직책']);
  });
  it('값이 하나도 없는 속성과 시스템용(_로 시작) 이름은 뺀다', () => {
    const chars = [c(1, { _propOrder: ['나이', '빈속성', '_내부'], age: '20세' })];
    expect(collectSortKeys(chars)).toEqual(['나이']);
  });
  it('속성 순서 목록이 없거나 깨져도 빈 배열', () => {
    expect(collectSortKeys([c(1), c(2, { _propOrder: 'x' })])).toEqual([]);
    expect(collectSortKeys(undefined)).toEqual([]);
  });
});

describe('sortCharsByProperty', () => {
  it('숫자가 든 값은 숫자로 비교한다("10"이 "9"보다 뒤)', () => {
    const list = [c(1, { 서열: '10' }), c(2, { 서열: '9' }), c(3, { 서열: '1' })];
    expect(ids(sortCharsByProperty(list, '서열', 'asc'))).toEqual([3, 2, 1]);
  });
  it('"4서클", "22세" 같은 글자 섞인 값도 처음 나오는 숫자로 비교한다', () => {
    const list = [c(1, { 위계: '6서클(신성)' }), c(2, { 위계: '5서클' }), c(3, { 위계: '10서클' })];
    expect(ids(sortCharsByProperty(list, '위계', 'asc'))).toEqual([2, 1, 3]);
  });
  it('숫자가 없으면 가나다순', () => {
    const list = [c(1, { 직책: '황후' }), c(2, { 직책: '궁정' }), c(3, { 직책: '나라' })];
    expect(ids(sortCharsByProperty(list, '직책', 'asc'))).toEqual([2, 3, 1]);
  });
  it('내림차순은 뒤집는다', () => {
    const list = [c(1, { 서열: '1' }), c(2, { 서열: '3' }), c(3, { 서열: '2' })];
    expect(ids(sortCharsByProperty(list, '서열', 'desc'))).toEqual([2, 3, 1]);
  });
  it('값이 없는 캐릭터는 오름차순이든 내림차순이든 맨 뒤', () => {
    const list = [c(1), c(2, { 서열: '2' }), c(3, { 서열: '1' })];
    expect(ids(sortCharsByProperty(list, '서열', 'asc'))).toEqual([3, 2, 1]);
    expect(ids(sortCharsByProperty(list, '서열', 'desc'))).toEqual([2, 3, 1]);
  });
  it('값이 같으면 원래 순서를 유지한다(수동 순서 보존)', () => {
    const list = [c(1, { 서열: '2' }), c(2, { 서열: '2' }), c(3, { 서열: '2' })];
    expect(ids(sortCharsByProperty(list, '서열', 'asc'))).toEqual([1, 2, 3]);
    expect(ids(sortCharsByProperty(list, '서열', 'desc'))).toEqual([1, 2, 3]);
  });
  it('원본 배열을 바꾸지 않는다', () => {
    const list = [c(1, { 서열: '2' }), c(2, { 서열: '1' })];
    sortCharsByProperty(list, '서열', 'asc');
    expect(ids(list)).toEqual([1, 2]);
  });
  it('키가 없으면 원래 순서 그대로', () => {
    const list = [c(2), c(1)];
    expect(ids(sortCharsByProperty(list, '', 'asc'))).toEqual([2, 1]);
    expect(ids(sortCharsByProperty(list, null, 'asc'))).toEqual([2, 1]);
  });
  it('나이는 age 필드로 비교한다', () => {
    const list = [c(1, { age: '45세' }), c(2, { age: '20세' })];
    expect(ids(sortCharsByProperty(list, '나이', 'asc'))).toEqual([2, 1]);
  });
});

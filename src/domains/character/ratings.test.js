// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { parseRatingAxes, parseRatingScale, getRatings, ratingColor, applyRatingMeta } from './ratings';

describe('parseRatingAxes', () => {
  it('"속성이름:약칭" 줄을 읽는다', () => {
    expect(parseRatingAxes('위험도:R\n유용성: U \n희귀도:S')).toEqual([
      { key: '위험도', abbr: 'R' },
      { key: '유용성', abbr: 'U' },
      { key: '희귀도', abbr: 'S' },
    ]);
  });
  it('약칭이 없으면 이름의 첫 글자를 쓴다(영문은 대문자)', () => {
    expect(parseRatingAxes('위험도\nrisk')).toEqual([
      { key: '위험도', abbr: '위' },
      { key: 'risk', abbr: 'R' },
    ]);
  });
  it('빈 줄과 이름 없는 줄은 건너뛰고, 같은 속성은 한 번만 쓴다', () => {
    expect(parseRatingAxes('\n :R\n위험도:R\n위험도:X')).toEqual([{ key: '위험도', abbr: 'R' }]);
  });
  it('비어 있거나 문자열이 아니면 빈 배열', () => {
    expect(parseRatingAxes('')).toEqual([]);
    expect(parseRatingAxes(undefined)).toEqual([]);
  });
});

describe('parseRatingScale', () => {
  it('"등급:명칭:기준" 줄을 등급 순으로 읽는다', () => {
    expect(parseRatingScale('1:미미:관찰자 1인 이내\n0:무해:오컬트성 확인 불가')).toEqual([
      { level: 0, name: '무해', desc: '오컬트성 확인 불가' },
      { level: 1, name: '미미', desc: '관찰자 1인 이내' },
    ]);
  });
  it('기준 설명에 쌍점이 들어 있어도 그대로 보존한다', () => {
    expect(parseRatingScale('3:중대:도시: 기관 단위')).toEqual([{ level: 3, name: '중대', desc: '도시: 기관 단위' }]);
  });
  it('기준 설명이 없어도 된다', () => {
    expect(parseRatingScale('2:경미')).toEqual([{ level: 2, name: '경미', desc: '' }]);
  });
  it('숫자가 아닌 등급 줄은 건너뛴다', () => {
    expect(parseRatingScale('가:나:다\n1:하나')).toEqual([{ level: 1, name: '하나', desc: '' }]);
  });
  it('비어 있으면 빈 배열', () => {
    expect(parseRatingScale('')).toEqual([]);
    expect(parseRatingScale(null)).toEqual([]);
  });
});

describe('getRatings', () => {
  const axes = parseRatingAxes('위험도:R\n유용성:U');
  const scale = parseRatingScale('0:무해:확인 불가\n3:중대:도시 단위');

  it('값이 있는 속성만 배지 정보로 돌려준다', () => {
    const r = getRatings({ 위험도: '3' }, axes, scale);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ key: '위험도', abbr: 'R', level: 3, name: '중대', desc: '도시 단위' });
  });
  it('툴팁 글자는 속성, 등급, 명칭, 기준을 이어서 만든다', () => {
    expect(getRatings({ 위험도: '3' }, axes, scale)[0].title).toBe('위험도 3 중대: 도시 단위');
  });
  it('값에서 처음 나오는 숫자를 등급으로 읽는다("등급 3", "3급")', () => {
    expect(getRatings({ 위험도: '3급' }, axes, scale)[0].level).toBe(3);
  });
  it('기준표에 없는 등급이면 명칭과 기준 없이 숫자만 돌려준다', () => {
    const r = getRatings({ 위험도: '4' }, axes, scale)[0];
    expect(r).toMatchObject({ level: 4, name: '', desc: '' });
    expect(r.title).toBe('위험도 4');
  });
  it('숫자가 없는 값과 빈 값은 건너뛴다', () => {
    expect(getRatings({ 위험도: '미상', 유용성: '' }, axes, scale)).toEqual([]);
  });
  it('축 순서대로 돌려준다', () => {
    expect(getRatings({ 유용성: '0', 위험도: '3' }, axes, scale).map((x) => x.abbr)).toEqual(['R', 'U']);
  });
  it('등급 설정이 없으면 빈 배열', () => {
    expect(getRatings({ 위험도: '3' }, [], scale)).toEqual([]);
    expect(getRatings({ 위험도: '3' }, undefined, undefined)).toEqual([]);
  });
});

describe('ratingColor', () => {
  it('0~5 등급마다 다른 색을 쓰고 범위를 벗어나면 끝 색으로 맞춘다', () => {
    const colors = [0, 1, 2, 3, 4, 5].map(ratingColor);
    expect(new Set(colors).size).toBe(6);
    expect(ratingColor(-2)).toBe(colors[0]);
    expect(ratingColor(9)).toBe(colors[5]);
  });
});

describe('applyRatingMeta', () => {
  it('텍스트칸 값을 메타의 ratingAxes, ratingScale 로 넣는다', () => {
    expect(applyRatingMeta({ a: 1 }, { ratingAxesStr: '위험도:R', ratingScaleStr: '0:무해' })).toEqual({
      a: 1, ratingAxes: '위험도:R', ratingScale: '0:무해',
    });
  });
  it('비우면 예전에 저장된 값도 메타에서 지운다', () => {
    expect(applyRatingMeta({ ratingAxes: 'x', ratingScale: 'y', b: 2 }, { ratingAxesStr: '  ', ratingScaleStr: '' })).toEqual({ b: 2 });
  });
  it('원본 메타를 바꾸지 않는다', () => {
    const meta = { ratingAxes: 'x' };
    applyRatingMeta(meta, { ratingAxesStr: '', ratingScaleStr: '' });
    expect(meta).toEqual({ ratingAxes: 'x' });
  });
  it('텍스트칸 값이 undefined 여도 오류 없이 지운다', () => {
    expect(applyRatingMeta({ ratingAxes: 'x' }, {})).toEqual({});
  });
});

// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { parseGroupHideStr, formatGroupHideStr, applyGroupHideMeta, getGroupHideValues } from './groupHide';

describe('parseGroupHideStr', () => {
  it('"속성명: 값1, 값2" 줄마다 읽는다', () => {
    expect(parseGroupHideStr('소속: 1조, 2조\n등급: D급')).toEqual({ 소속: ['1조', '2조'], 등급: ['D급'] });
  });

  it('공백을 다듬고, 값 안의 쌍점은 첫 쌍점 뒤를 그대로 값으로 둔다', () => {
    expect(parseGroupHideStr('  소속 :  A팀 ,  B팀  ')).toEqual({ 소속: ['A팀', 'B팀'] });
    expect(parseGroupHideStr('소속: 북부: 1조, 2조')).toEqual({ 소속: ['북부: 1조', '2조'] });
  });

  it('윈도 줄바꿈과 빈 줄, 형식이 틀린 줄(쌍점 없음, 이름 없음, 값 없음)은 건너뛴다', () => {
    expect(parseGroupHideStr('소속: A\r\n\r\n그냥글자\n: 값만\n등급:\n성별: , ')).toEqual({ 소속: ['A'] });
  });

  it('같은 속성을 여러 줄 쓰면 값을 합치고 중복은 한 번만', () => {
    expect(parseGroupHideStr('소속: A, B\n소속: B, C')).toEqual({ 소속: ['A', 'B', 'C'] });
  });

  it('비었거나 문자열이 아니어도 오류 없이 빈 객체', () => {
    expect(parseGroupHideStr('')).toEqual({});
    expect(parseGroupHideStr(undefined)).toEqual({});
    expect(parseGroupHideStr(null)).toEqual({});
  });
});

describe('formatGroupHideStr', () => {
  it('저장된 맵을 편집 칸용 문자열로 만들고, 다시 읽으면 같다', () => {
    const map = { 소속: ['1조', '2조'], 등급: ['D급'] };
    const text = formatGroupHideStr(map);
    expect(text).toBe('소속: 1조, 2조\n등급: D급\n');
    expect(parseGroupHideStr(text)).toEqual(map);
  });

  it('없거나 이상한 값이면 빈 문자열', () => {
    expect(formatGroupHideStr(undefined)).toBe('');
    expect(formatGroupHideStr({ 소속: 'A' })).toBe('');
    expect(formatGroupHideStr({ 소속: [] })).toBe('');
  });
});

describe('applyGroupHideMeta', () => {
  it('편집 칸 내용을 메타에 넣고 다른 항목은 그대로 둔다', () => {
    expect(applyGroupHideMeta({ keep: 1 }, { groupHideStr: '소속: A' })).toEqual({ keep: 1, _groupHide: { 소속: ['A'] } });
  });

  it('칸을 모두 지우면 예전에 저장된 값이 메타에서 지워진다', () => {
    expect(applyGroupHideMeta({ keep: 1, _groupHide: { 소속: ['A'] } }, { groupHideStr: '' })).toEqual({ keep: 1 });
    expect(applyGroupHideMeta({ keep: 1, _groupHide: { 소속: ['A'] } }, { groupHideStr: '형식이 틀림' })).toEqual({ keep: 1 });
    expect(applyGroupHideMeta({ _groupHide: { 소속: ['A'] } }, {})).toEqual({});
  });

  it('원본 메타를 바꾸지 않는다', () => {
    const base = { keep: 1, _groupHide: { 소속: ['A'] } };
    applyGroupHideMeta(base, { groupHideStr: '' });
    expect(base).toEqual({ keep: 1, _groupHide: { 소속: ['A'] } });
  });
});

describe('getGroupHideValues', () => {
  it('분류 기준에 맞는 숨김 값 배열을 돌려준다', () => {
    const meta = { _groupHide: { 소속: ['A', 'B'], 등급: ['D급'] } };
    expect(getGroupHideValues(meta, '소속')).toEqual(['A', 'B']);
    expect(getGroupHideValues(meta, '등급')).toEqual(['D급']);
  });

  it('설정이 없거나 모양이 잘못돼도 빈 배열', () => {
    expect(getGroupHideValues({}, '소속')).toEqual([]);
    expect(getGroupHideValues(undefined, '소속')).toEqual([]);
    expect(getGroupHideValues({ _groupHide: { 소속: 'A' } }, '소속')).toEqual([]);
    expect(getGroupHideValues({ _groupHide: { 소속: ['A', 3, null, ' '] } }, '소속')).toEqual(['A']);
  });
});

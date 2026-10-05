import { describe, it, expect } from 'vitest';
import { findMatchesIn } from './findMatches';

describe('findMatchesIn', () => {
  it('검색어가 비어 있으면 빈 배열', () => {
    expect(findMatchesIn('abc', '')).toEqual([]);
    expect(findMatchesIn('abc', undefined)).toEqual([]);
  });

  it('없으면 빈 배열', () => {
    expect(findMatchesIn('abc', 'x')).toEqual([]);
  });

  it('모든 위치를 start/end로 돌려준다', () => {
    expect(findMatchesIn('ab ab ab', 'ab')).toEqual([
      { start: 0, end: 2 },
      { start: 3, end: 5 },
      { start: 6, end: 8 },
    ]);
  });

  it('대소문자를 구분하지 않는다', () => {
    expect(findMatchesIn('Hello hello', 'HELLO')).toEqual([
      { start: 0, end: 5 },
      { start: 6, end: 11 },
    ]);
  });

  it('겹치는 매치는 세지 않는다', () => {
    expect(findMatchesIn('aaaa', 'aa')).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ]);
  });

  it('한글도 찾는다', () => {
    expect(findMatchesIn('가나다 가나', '가나')).toEqual([
      { start: 0, end: 2 },
      { start: 4, end: 6 },
    ]);
  });

  it('줄바꿈이 섞여도 위치가 맞는다', () => {
    const text = '첫 줄\n두 번째 줄\n세 번째 줄';
    const matches = findMatchesIn(text, '줄');
    expect(matches.map((m) => text.slice(m.start, m.end))).toEqual(['줄', '줄', '줄']);
  });

  // "바꾸기"는 이 위치 배열로 문자열을 직접 잘라 붙인다 — DOM textarea 값을 거치지 않고
  // 순수 문자열만으로 결과가 나와야 React state(rawText)에 그대로 넣을 수 있다.
  it('위치 정보로 전부 바꾸기를 하면 기대한 문자열이 나온다', () => {
    const text = '고양이와 고양이';
    const matches = findMatchesIn(text, '고양이');
    let result = '';
    let cursor = 0;
    matches.forEach((m) => {
      result += text.slice(cursor, m.start) + '강아지';
      cursor = m.end;
    });
    result += text.slice(cursor);
    expect(result).toBe('강아지와 강아지');
  });
});

// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { buildCandidates, rankSuggestions } from './searchSuggest';

const work = (o = {}) => ({ id: 1, title: '작품', genre: '', metaInfo: { meta: {} }, ...o });
const cand = (o = {}) => ({ id: 1, title: '작품', alias: '', genre: '', hidden: false, ...o });

describe('buildCandidates', () => {
  const works = [
    work({ id: 1, title: '헌터 길드', genre: '헌터, 하렘' }),
    work({ id: 2, title: '숨겨진 작품', genre: 'NTL, 순애' }),
    work({ id: 3, title: '약칭 있는 작품', genre: '판타지', metaInfo: { meta: { alias: '약칭' } } }),
  ];

  it('숨김 분류에 걸린 작품에 hidden 표시를 남긴다', () => {
    const result = buildCandidates(works, ['NTL'], true);
    expect(result.map((c) => [c.id, c.hidden])).toEqual([[1, false], [2, true], [3, false]]);
  });

  it('includeHidden이 true면 숨김 분류 작품도 후보에 포함한다', () => {
    expect(buildCandidates(works, ['NTL'], true).map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('includeHidden이 false면 숨김 분류 작품을 뺀다', () => {
    expect(buildCandidates(works, ['NTL'], false).map((c) => c.id)).toEqual([1, 3]);
  });

  it('숨김 분류가 비어 있으면 includeHidden과 무관하게 전부 포함한다', () => {
    expect(buildCandidates(works, [], false)).toHaveLength(3);
    expect(buildCandidates(works, undefined, false)).toHaveLength(3);
  });

  it('메타의 태그/분류로 걸린 숨김 작품도 가려낸다', () => {
    const w = [work({ id: 9, title: '메타 숨김', metaInfo: { meta: { 태그: 'NTR' } } })];
    expect(buildCandidates(w, ['NTR'], false)).toEqual([]);
  });

  it('약칭(alias)을 메타에서 꺼내 담는다', () => {
    expect(buildCandidates(works, [], true)[2].alias).toBe('약칭');
    expect(buildCandidates(works, [], true)[0].alias).toBe('');
  });

  it('제목이나 장르가 없는 작품도 오류 없이 처리한다', () => {
    const result = buildCandidates([{ id: 5 }], [], true);
    expect(result[0]).toMatchObject({ id: 5, title: '', alias: '', genre: '', hidden: false });
  });
});

describe('rankSuggestions', () => {
  it('빈 검색어나 공백만 있으면 추천이 없다', () => {
    expect(rankSuggestions([cand()], '')).toEqual([]);
    expect(rankSuggestions([cand()], '   ')).toEqual([]);
  });

  it('대소문자를 구분하지 않는다', () => {
    expect(rankSuggestions([cand({ id: 1, title: 'Hunter Guild' })], 'HUNTER')).toHaveLength(1);
  });

  it('일치하는 것이 없으면 빈 배열', () => {
    expect(rankSuggestions([cand({ title: '가나다' })], '라마바')).toEqual([]);
  });

  it('순위: 정확 일치 > 제목 앞부분 > 약칭 앞부분 > 제목 포함 > 약칭 포함 > 장르 포함', () => {
    const list = [
      cand({ id: 6, title: '다른 이름', genre: '헌터물' }),
      cand({ id: 5, title: '다른 이름2', alias: '나의 헌터' }),
      cand({ id: 4, title: '나의 헌터 이야기' }),
      cand({ id: 3, title: '다른 이름3', alias: '헌터 약칭' }),
      cand({ id: 2, title: '헌터 길드' }),
      cand({ id: 1, title: '헌터' }),
    ];
    expect(rankSuggestions(list, '헌터').map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('약칭이 정확히 같아도 제일 앞에 온다', () => {
    const list = [cand({ id: 1, title: '헌터 길드' }), cand({ id: 2, title: '다른 작품', alias: '헌터' })];
    expect(rankSuggestions(list, '헌터')[0].id).toBe(2);
  });

  it('같은 순위끼리는 제목 가나다순', () => {
    const list = [cand({ id: 1, title: '헌터 다' }), cand({ id: 2, title: '헌터 가' }), cand({ id: 3, title: '헌터 나' })];
    expect(rankSuggestions(list, '헌터').map((c) => c.title)).toEqual(['헌터 가', '헌터 나', '헌터 다']);
  });

  it('추천 개수를 limit으로 자른다(기본 8개)', () => {
    const list = Array.from({ length: 20 }, (_, i) => cand({ id: i, title: `헌터 ${String(i).padStart(2, '0')}` }));
    expect(rankSuggestions(list, '헌터')).toHaveLength(8);
    expect(rankSuggestions(list, '헌터', 3)).toHaveLength(3);
  });

  it('검색어 앞뒤 공백은 무시한다', () => {
    expect(rankSuggestions([cand({ title: '헌터 길드' })], '  헌터  ')).toHaveLength(1);
  });

  it('원본 후보 배열을 바꾸지 않는다', () => {
    const list = [cand({ id: 2, title: '헌터 나' }), cand({ id: 1, title: '헌터 가' })];
    const before = list.map((c) => c.id);
    rankSuggestions(list, '헌터');
    expect(list.map((c) => c.id)).toEqual(before);
  });
});

import { describe, it, expect } from 'vitest';
import { filterHiddenWorks, isWorkHidden, collectWorkTags, normalizeCategory } from './filterHiddenWorks';

const work = (o = {}) => ({ id: 1, title: '작품', genre: '', metaInfo: { meta: {} }, ...o });

describe('normalizeCategory', () => {
  it('공백, #, *, 대괄호를 지우고 소문자로 맞춘다', () => {
    expect(normalizeCategory('# NTL')).toBe('ntl');
    expect(normalizeCategory('[NTR]')).toBe('ntr');
    expect(normalizeCategory(' *여리코 주의* ')).toBe('여리코주의');
  });

  it('숫자 같은 비문자열도 문자열로 취급한다', () => {
    expect(normalizeCategory(19)).toBe('19');
  });
});

describe('collectWorkTags', () => {
  it('genre 필드(쉼표 구분)의 태그를 모은다', () => {
    expect(collectWorkTags(work({ genre: '헌터, 하렘' }))).toEqual(['헌터', ' 하렘']);
  });

  it('설명 메타의 장르/태그/분류도 함께 모은다', () => {
    const w = work({ genre: 'A', metaInfo: { meta: { 장르: 'B', 태그: 'C, D', 분류: 'E' } } });
    expect(collectWorkTags(w).map((t) => t.trim())).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('genre가 없거나 metaInfo가 없어도 터지지 않는다', () => {
    expect(collectWorkTags({ id: 1 })).toEqual([]);
    expect(collectWorkTags({ id: 1, genre: null, metaInfo: null })).toEqual([]);
  });
});

describe('filterHiddenWorks', () => {
  it('숨김 목록이 비어 있으면 같은 배열을 그대로 돌려준다', () => {
    const works = [work({ genre: 'NTL' })];
    expect(filterHiddenWorks(works, [])).toBe(works);
  });

  it('숨김 목록이 배열이 아니면(undefined/null) 걸러내지 않는다', () => {
    const works = [work({ genre: 'NTL' })];
    expect(filterHiddenWorks(works, undefined)).toBe(works);
    expect(filterHiddenWorks(works, null)).toBe(works);
  });

  it('genre에 숨김 분류가 있으면 작품을 뺀다', () => {
    const hidden = work({ id: 1, genre: '순애, NTL, 집중매입' });
    const shown = work({ id: 2, genre: '헌터, 하렘' });
    expect(filterHiddenWorks([hidden, shown], ['NTL']).map((w) => w.id)).toEqual([2]);
  });

  it('메타의 태그/분류/장르에 있는 숨김 분류도 뺀다', () => {
    const byTag = work({ id: 1, metaInfo: { meta: { 태그: '하렘, NTR' } } });
    const byCat = work({ id: 2, metaInfo: { meta: { 분류: '유부녀' } } });
    const byGenreMeta = work({ id: 3, metaInfo: { meta: { 장르: 'MTL' } } });
    const ok = work({ id: 4, genre: '무협' });
    const result = filterHiddenWorks([byTag, byCat, byGenreMeta, ok], ['NTR', '유부녀', 'MTL']);
    expect(result.map((w) => w.id)).toEqual([4]);
  });

  it('대소문자, 공백, #, 대괄호 차이는 무시하고 비교한다', () => {
    const w = work({ genre: 'ntl' });
    expect(isWorkHidden(w, ['# NTL'])).toBe(true);
    expect(isWorkHidden(w, ['[NTL]'])).toBe(true);
    expect(isWorkHidden(work({ genre: ' 여리코 주의 ' }), ['여리코주의'])).toBe(true);
  });

  it('부분 일치로는 숨기지 않는다(태그 전체가 같아야 한다)', () => {
    expect(isWorkHidden(work({ genre: 'NTL' }), ['NT'])).toBe(false);
    expect(isWorkHidden(work({ genre: 'NTR물' }), ['NTR'])).toBe(false);
  });

  it('태그가 없는 작품은 남긴다', () => {
    const noTags = work({ id: 1, genre: '', metaInfo: { meta: {} } });
    expect(filterHiddenWorks([noTags], ['NTL'])).toEqual([noTags]);
  });

  it('원본 배열을 바꾸지 않고 순서를 유지한다', () => {
    const works = [work({ id: 1, genre: 'A' }), work({ id: 2, genre: 'NTL' }), work({ id: 3, genre: 'B' })];
    const before = [...works];
    const result = filterHiddenWorks(works, ['NTL']);
    expect(works).toEqual(before);
    expect(result.map((w) => w.id)).toEqual([1, 3]);
  });

  // 실제 DB(tb_hidden_category)에 들어 있던 목록으로 만든 회귀 테스트. 숨김 목록이 DB가 아니라
  // 비어 있는 localStorage를 읽던 시절에는 이 작품들이 전부 메인에 그대로 보였다.
  it('실제 숨김 목록(19, MTL, NTL, NTR, 여리코주의, 유부녀)을 적용한다', () => {
    const hiddenCats = ['19', 'MTL', 'NTL', 'NTR', '여리코주의', '유부녀'];
    const works = [
      work({ id: 1, genre: '순애, NTL, 집중매입' }),
      work({ id: 2, genre: 'NTL, 하렘, 무인도, 생존' }),
      work({ id: 3, genre: '아포칼립스, NTR, 생존' }),
      work({ id: 4, genre: '19, 로맨스' }),
      work({ id: 5, genre: '헌터, 헌터물, 현대판타지, 하렘, 시뮬레이션' }),
      work({ id: 6, genre: '무협, 현대무협, 현대판타지' }),
    ];
    expect(filterHiddenWorks(works, hiddenCats).map((w) => w.id)).toEqual([5, 6]);
  });
});

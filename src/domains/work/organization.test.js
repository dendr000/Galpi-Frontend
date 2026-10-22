// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { splitAffiliations, findAffiliationPage, getAffiliationMembers } from './organization';

const ch = (id, 소속, extra = {}) => ({ id, name: `c${id}`, 소속, ...extra });

describe('splitAffiliations', () => {
  it('쉼표로 나누고 앞뒤 공백을 지운다', () => {
    expect(splitAffiliations('전투학부, 사교 ,  ')).toEqual([
      { text: '전투학부', plain: false },
      { text: '사교', plain: false },
    ]);
  });
  it('*로 시작하는 값은 *를 떼고 일반 글자(plain) 표시를 한다', () => {
    expect(splitAffiliations('*비밀결사, 북부')).toEqual([
      { text: '비밀결사', plain: true },
      { text: '북부', plain: false },
    ]);
  });
  it('비어 있거나 값이 아니면 빈 배열', () => {
    expect(splitAffiliations('')).toEqual([]);
    expect(splitAffiliations(undefined)).toEqual([]);
    expect(splitAffiliations(null)).toEqual([]);
  });
});

describe('findAffiliationPage', () => {
  const pages = [{ id: 1, title: 'R.S.A.C.' }, { id: 2, title: '북부 대공가' }, { id: 3, title: '북부 대공가' }];
  it('제목이 같으면(공백, 대소문자 무시) 그 문서를 찾는다', () => {
    expect(findAffiliationPage(pages, '북부대공가').id).toBe(2);
    expect(findAffiliationPage(pages, 'r.s.a.c.').id).toBe(1);
  });
  it('같은 제목이 여러 개면 먼저 나온 것', () => {
    expect(findAffiliationPage(pages, '북부 대공가').id).toBe(2);
  });
  it('없거나 빈 값이면 undefined', () => {
    expect(findAffiliationPage(pages, '없는 곳')).toBeUndefined();
    expect(findAffiliationPage(pages, '')).toBeUndefined();
    expect(findAffiliationPage(undefined, '북부')).toBeUndefined();
  });
});

describe('getAffiliationMembers', () => {
  it('소속 값 중 하나가 문서 제목과 같은 캐릭터를 원래 순서로 돌려준다', () => {
    const chars = [ch(1, '북부, 사교'), ch(2, '남부'), ch(3, '북부')];
    expect(getAffiliationMembers(chars, '북부').map((c) => c.id)).toEqual([1, 3]);
  });
  it('공백과 대소문자를 무시한다', () => {
    expect(getAffiliationMembers([ch(1, 'R.S.A.C.')], 'r.s.a.c.').length).toBe(1);
  });
  it('*로 시작하는 소속은 세지 않는다', () => {
    expect(getAffiliationMembers([ch(1, '*북부')], '북부')).toEqual([]);
  });
  it('숨김 캐릭터는 뺀다', () => {
    const hidden = ch(1, '북부', { dynamicProperties: JSON.stringify({ _isHidden: true }) });
    expect(getAffiliationMembers([hidden, ch(2, '북부')], '북부').map((c) => c.id)).toEqual([2]);
  });
  it('제목이 비었거나 캐릭터가 없으면 빈 배열', () => {
    expect(getAffiliationMembers([ch(1, '북부')], '')).toEqual([]);
    expect(getAffiliationMembers(undefined, '북부')).toEqual([]);
  });
});

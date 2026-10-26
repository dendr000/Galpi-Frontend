// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { newPageUrl, siblingParentId } from './newPageUrl';

describe('newPageUrl', () => {
  it('상위 문서가 없으면 최상위 문서를 만드는 편집 주소', () => {
    expect(newPageUrl(91)).toBe('/edit?type=page&action=new&workId=91');
    expect(newPageUrl('91', null)).toBe('/edit?type=page&action=new&workId=91');
    expect(newPageUrl('91', undefined)).toBe('/edit?type=page&action=new&workId=91');
  });
  it('상위 문서가 있으면 parentId 를 붙인다', () => {
    expect(newPageUrl(91, 7)).toBe('/edit?type=page&action=new&workId=91&parentId=7');
    expect(newPageUrl('91', '7')).toBe('/edit?type=page&action=new&workId=91&parentId=7');
  });
  it('0 도 상위 문서 번호로 취급하지 않는다(번호는 1부터)', () => {
    expect(newPageUrl(91, 0)).toBe('/edit?type=page&action=new&workId=91');
  });
});

describe('siblingParentId', () => {
  it('같은 위치에 만들려면 그 문서의 상위 문서 번호를 쓴다', () => {
    expect(siblingParentId({ id: 5, parentId: 3 })).toBe(3);
  });
  it('최상위 문서의 같은 위치는 최상위(상위 없음)', () => {
    expect(siblingParentId({ id: 5, parentId: null })).toBeNull();
    expect(siblingParentId({ id: 5 })).toBeNull();
    expect(siblingParentId(undefined)).toBeNull();
  });
});

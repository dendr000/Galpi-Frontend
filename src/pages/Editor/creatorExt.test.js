// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { pickMostUsedExt } from './creatorExt';

const work = (creator, meta) => ({ creator, description: meta ? `[META_DATA:${JSON.stringify(meta)}]\n본문` : '본문' });

describe('pickMostUsedExt', () => {
  const works = [
    work('하엣', { charExt: 'webp', coverExt: 'png' }),
    work('하엣', { charExt: 'webp', coverExt: 'webp' }),
    work('하엣', { charExt: 'png', coverExt: 'png' }),
    work('다른작가', { charExt: 'gif', coverExt: 'gif' }),
  ];

  it('같은 제작자의 작품 중 가장 많이 쓴 캐릭터 확장자를 돌려준다', () => {
    expect(pickMostUsedExt(works, '하엣', 'charExt')).toBe('webp');
  });

  it('같은 제작자의 작품 중 가장 많이 쓴 대문(커버) 확장자를 돌려준다', () => {
    expect(pickMostUsedExt(works, '하엣', 'coverExt')).toBe('png');
  });

  it('다른 제작자의 작품은 세지 않는다', () => {
    expect(pickMostUsedExt(works, '다른작가', 'coverExt')).toBe('gif');
    expect(pickMostUsedExt(works, '없는작가', 'coverExt')).toBeNull();
  });

  it('값이 비어 있는 작품(대문 없음)은 세지 않는다', () => {
    const w = [work('하엣', { coverExt: '' }), work('하엣', {}), work('하엣', { coverExt: 'jpg' }), work('하엣')];
    expect(pickMostUsedExt(w, '하엣', 'coverExt')).toBe('jpg');
  });

  it('대문이 하나도 없는 제작자는 null', () => {
    expect(pickMostUsedExt([work('하엣', { charExt: 'png' })], '하엣', 'coverExt')).toBeNull();
  });

  it('동률이면 먼저 나온 확장자가 이긴다', () => {
    const w = [work('하엣', { coverExt: 'jpg' }), work('하엣', { coverExt: 'png' })];
    expect(pickMostUsedExt(w, '하엣', 'coverExt')).toBe('jpg');
  });

  it('확장자 앞의 점과 공백은 같은 값으로 센다', () => {
    const w = [work('하엣', { coverExt: '.png' }), work('하엣', { coverExt: ' png ' }), work('하엣', { coverExt: 'jpg' })];
    expect(pickMostUsedExt(w, '하엣', 'coverExt')).toBe('png');
  });

  it('제작자 이름 앞뒤 공백은 무시하고 비교한다', () => {
    expect(pickMostUsedExt(works, '  하엣  ', 'charExt')).toBe('webp');
    expect(pickMostUsedExt([work('  하엣 ', { coverExt: 'png' })], '하엣', 'coverExt')).toBe('png');
  });

  it('제작자가 비어 있거나 작품 목록이 비어 있으면 null', () => {
    expect(pickMostUsedExt(works, '', 'coverExt')).toBeNull();
    expect(pickMostUsedExt(works, '   ', 'coverExt')).toBeNull();
    expect(pickMostUsedExt(works, undefined, 'coverExt')).toBeNull();
    expect(pickMostUsedExt([], '하엣', 'coverExt')).toBeNull();
  });

  it('제작자나 설명이 없는 작품이 섞여 있어도 오류 없이 처리한다', () => {
    const w = [{ id: 1 }, { creator: null, description: null }, work('하엣', { coverExt: 'png' })];
    expect(pickMostUsedExt(w, '하엣', 'coverExt')).toBe('png');
  });

  it('깨진 메타 JSON이 있는 작품은 건너뛴다', () => {
    const w = [{ creator: '하엣', description: '[META_DATA:{깨짐}]\n본문' }, work('하엣', { coverExt: 'webp' })];
    expect(pickMostUsedExt(w, '하엣', 'coverExt')).toBe('webp');
  });
});

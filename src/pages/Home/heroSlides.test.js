// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { pickCoverWorks, shuffle, getCoverUrl } from './heroSlides';

const work = (id, meta = {}, title = `작품${id}`) => ({ id, title, metaInfo: { meta } });

describe('pickCoverWorks', () => {
  it('coverExt가 있는 작품을 고른다', () => {
    expect(pickCoverWorks([work(1, { coverExt: 'webp' })]).map((w) => w.id)).toEqual([1]);
  });

  it('옛 방식 cover가 있는 작품도 고른다', () => {
    expect(pickCoverWorks([work(1, { cover: 'cover/a.png' })]).map((w) => w.id)).toEqual([1]);
  });

  it('커버 정보가 없거나 공백뿐이면 뺀다', () => {
    const works = [work(1, {}), work(2, { coverExt: '   ' }), work(3, { cover: '' }), { id: 4, title: 'x' }, work(5, { coverExt: 'png' })];
    expect(pickCoverWorks(works).map((w) => w.id)).toEqual([5]);
  });

  it('원래 순서를 유지한다', () => {
    const works = [work(3, { coverExt: 'png' }), work(1, { coverExt: 'png' }), work(2, { coverExt: 'png' })];
    expect(pickCoverWorks(works).map((w) => w.id)).toEqual([3, 1, 2]);
  });
});

describe('shuffle', () => {
  it('같은 원소를 하나도 빠뜨리거나 늘리지 않는다', () => {
    const list = Array.from({ length: 30 }, (_, i) => i);
    const result = shuffle(list);
    expect(result).toHaveLength(30);
    expect([...result].sort((a, b) => a - b)).toEqual(list);
  });

  it('원본 배열을 바꾸지 않는다', () => {
    const list = [1, 2, 3, 4, 5];
    shuffle(list);
    expect(list).toEqual([1, 2, 3, 4, 5]);
  });

  it('빈 배열과 원소 하나는 그대로', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([7])).toEqual([7]);
  });

  it('난수를 고정하면 결과가 결정적이다(주입한 rand 사용)', () => {
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
    expect(shuffle([1, 2, 3, 4], () => 0.999)).toEqual([1, 2, 3, 4]);
  });

  it('모든 순열이 나올 수 있다(3개 원소로 6가지 전부)', () => {
    const seen = new Set();
    for (let a = 0; a < 3; a += 1) {
      for (let b = 0; b < 2; b += 1) {
        const seq = [a / 3 + 0.01, b / 2 + 0.01];
        let i = 0;
        seen.add(shuffle(['a', 'b', 'c'], () => seq[i++]).join(''));
      }
    }
    expect(seen.size).toBe(6);
  });
});

describe('getCoverUrl', () => {
  it('coverExt가 있으면 /img/cover/<작품명>.<확장자>', () => {
    expect(getCoverUrl(work(1, { coverExt: 'webp' }, '헌터 소사이어티'))).toBe(`/img/cover/${encodeURIComponent('헌터 소사이어티.webp')}`);
  });

  it('확장자 앞의 점과 공백은 정리한다', () => {
    expect(getCoverUrl(work(1, { coverExt: ' .png ' }, '작품'))).toBe(`/img/cover/${encodeURIComponent('작품.png')}`);
  });

  it('파일명에 못 쓰는 문자는 전각 문자로 바꿔서 주소를 만든다', () => {
    expect(getCoverUrl(work(1, { coverExt: 'webp' }, '왜 나랑만 계약 안 해줘?'))).toBe(`/img/cover/${encodeURIComponent('왜 나랑만 계약 안 해줘？.webp')}`);
  });

  it('coverExt가 없고 cover가 있으면 옛 방식 경로(cover/ 접두어 제거)', () => {
    expect(getCoverUrl(work(1, { cover: 'cover/옛 작품.jpg' }))).toBe(`/img/cover/${encodeURIComponent('옛 작품.jpg')}`);
  });

  it('coverExt가 cover보다 우선한다', () => {
    expect(getCoverUrl(work(1, { coverExt: 'png', cover: 'cover/x.jpg' }, '작품'))).toBe(`/img/cover/${encodeURIComponent('작품.png')}`);
  });

  it('둘 다 없으면 빈 문자열', () => {
    expect(getCoverUrl(work(1, {}))).toBe('');
    expect(getCoverUrl({ id: 1, title: 'x' })).toBe('');
  });
});

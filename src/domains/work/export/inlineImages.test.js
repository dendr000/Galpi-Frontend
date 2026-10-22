// Copyright (c) dendr000. MIT License.
import { describe, it, expect, vi } from 'vitest';
import { inlineLocalImages } from './inlineImages';

describe('inlineLocalImages', () => {
  it('/img/ 로 시작하는 이미지 주소를 불러온 데이터 주소로 바꾼다(src, CSS url 모두)', async () => {
    const load = vi.fn(async (url) => `data:image/webp;base64,${url.length}`);
    const html = `<img src="/img/character/a.png"><div style="background-image:url('/img/character/b.png')"></div>`;
    const out = await inlineLocalImages(html, load);
    expect(out).not.toContain('/img/');
    expect(out).toContain('data:image/webp;base64,');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('같은 주소는 한 번만 불러온다', async () => {
    const load = vi.fn(async () => 'data:image/webp;base64,X');
    await inlineLocalImages('<img src="/img/a.png"><img src="/img/a.png">', load);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('불러오지 못한 이미지는 깨진 그림이 남지 않게 주소를 빈 값으로 바꾼다', async () => {
    const out = await inlineLocalImages('<img src="/img/none.png">', async () => '');
    expect(out).not.toContain('/img/none.png');
    expect(out).toContain('<img src="">');
  });

  it('불러오기가 예외를 던져도 그 이미지만 비우고 계속한다', async () => {
    const load = vi.fn(async (url) => { if (url.includes('bad')) throw new Error('x'); return 'data:image/webp;base64,OK'; });
    const out = await inlineLocalImages('<img src="/img/bad.png"><img src="/img/good.png">', load);
    expect(out).toContain('data:image/webp;base64,OK');
    expect(out).not.toContain('/img/');
  });

  it('/img/ 가 아닌 주소와 이미지 없는 문서는 그대로 둔다', async () => {
    const load = vi.fn();
    const html = '<img src="https://example.com/a.png"><a href="/work/1">x</a><p>본문 /img/ 글자</p>';
    expect(await inlineLocalImages(html, load)).toBe(html);
    expect(load).not.toHaveBeenCalled();
  });

  it('퍼센트 인코딩된 한글 파일명 주소도 처리한다', async () => {
    const url = `/img/character/${encodeURIComponent('작품_릴리.png')}`;
    const load = vi.fn(async () => 'data:image/webp;base64,K');
    const out = await inlineLocalImages(`<img src="${url}">`, load);
    expect(load).toHaveBeenCalledWith(url);
    expect(out).toContain('data:image/webp;base64,K');
  });

  it('빈 값이면 빈 문자열', async () => {
    expect(await inlineLocalImages('', vi.fn())).toBe('');
    expect(await inlineLocalImages(undefined, vi.fn())).toBe('');
  });
});

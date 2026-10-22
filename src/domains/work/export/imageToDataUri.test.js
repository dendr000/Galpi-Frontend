// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fitSize, imageToDataUri } from './imageToDataUri';

afterEach(() => vi.unstubAllGlobals());

describe('fitSize', () => {
  it('최대 폭보다 크면 비율을 지켜 줄인다', () => {
    expect(fitSize(1200, 1800, 400)).toEqual({ width: 400, height: 600 });
  });
  it('최대 폭 이하면 그대로 둔다(확대하지 않음)', () => {
    expect(fitSize(300, 500, 400)).toEqual({ width: 300, height: 500 });
  });
  it('높이는 반올림하고 최소 1이다', () => {
    expect(fitSize(1000, 1, 100)).toEqual({ width: 100, height: 1 });
    expect(fitSize(3, 2, 2)).toEqual({ width: 2, height: 1 });
  });
  it('크기가 이상하면 null', () => {
    expect(fitSize(0, 10, 100)).toBeNull();
    expect(fitSize(10, 0, 100)).toBeNull();
    expect(fitSize(NaN, 10, 100)).toBeNull();
  });
});

describe('imageToDataUri', () => {
  const stubCanvas = (dataUrl) => {
    const ctx = { drawImage: vi.fn() };
    const canvas = { width: 0, height: 0, getContext: () => ctx, toDataURL: vi.fn(() => dataUrl) };
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => (tag === 'canvas' ? canvas : realCreate(tag)));
    return { canvas, ctx };
  };

  it('불러온 이미지를 줄여서 webp 데이터 주소로 돌려준다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => new Blob(['x']) })));
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 1000, height: 2000, close: vi.fn() })));
    const { canvas, ctx } = stubCanvas('data:image/webp;base64,OK');
    const out = await imageToDataUri('/img/character/a.png', { maxWidth: 500, quality: 0.7 });
    expect(out).toBe('data:image/webp;base64,OK');
    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(1000);
    expect(ctx.drawImage).toHaveBeenCalled();
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/webp', 0.7);
  });

  it('응답이 실패면 빈 문자열', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    expect(await imageToDataUri('/img/none.png')).toBe('');
  });

  it('네트워크 오류나 디코딩 오류도 빈 문자열(예외를 던지지 않음)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network'); }));
    expect(await imageToDataUri('/img/a.png')).toBe('');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => new Blob(['x']) })));
    vi.stubGlobal('createImageBitmap', vi.fn(async () => { throw new Error('decode'); }));
    expect(await imageToDataUri('/img/a.png')).toBe('');
  });

  it('webp 를 지원하지 않아 png 로 돌아온 경우에도 결과를 그대로 쓴다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => new Blob(['x']) })));
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 10, height: 10, close: vi.fn() })));
    stubCanvas('data:image/png;base64,PNG');
    expect(await imageToDataUri('/img/a.png')).toBe('data:image/png;base64,PNG');
  });
});

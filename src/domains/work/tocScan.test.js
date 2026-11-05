// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { queryTocHeadings } from './tocScan';

beforeEach(() => { document.body.innerHTML = ''; });

describe('queryTocHeadings', () => {
  it('페이지의 제목은 문서 순서대로 모두 돌려준다', () => {
    document.body.innerHTML = '<div class="markdown-body"><h1 id="a">1. 개요</h1><h2 id="b">소제목</h2></div>';
    expect(queryTocHeadings('.markdown-body h1, .markdown-body h2').map((h) => h.id)).toEqual(['a', 'b']);
  });

  it('큰 창 안의 제목은 뺀다', () => {
    document.body.innerHTML = '<div class="markdown-body"><h1 id="a">1. 개요</h1></div>'
      + '<div data-char-modal><div class="markdown-body"><h1 id="m">3. 모달</h1><h3 id="n">x</h3></div></div>';
    expect(queryTocHeadings('.markdown-body h1, .markdown-body h3').map((h) => h.id)).toEqual(['a']);
  });

  it('맞는 것이 없으면 빈 배열', () => {
    expect(queryTocHeadings('.markdown-body h1')).toEqual([]);
  });
});

// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { collectMatches, applyHighlights, clearHighlights, HIGHLIGHT_ALL, HIGHLIGHT_CURRENT } from './findInPage';

const setBody = (html) => { document.body.innerHTML = html; };
const texts = (ranges) => ranges.map((r) => r.toString());

afterEach(() => { document.body.innerHTML = ''; });

describe('collectMatches', () => {
  it('빈 검색어는 아무것도 찾지 않는다', () => {
    setBody('<p>강소라</p>');
    expect(collectMatches(document.body, '')).toEqual([]);
    expect(collectMatches(document.body, '   ')).toEqual([]);
  });

  it('한 글자(한글 음절)도 찾는다: "라", "소", "강"', () => {
    setBody('<p>강소라 그리고 라온</p>');
    expect(texts(collectMatches(document.body, '라'))).toEqual(['라', '라']);
    expect(texts(collectMatches(document.body, '소'))).toEqual(['소']);
    expect(texts(collectMatches(document.body, '강소라'))).toEqual(['강소라']);
  });

  it('여러 요소와 같은 요소 안의 여러 일치를 문서 순서대로 모두 찾는다', () => {
    setBody('<p>가나가</p><div><span>가</span></div>');
    expect(collectMatches(document.body, '가')).toHaveLength(3);
  });

  it('대소문자를 구분하지 않는다', () => {
    setBody('<p>Hello WORLD</p>');
    expect(texts(collectMatches(document.body, 'hello'))).toEqual(['Hello']);
    expect(texts(collectMatches(document.body, 'world'))).toEqual(['WORLD']);
  });

  it('찾은 범위는 원문 글자 그대로를 가리킨다(대소문자, 공백 포함)', () => {
    setBody('<p>가 나 다</p>');
    expect(texts(collectMatches(document.body, '가 나'))).toEqual(['가 나']);
  });

  it('찾기창 자신(제외한 요소)의 글자는 찾지 않는다', () => {
    setBody('<p>강소라</p><div id="bar"><label>강소라 찾기</label></div>');
    const bar = document.getElementById('bar');
    expect(collectMatches(document.body, '강소라', bar)).toHaveLength(1);
  });

  it('script, style, 숨겨진(display:none) 요소 안의 글자는 찾지 않는다', () => {
    setBody('<p>가</p><script>var 가 = 1;</script><style>.가{}</style><div style="display:none">가</div><div hidden>가</div>');
    expect(collectMatches(document.body, '가')).toHaveLength(1);
  });

  it('입력칸(input, textarea)의 값은 글자 노드가 아니라서 찾지 않는다', () => {
    setBody('<p>가</p><input value="가"><textarea>가</textarea>');
    // textarea 안의 글자는 텍스트 노드지만 입력칸이라 화면 글자가 아니므로 제외한다
    expect(collectMatches(document.body, '가')).toHaveLength(1);
  });

  it('찾지 못하면 빈 배열', () => {
    setBody('<p>강소라</p>');
    expect(collectMatches(document.body, '없는말')).toEqual([]);
  });

  it('검색어 앞뒤 공백은 무시하고, 조합형(NFC)으로 맞춰 비교한다', () => {
    setBody('<p>강소라</p>');
    expect(texts(collectMatches(document.body, '  강소라  '))).toEqual(['강소라']);
    const decomposed = '강소라'.normalize('NFD');
    expect(texts(collectMatches(document.body, decomposed))).toEqual(['강소라']);
  });

  it('정규식 특수문자가 들어 있어도 그대로 글자로 찾는다', () => {
    setBody('<p>a.b (c) [d]</p>');
    expect(texts(collectMatches(document.body, '.b ('))).toEqual(['.b (']);
  });
});

describe('applyHighlights / clearHighlights', () => {
  class FakeHighlight { constructor(...ranges) { this.ranges = ranges; } }
  beforeEach(() => {
    globalThis.Highlight = FakeHighlight;
    globalThis.CSS = { highlights: new Map() };
  });
  afterEach(() => { delete globalThis.Highlight; delete globalThis.CSS; });

  it('모든 일치는 하나의 하이라이트로, 현재 일치는 따로 표시한다', () => {
    setBody('<p>가나가</p>');
    const ranges = collectMatches(document.body, '가');
    applyHighlights(ranges, 1);
    expect(CSS.highlights.get(HIGHLIGHT_ALL).ranges).toHaveLength(2);
    expect(CSS.highlights.get(HIGHLIGHT_CURRENT).ranges).toEqual([ranges[1]]);
  });

  it('현재 번호가 범위를 벗어나면 현재 표시는 만들지 않는다', () => {
    setBody('<p>가</p>');
    applyHighlights(collectMatches(document.body, '가'), -1);
    expect(CSS.highlights.has(HIGHLIGHT_CURRENT)).toBe(false);
  });

  it('지우면 두 하이라이트가 모두 사라진다', () => {
    setBody('<p>가</p>');
    applyHighlights(collectMatches(document.body, '가'), 0);
    clearHighlights();
    expect(CSS.highlights.size).toBe(0);
  });

  it('하이라이트 기능이 없는 환경에서는 오류 없이 넘어간다', () => {
    delete globalThis.CSS;
    delete globalThis.Highlight;
    setBody('<p>가</p>');
    expect(() => applyHighlights(collectMatches(document.body, '가'), 0)).not.toThrow();
    expect(() => clearHighlights()).not.toThrow();
  });
});

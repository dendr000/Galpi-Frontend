// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { sanitizeExportHtml } from './sanitizeExportHtml';

describe('sanitizeExportHtml', () => {
  it('일반 서식과 인라인 스타일은 그대로 둔다', () => {
    const html = '<p style="color:red">안녕 <strong>세계</strong></p><table><tbody><tr><td>a</td></tr></tbody></table>';
    expect(sanitizeExportHtml(html)).toBe(html);
  });

  it('script 태그는 내용째 지운다', () => {
    const out = sanitizeExportHtml('<p>a</p><script>alert(1)</script><p>b</p>');
    expect(out).not.toMatch(/script/i);
    expect(out).toContain('<p>a</p>');
    expect(out).toContain('<p>b</p>');
  });

  it('iframe, object, embed, link, meta, base, form 같은 외부 연결 태그를 지운다', () => {
    const out = sanitizeExportHtml('<iframe src="x"></iframe><object data="x"></object><embed src="x"><link rel="stylesheet" href="x"><meta http-equiv="refresh" content="0"><base href="x"><form action="x"><input></form>글');
    for (const tag of ['iframe', 'object', 'embed', 'link', 'meta', 'base', 'form']) expect(out).not.toMatch(new RegExp(`<${tag}`, 'i'));
    expect(out).toContain('글');
  });

  it('on 으로 시작하는 이벤트 속성을 모두 지운다(스포일러의 마우스 이벤트 포함)', () => {
    const out = sanitizeExportHtml('<span class="galpi-spoiler" onmouseover="this.style.color=\'#fff\'" onclick="evil()">비밀</span>');
    expect(out).not.toMatch(/onmouse|onclick/i);
    expect(out).toContain('class="galpi-spoiler"');
    expect(out).toContain('비밀');
  });

  it('javascript: 주소를 가진 링크와 이미지를 무력화한다', () => {
    const out = sanitizeExportHtml('<a href="javascript:alert(1)">x</a><a href=" JaVaScRiPt:alert(1)">y</a><img src="javascript:alert(1)">');
    expect(out).not.toMatch(/javascript:/i);
  });

  it('data:text/html 같은 위험한 data 주소를 지우되 이미지 data 주소는 둔다', () => {
    const out = sanitizeExportHtml('<a href="data:text/html;base64,AAAA">x</a><img src="data:image/webp;base64,BBBB">');
    expect(out).not.toContain('data:text/html');
    expect(out).toContain('data:image/webp;base64,BBBB');
  });

  it('상대 경로, 해시, 웹 주소 링크는 그대로 둔다', () => {
    const html = '<a href="#char-1">a</a><a href="https://example.com/x">b</a>';
    expect(sanitizeExportHtml(html)).toBe(html);
  });

  it('SVG 안의 script 와 이벤트 속성도 지운다', () => {
    const out = sanitizeExportHtml('<svg><script>alert(1)</script><circle r="3" onload="evil()"></circle></svg>');
    expect(out).not.toMatch(/script|onload/i);
    expect(out).toContain('<circle');
  });

  it('빈 값이면 빈 문자열', () => {
    expect(sanitizeExportHtml('')).toBe('');
    expect(sanitizeExportHtml(undefined)).toBe('');
  });
});

// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderMarkdownHtml } from './renderMarkdownHtml';

describe('renderMarkdownHtml', () => {
  it('내용이 없으면 빈 문자열', () => {
    expect(renderMarkdownHtml('')).toBe('');
    expect(renderMarkdownHtml(undefined)).toBe('');
  });

  it('마크다운을 HTML 로 바꾸고 제목에 번호를 매긴다(시작 번호 반영)', () => {
    const html = renderMarkdownHtml('# 개요\n본문\n## 하위', 3);
    expect(html).toContain('3.');
    expect(html).toContain('3.1.');
    expect(html).toContain('본문');
  });

  it('갈피 매크로를 위젯 HTML 로 바꾼다(게이지, 스포일러)', () => {
    expect(renderMarkdownHtml('[게이지:체력=80/100]')).toContain('galpi-ext-bar-wrap');
    expect(renderMarkdownHtml('[스포일러]비밀[/스포일러]')).toContain('galpi-spoiler');
  });

  it('로그탭 매크로를 탭 위젯으로 바꾼다', () => {
    expect(renderMarkdownHtml('[로그탭:노랑]내용[/로그탭]')).toContain('galpi-log-tab-wrapper');
  });

  it('[[이름]] 을 백링크 표시(span)로 바꾼다', () => {
    expect(renderMarkdownHtml('그날 [[리안]]을 만났다')).toContain('class="wiki-backlink"');
  });
});

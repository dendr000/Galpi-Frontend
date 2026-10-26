// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ICON_NAMES, getIconSvg, iconHtml, ICON_CSS, injectIconStyles } from './iconRegistry';
import Icon from './Icon';

afterEach(cleanup);

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../assets/icons');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg'));

describe('아이콘 파일 규격(assets/icons/*.svg)', () => {
  it('등록부가 폴더의 모든 svg 파일을 이름으로 가지고 있다', () => {
    expect([...ICON_NAMES].sort()).toEqual(files.map((f) => f.replace(/\.svg$/, '')).sort());
  });

  it.each(files)('%s: 24 격자, 글자색(currentColor) 채움, 저작권 한 줄, 고정 색과 스크립트 없음', (f) => {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    expect(s.startsWith('<!-- Copyright (c) dendr000. MIT License. -->')).toBe(true);
    expect(s).toContain('viewBox="0 0 24 24"');
    expect(s).toContain('fill="currentColor"');
    expect(s).not.toMatch(/<script|<image|href=|#[0-9a-fA-F]{3,6}\b|rgb\(/);
    expect(s).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe('getIconSvg / iconHtml', () => {
  it('저작권 주석을 뺀 svg 문자열을 돌려준다', () => {
    const svg = getIconSvg('trash');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).not.toContain('Copyright');
  });

  it('모르는 이름은 빈 문자열(화면이 깨지지 않는다)', () => {
    expect(getIconSvg('없는-아이콘')).toBe('');
    expect(iconHtml('없는-아이콘')).toBe('');
  });

  it('문자열 HTML 용: gi 클래스와 이름 클래스, 스크린리더에서 숨김', () => {
    const html = iconHtml('warning');
    expect(html).toContain('class="gi gi-warning"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('<svg');
  });

  it('추가 클래스를 붙일 수 있다', () => {
    expect(iconHtml('warning', 'extra')).toContain('class="gi gi-warning extra"');
  });

  it('이름에 특수문자가 들어 있어도 속성을 깨지 못한다(등록된 이름만 쓴다)', () => {
    expect(iconHtml('trash" onclick="x')).toBe('');
  });
});

describe('Icon 컴포넌트', () => {
  it('svg 를 gi 칸 안에 그리고 장식용이라 보조기기에서는 숨긴다', () => {
    const { container } = render(<Icon name="trash" />);
    const span = container.querySelector('span.gi');
    expect(span.getAttribute('aria-hidden')).toBe('true');
    expect(span.querySelector('svg')).not.toBeNull();
  });

  it('size 를 주면 그 크기(px)로, 안 주면 글자 크기(1em)를 따른다', () => {
    const a = render(<Icon name="trash" size={20} />).container.querySelector('span.gi');
    expect(a.style.width).toBe('20px');
    expect(a.style.height).toBe('20px');
    cleanup();
    const b = render(<Icon name="trash" />).container.querySelector('span.gi');
    expect(b.style.width).toBe('');
  });

  it('모르는 이름이면 아무것도 그리지 않는다', () => {
    expect(render(<Icon name="없는-아이콘" />).container.firstChild).toBeNull();
  });

  it('lead 를 주면 글자 앞 간격 클래스(gi-lead)가 붙는다', () => {
    expect(render(<Icon name="trash" lead />).container.querySelector('span.gi').className).toContain('gi-lead');
    cleanup();
    expect(render(<Icon name="trash" />).container.querySelector('span.gi').className).not.toContain('gi-lead');
  });

  it('className 과 title 을 전달한다(title 이 있으면 보조기기에도 보인다)', () => {
    const span = render(<Icon name="trash" className="mine" title="삭제" />).container.querySelector('span.gi');
    expect(span.className).toContain('mine');
    expect(span.getAttribute('title')).toBe('삭제');
    expect(span.getAttribute('aria-hidden')).toBeNull();
  });
});

describe('아이콘 스타일', () => {
  it('gi 칸은 글자 크기에 맞추고 svg 를 가득 채운다', () => {
    expect(ICON_CSS).toMatch(/\.gi\s*\{[^}]*width:\s*1em/);
    expect(ICON_CSS).toMatch(/\.gi\s*>\s*svg\s*\{[^}]*width:\s*100%/);
  });

  it('스타일은 문서에 한 번만 들어간다', () => {
    injectIconStyles();
    injectIconStyles();
    expect(document.querySelectorAll('#galpi-icon-styles')).toHaveLength(1);
  });
});

// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createLogTabHtml } from './macroGenerators';

// 장르 테마 CSS는 .gt-macro-ink 에 글자색을 !important 로 덮어쓴다(밝은 글자색).
// 활성 탭은 연한 파스텔 배경을 쓰므로, 이 클래스가 붙으면 밝은 글자가 밝은 배경 위에 놓여 안 읽힌다.
const parseTabs = (html) => {
  const box = document.createElement('div');
  box.innerHTML = html;
  const bar = box.querySelector('.galpi-log-tab-wrapper').firstElementChild;
  return Array.from(bar.children);
};

describe('createLogTabHtml 활성 탭 글자 대비', () => {
  it('활성 탭은 테마가 글자색을 덮어쓰는 gt-macro-ink 클래스를 갖지 않는다', () => {
    const tabs = parseTabs(createLogTabHtml('노랑', '본문'));
    const active = tabs.find((t) => t.textContent.trim() === '노랑');
    expect(active.classList.contains('gt-macro-ink')).toBe(false);
  });

  it('활성 탭은 자기 강조색을 글자색으로 쓴다', () => {
    const tabs = parseTabs(createLogTabHtml('노랑', '본문'));
    const active = tabs.find((t) => t.textContent.trim() === '노랑');
    expect(active.style.color).not.toBe('');
    expect(active.style.color).not.toContain('var(');
  });

  it('활성 탭이 아닌 탭은 테마 패널색과 짝을 이루는 클래스를 유지한다', () => {
    const tabs = parseTabs(createLogTabHtml('노랑', '본문'));
    const inactive = tabs.find((t) => t.textContent.trim() === '파랑');
    expect(inactive.classList.contains('gt-macro-box')).toBe(true);
    expect(inactive.classList.contains('gt-macro-ink-soft')).toBe(true);
  });
});

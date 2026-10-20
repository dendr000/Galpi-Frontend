// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { loadTheme, contrast, composite } from './themeContrast';

const MIN = 4.5;

// 같은 규칙의 글자색과 배경색 대비. 둘 다 불투명 색으로 풀려야 한다.
const pairRatio = (theme, selector) => {
  const s = theme.style(selector);
  const fg = theme.color(s.color);
  const bg = theme.color(s.background);
  expect(fg, `${selector} color`).not.toBeNull();
  expect(bg, `${selector} background`).not.toBeNull();
  return contrast(fg, bg);
};

describe('hero-comic 노란 버튼 글자 대비', () => {
  const targets = ['[data-genre-theme="hero-comic"] .gt-btn-edit', '[data-genre-theme="hero-comic"] .gt-hero-fallback .wiki-btn'];
  for (const mode of ['light', 'dark']) {
    for (const sel of targets) {
      it(`${mode} 모드: ${sel.split('"] ')[1]} 는 ${MIN} 이상`, () => {
        expect(pairRatio(loadTheme('hero-comic', mode), sel)).toBeGreaterThanOrEqual(MIN);
      });
    }
  }
});

describe('joseon-shrine 푸터 버튼 호버 대비', () => {
  it('호버 글자색이 푸터 배경(반투명 패널 + 아래 하늘색 그라데이션 어느 지점이든) 위에서 4.5 이상', () => {
    const t = loadTheme('joseon-shrine', 'light');
    const hover = t.color(t.style('[data-footer-theme="joseon-shrine"] .gt-footer-btn:hover').color);
    const panel = t.color(t.style('[data-footer-theme="joseon-shrine"] .gt-footer').background);
    expect(hover).not.toBeNull();
    expect(panel).not.toBeNull();
    for (const key of ['--js-bg1', '--js-bg2', '--js-bg3']) {
      const sky = t.color(t.vars[key]);
      expect(contrast(hover, composite(panel, sky)), key).toBeGreaterThanOrEqual(MIN);
    }
  });
});

describe('gt-macro-accent-bg 글자 대비', () => {
  it('wuxia-ink 다크 모드는 4.5 이상', () => {
    expect(pairRatio(loadTheme('wuxia-ink', 'dark'), '[data-genre-theme="wuxia-ink"] .gt-macro-accent-bg')).toBeGreaterThanOrEqual(MIN);
  });
  it('hunter-hologram 다크 모드는 4.5 이상', () => {
    expect(pairRatio(loadTheme('hunter-hologram', 'dark'), '[data-genre-theme="hunter-hologram"] .gt-macro-accent-bg')).toBeGreaterThanOrEqual(MIN);
  });
  it('수정하지 않은 라이트 모드는 그대로 3 이상을 유지한다(다크 전용 덮어쓰기가 라이트를 건드리지 않는다)', () => {
    expect(pairRatio(loadTheme('wuxia-ink', 'light'), '[data-genre-theme="wuxia-ink"] .gt-macro-accent-bg')).toBeGreaterThanOrEqual(3);
    expect(pairRatio(loadTheme('hunter-hologram', 'light'), '[data-genre-theme="hunter-hologram"] .gt-macro-accent-bg')).toBeGreaterThanOrEqual(3);
  });
});

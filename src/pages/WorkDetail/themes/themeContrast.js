// Copyright (c) dendr000. MIT License.
// 장르 테마 CSS를 읽어 "이 선택자의 글자색/배경색이 라이트·다크 모드에서 어떻게 계산되는가"를 구하고
// 두 색의 대비를 재는 시험용 도구. 정적 계산이라 호버·그라데이션 위 글자는 호출하는 쪽이 배경을 따로 정해 넘긴다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const THEME_DIR = path.dirname(fileURLToPath(import.meta.url));
const DARK_PREFIX = '[data-theme="dark"]';

const parseRules = (css) =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    sel: m[1].trim().replace(/\s+/g, ' '),
    decl: m[2],
  }));

const parseDecl = (decl) => {
  const out = {};
  for (const part of decl.split(';')) {
    const i = part.indexOf(':');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).replace(/!important/, '').trim();
  }
  return out;
};

const hexToRgb = (h) => {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};

export const luminance = ([r, g, b]) => {
  const f = (v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export const contrast = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

// rgba(r,g,b,a) 를 배경색 위에 올렸을 때의 불투명 색
export const composite = ([r, g, b, a], bg) => [r, g, b].map((v, i) => v * a + bg[i] * (1 - a));

export const loadTheme = (name, mode) => {
  const rules = parseRules(fs.readFileSync(path.join(THEME_DIR, `${name}.css`), 'utf8'));
  const vars = {};
  for (const r of rules) {
    if (r.sel.startsWith(DARK_PREFIX) && mode !== 'dark') continue;
    for (const [k, v] of Object.entries(parseDecl(r.decl))) if (k.startsWith('--')) vars[k] = v;
  }

  // 값 하나를 색으로 푼다: 16진수, var(), rgba() 를 지원한다. 못 풀면 null.
  const color = (value, depth = 0) => {
    if (!value || depth > 6) return null;
    const v = value.trim();
    const ref = v.match(/^var\((--[\w-]+)\)$/);
    if (ref) return color(vars[ref[1]], depth + 1);
    if (/^#[0-9a-f]{3,6}$/i.test(v)) return hexToRgb(v);
    const rgba = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/);
    if (rgba) return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])];
    return null;
  };

  // 선택자(공백 정규화) 하나에 적용되는 선언을 합친다. 다크 모드에서는 [data-theme="dark"] 접두 규칙이 위에 덮는다.
  const style = (selector) => {
    const merged = {};
    const apply = (wantDark) => {
      for (const r of rules) {
        const isDark = r.sel.startsWith(DARK_PREFIX);
        if (isDark !== wantDark) continue;
        const bare = isDark ? r.sel.slice(DARK_PREFIX.length).trim() : r.sel;
        if (bare.split(',').map((s) => s.trim()).includes(selector)) Object.assign(merged, parseDecl(r.decl));
      }
    };
    apply(false);
    if (mode === 'dark') apply(true);
    return merged;
  };

  return { vars, color, style };
};

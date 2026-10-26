// Copyright (c) dendr000. MIT License.
// assets/icons/*.svg 를 이름으로 꺼내 쓰는 등록부. 이모지 대신 쓰는 UI 아이콘의 단일 출처다.
// svg 를 문자열로 불러와(?raw) 화면에 직접 끼우므로 fill="currentColor" 가 주변 글자색을 따라 라이트/다크가 저절로 맞는다.
// (<img src> 로 쓰면 currentColor 가 적용되지 않는다.)
const modules = import.meta.glob('../../../assets/icons/*.svg', { eager: true, query: '?raw', import: 'default' });

const SVGS = {};
for (const [file, raw] of Object.entries(modules)) {
  const name = file.split('/').pop().replace(/\.svg$/, '');
  SVGS[name] = String(raw).replace(/<!--[\s\S]*?-->/g, '').trim();
}

export const ICON_NAMES = Object.keys(SVGS);

export const getIconSvg = (name) => (Object.prototype.hasOwnProperty.call(SVGS, name) ? SVGS[name] : '');

// 문자열 HTML(매크로 위젯, 북마크 등 React 밖에서 만드는 HTML)에 끼울 아이콘. 등록된 이름만 쓴다.
export const iconHtml = (name, extraClass = '') => {
  const svg = getIconSvg(name);
  if (!svg) return '';
  return `<span class="gi gi-${name}${extraClass ? ` ${extraClass}` : ''}" aria-hidden="true">${svg}</span>`;
};

// 아이콘 칸: 글자 크기(1em)에 맞추고 글자 줄에 자연스럽게 앉는다. 앱 화면과 공개용 내보내기가 같은 규칙을 쓴다.
export const ICON_CSS = `
.gi { display: inline-flex; width: 1em; height: 1em; vertical-align: -0.15em; flex-shrink: 0; line-height: 1; }
.gi > svg { width: 100%; height: 100%; display: block; }
/* 글자 앞에 붙는 아이콘(lead)은 글자와 살짝 띄운다 */
.gi-lead { margin-right: 0.35em; }
`;

export const injectIconStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('galpi-icon-styles')) return;
  const style = document.createElement('style');
  style.id = 'galpi-icon-styles';
  style.textContent = ICON_CSS;
  document.head.appendChild(style);
};

// 불러오는 즉시 한 번 넣어 두면 Icon 컴포넌트와 문자열 HTML 아이콘 모두 따로 신경 쓰지 않아도 된다.
injectIconStyles();

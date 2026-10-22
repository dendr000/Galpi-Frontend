// Copyright (c) dendr000. MIT License.
// 공개용 내보내기: 준비된 데이터(model)로 단일 HTML 문서 문자열을 만드는 순수 함수.
// 외부 스크립트나 파일을 쓰지 않고, 사용자 입력 글자는 모두 이스케이프한다. 본문 HTML(개요, 설정, 문서, 상세)은
// 갈피 마크다운 변환기가 만든 것을 그대로 넣는다.
import { EXPORT_CSS } from './exportStyles';

export const escapeHtml = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const ratingsHtml = ({ axes, scale }) => {
  const hasAxes = axes && axes.length > 0;
  const hasScale = scale && scale.length > 0;
  if (!hasAxes && !hasScale) return '';
  const table = (title, heads, rows) =>
    `<h3 class="group">${escapeHtml(title)}</h3><table class="plain"><thead><tr>${heads.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`;
  return `<section class="block" id="ratings"><h2>등급 기준표</h2>${
    hasAxes ? table('판정 축', ['약칭', '속성'], axes.map((a) => [a.abbr, a.key])) : ''
  }${hasScale ? table('등급 기준', ['등급', '명칭', '기준'], scale.map((s) => [String(s.level), s.name, s.desc])) : ''}</section>`;
};

const cardHtml = (c, withId) => {
  const idAttr = withId ? ` id="char-${escapeHtml(c.id)}"` : '';
  const stamp = c.secret ? '<span class="stamp">기밀</span>' : '';
  const sub = c.subtitle ? `<div class="sub">${escapeHtml(c.subtitle)}</div>` : '';
  if (c.masked) {
    return `<article class="card masked"${idAttr}>${stamp}<div class="masked-note">기밀</div><div class="body"><h4>${escapeHtml(c.name)}</h4></div></article>`;
  }
  const img = c.imgSrc ? `<img class="portrait" src="${escapeHtml(c.imgSrc)}" alt="${escapeHtml(c.name)}">` : '';
  const rows = (c.props || []).map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('');
  const table = rows ? `<table><tbody>${rows}</tbody></table>` : '';
  const badges = (c.badges || []).length
    ? `<div class="badges">${c.badges.map((b) => `<span class="badge" title="${escapeHtml(b.title)}">${escapeHtml(`${b.abbr} ${b.level}`)}</span>`).join('')}</div>`
    : '';
  const detail = c.detailHtml ? `<details class="detail"><summary>상세 설정</summary><div class="markdown-body">${c.detailHtml}</div></details>` : '';
  return `<article class="card"${idAttr}>${stamp}${img}<div class="body"><h4>${escapeHtml(c.name)}</h4>${sub}${badges}${table}${detail}</div></article>`;
};

const charactersHtml = (groups) => {
  const seen = new Set(); // 같은 인물이 여러 그룹에 나오면 id 는 처음 한 번만 붙인다
  const withId = (c) => { const first = !seen.has(String(c.id)); seen.add(String(c.id)); return first; };
  const nonEmpty = (groups || []).filter((g) => g.chars.length > 0);
  if (nonEmpty.length === 0) return '';
  return `<section class="block" id="characters"><h2>등장인물</h2>${nonEmpty
    .map((g) => `<h3 class="group">${escapeHtml(g.name)} <span>(${g.chars.length})</span></h3><div class="cards">${g.chars.map((c) => cardHtml(c, withId(c))).join('')}</div>`)
    .join('')}</section>`;
};

const pagesHtml = (pages, ids) => {
  if (!pages || pages.length === 0) return '';
  return `<section class="block" id="pages"><h2>문서</h2>${pages
    .map((p) => {
      const members = (p.members || []).length
        ? `<div class="members"><strong>소속 인물</strong><br>${p.members
            .map((m) => (ids.has(String(m.id)) ? `<a href="#char-${escapeHtml(m.id)}">${escapeHtml(m.name)}</a>` : `<span>${escapeHtml(m.name)}</span>`))
            .join('')}</div>`
        : '';
      return `<article id="page-${escapeHtml(p.id)}"><h3 class="group">${escapeHtml(p.title)}</h3><div class="markdown-body">${p.html || ''}</div>${members}</article>`;
    })
    .join('')}</section>`;
};

export const buildExportHtml = (m) => {
  const ids = new Set((m.groups || []).flatMap((g) => g.chars.map((c) => String(c.id))));
  const overview = m.overviewHtml ? `<section class="block" id="overview"><h2>개요</h2><div class="markdown-body">${m.overviewHtml}</div></section>` : '';
  const settings = m.settingsHtml ? `<section class="block" id="settings"><h2>설정</h2><div class="markdown-body">${m.settingsHtml}</div></section>` : '';
  const ratings = ratingsHtml(m.ratings || {});
  const characters = charactersHtml(m.groups);
  const pages = pagesHtml(m.pages, ids);

  const tocItems = [
    overview && ['overview', '개요'],
    settings && ['settings', '설정'],
    ratings && ['ratings', '등급 기준표'],
    characters && ['characters', '등장인물'],
    pages && ['pages', '문서'],
  ].filter(Boolean);
  const toc = tocItems.length ? `<nav class="toc">${tocItems.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('')}</nav>` : '';

  const meta = [m.creator && `제작자 ${escapeHtml(m.creator)}`, m.genre && escapeHtml(m.genre), m.status && escapeHtml(m.status)].filter(Boolean).join(' · ');
  const cover = m.coverSrc ? `<img class="cover" src="${escapeHtml(m.coverSrc)}" alt="">` : '';

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(m.title)}</title>
<style>${EXPORT_CSS}</style>
</head>
<body>
<div class="wrap">
<header class="hero">${cover}<div class="hero-body"><h1>${escapeHtml(m.title)}</h1><div class="meta">${meta}</div></div></header>
${toc}
${overview}
${settings}
${ratings}
${characters}
${pages}
<footer class="foot">갈피(Galpi)에서 ${escapeHtml(m.generatedAt)}에 내보냄</footer>
</div>
</body>
</html>
`;
};

// Copyright (c) dendr000. MIT License.
// 공개용 내보내기 HTML 에 넣는 스타일. 앱의 전역 CSS 변수에 기대던 매크로 위젯이 단독 파일에서도 보이도록
// 같은 이름의 변수를 정의하고, 라이트/다크는 브라우저 설정(prefers-color-scheme)을 따른다.
import { MACRO_STYLE_CSS } from '../../../utils/markdown/styleInjector';

const BASE_CSS = `
:root {
  --bg-color: #f4f5f7; --surface-color: #ffffff; --table-bg-alt: #f1f3f5;
  --text-primary: #212529; --text-secondary: #5f6670; --border-color: #dee2e6;
  --primary-color: #3b5bdb; --shadow-sm: 0 1px 3px rgba(0,0,0,0.08); --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #15171c; --surface-color: #1e2128; --table-bg-alt: #262a33;
    --text-primary: #e8eaee; --text-secondary: #a3a9b5; --border-color: #363b47;
    --primary-color: #7c9cff; --shadow-sm: 0 1px 3px rgba(0,0,0,0.4); --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg-color); color: var(--text-primary); font-family: 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif; line-height: 1.7; }
a { color: var(--primary-color); }
.wrap { max-width: 980px; margin: 0 auto; padding: 24px 16px 60px; }
header.hero { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; margin-bottom: 18px; box-shadow: var(--shadow-sm); }
.cover { display: block; width: 100%; max-height: 320px; object-fit: cover; }
.hero-body { padding: 18px 22px; }
.hero h1 { margin: 0 0 6px 0; font-size: 28px; }
.meta { color: var(--text-secondary); font-size: 14px; }
nav.toc { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
nav.toc a { padding: 4px 12px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--surface-color); text-decoration: none; font-size: 13px; font-weight: 700; color: var(--text-primary); }
section.block { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px 22px; margin-bottom: 22px; box-shadow: var(--shadow-sm); }
section.block > h2 { margin: 0 0 14px 0; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); font-size: 21px; }
h3.group { margin: 22px 0 12px 0; font-size: 17px; color: var(--primary-color); }
h3.group span { color: var(--text-secondary); font-weight: 400; font-size: 14px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.card { border: 1px solid var(--border-color); border-radius: 10px; background: var(--surface-color); overflow: hidden; position: relative; }
.card .portrait { display: block; width: 100%; height: 220px; object-fit: cover; object-position: top; background: var(--table-bg-alt); }
.card .body { padding: 12px 14px; }
.card h4 { margin: 0; font-size: 16px; }
.card .sub { color: var(--text-secondary); font-size: 12.5px; margin-top: 2px; }
.card table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
.card th { width: 34%; text-align: left; color: var(--text-secondary); font-weight: 600; padding: 3px 6px 3px 0; vertical-align: top; }
.card td { padding: 3px 0; word-break: keep-all; }
.badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.badge { display: inline-block; padding: 1px 8px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 11.5px; font-weight: 700; }
.stamp { display: inline-block; padding: 1px 8px; border: 2px solid #c92a2a; border-radius: 3px; color: #c92a2a; background: rgba(255,255,255,0.92); font-size: 11px; font-weight: 900; letter-spacing: 0.18em; transform: rotate(-6deg); }
.card .stamp { position: absolute; top: 10px; right: 10px; }
.card.masked .masked-note { padding: 40px 14px; text-align: center; color: var(--text-secondary); background: var(--table-bg-alt); font-weight: 700; }
details.detail { margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 8px; }
details.detail summary { cursor: pointer; font-weight: 700; font-size: 13px; color: var(--primary-color); }
table.plain { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px; }
table.plain th, table.plain td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border-color); }
table.plain th { background: var(--table-bg-alt); }
.members { margin-top: 14px; font-size: 14px; }
.members a, .members span { display: inline-block; margin: 2px 8px 2px 0; }
.md-box { margin: 10px 0; }
.markdown-body img { max-width: 100%; }
.markdown-body table { border-collapse: collapse; }
.markdown-body th, .markdown-body td { border: 1px solid var(--border-color); padding: 6px 10px; }
.markdown-body h2 { border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-top: 24px; }
.markdown-body h3, .markdown-body h4 { border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-top: 20px; }
.wiki-backlink { color: var(--primary-color); font-weight: 900; }
/* 스포일러: 인라인 마우스 이벤트는 안전을 위해 제거하므로 CSS 호버로 내용을 보여 준다 */
.galpi-spoiler:hover { color: #ffffff !important; }
footer.foot { color: var(--text-secondary); font-size: 12.5px; text-align: center; margin-top: 28px; }
`;

export const EXPORT_CSS = `${BASE_CSS}\n${MACRO_STYLE_CSS}`;

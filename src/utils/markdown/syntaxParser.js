// 파일 위치: src/utils/markdown/syntaxParser.js
import { injectMacroStyles } from './styleInjector';

// 코드와 관계도 JSON 은 갈피 문법을 적용하지 않는다. 처리하는 동안 자리표시자로 바꿔 두었다가 마지막에 되돌린다.
const PH_OPEN = '';
const PH_CLOSE = '';
const PH_RE = new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, 'g');

// 인라인 서식. 글자나 숫자에 붙은 기호(3~5명, max_hp_value, 10--20)는 서식의 시작으로 보지 않는다.
const BOLD_TILDE = /(?<![\p{L}\p{N}~])~(?!\s)([^~\n]+?)(?<!\s)~/gu;
const ITALIC_CELL = /(?<![\p{L}\p{N}_])_(?!\s)(.+?)(?<!\s)_/gu;
const STRIKE = /(?<![\\\p{L}\p{N}])--(?!\s)(.+?)(?<!\s)--/gu;
const ITALIC_LINE = /(^|\s)_([^\s_][^_]*[^\s_]|[^\s_])_(\s|[.,!?]|$)/g;

const STRIKE_HTML = '<del style="opacity:0.6;">$1</del>';

// 표 밖 한 줄의 서식
const applyLineStyle = (line) => line
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(ITALIC_LINE, '$1<em>$2</em>$3')
    .replace(STRIKE, STRIKE_HTML);

// 표 셀 하나의 서식. 표 편집기는 굵게를 ~내용~ 으로, 줄바꿈을 [br] 로 저장한다.
const applyCellStyle = (cell) => cell
    .replace(/\s*\[br\]\s*/g, '<br>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(BOLD_TILDE, '<strong>$1</strong>')
    .replace(ITALIC_CELL, '<em>$1</em>')
    .replace(STRIKE, STRIKE_HTML);

// 표의 행: ||칸||칸|| 형태. 맨 끝의 || 를 빼먹어도(||칸||칸) 칸 구분이 있으면 행으로 본다.
const isTableRow = (line) => {
    const t = line.trim();
    if (!t.startsWith('||')) return false;
    if (t.length >= 4 && t.endsWith('||')) return true;
    return t.slice(2).includes('||');
};
const closeRow = (t) => (t.endsWith('||') ? t : `${t}||`);

// 색 문법에 쓸 수 있는 이름. 그 밖의 [영문:내용] 은 [HP: 100/100] 같은 일반 글자라 건드리지 않는다.
const COLOR_NAMES = new Set(['red', 'blue', 'black', 'white', 'green', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'brown', 'cyan',
    'magenta', 'navy', 'teal', 'gold', 'silver', 'lime', 'indigo', 'violet', 'crimson', 'coral', 'maroon', 'olive', 'aqua', 'skyblue',
    'tomato', 'salmon', 'khaki', 'beige', 'ivory', 'lavender', 'turquoise', 'orchid', 'plum', 'tan', 'sienna', 'chocolate', 'hotpink']);
const isColorToken = (k) => /^#[0-9a-f]{3,8}$/i.test(k) || COLOR_NAMES.has(k.toLowerCase());
const isColorKey = (key) => (key.toLowerCase().startsWith('bg-') ? isColorToken(key.slice(3)) : isColorToken(key));
// 안쪽 대괄호는 두 겹까지 허용한다([red:[[링크]] 님], [red:[blue:x]]).
const COLOR_RE = /\[([a-zA-Z0-9#-]+):((?:[^[\]]|\[(?:[^[\]]|\[[^[\]]*\])*\])*)\]/g;

const colorSpan = (colorKey, content) => {
    let color = colorKey; let bg = "transparent"; const k = colorKey.toLowerCase();
    if (k === 'red') color = '#e53e3e'; else if (k === 'blue') color = 'var(--primary-color)'; else if (k === 'black') color = 'var(--text-primary)'; else if (k === 'white') color = '#ffffff';
    else if (k.startsWith('bg-')) { color = 'var(--text-primary)'; bg = k.replace('bg-', '') === 'yellow' ? 'rgba(253, 224, 71, 0.6)' : k.replace('bg-', ''); }
    return `<span style="color:${color}; background-color:${bg}; font-weight:bold; border-radius:2px; padding:0 2px;">${content}</span>`;
};

export const parseWikiText = (text) => {
    if (!text) return "";
    injectMacroStyles(); // 글로벌 CSS 안전 주입

    const stash = [];
    const hold = (m) => { stash.push(m); return `${PH_OPEN}${stash.length - 1}${PH_CLOSE}`; };
    let preText = text
        .replace(/```[\s\S]*?```/g, hold)
        .replace(/`[^`\n]+`/g, hold)
        .replace(/\[RELATION_GRAPH\][\s\S]*?\[\/RELATION_GRAPH\]/g, hold);

    preText = preText.replace(/\[META_DATA:/g, '▤META_START▤:');

    preText = preText.replace(/\[폰트:(.*?):([\s\S]*?)\]/g, (match, fontName, content) => {
        const fontMap = { '궁서': "'Gungsuh', '궁서', serif", '바탕': "'Batang', '바탕', serif", '돋움': "'Dotum', '돋움', sans-serif", '굴림': "'Gulim', '굴림', sans-serif", '명조': "'Noto Serif KR', serif" };
        // ★ 하드코딩된 폰트가 아닐 경우, 동적 주입된 폰트 이름(displayName)을 폰트 패밀리로 렌더링하도록 픽스
        const family = fontMap[fontName.trim()] || `'${fontName.trim()}', sans-serif`;
        return `<span style="font-family: ${family};">${content}</span>`;
    });
    preText = preText.replace(/\[크기:([0-9]+):([\s\S]*?)\]/g, (match, size, content) => `<span style="font-size: ${size}px;">${content}</span>`);
    preText = preText.replace(/\[정렬:(좌측|중앙|우측):([\s\S]*?)\]/g, (match, alignName, content) => {
        let align = alignName === "중앙" ? "center" : (alignName === "우측" ? "right" : "left");
        return `<div style="text-align: ${align}; width: 100%; margin: 10px 0;">${content}</div>`;
    });
    preText = preText.replace(/\[들여쓰기:([\s\S]*?)\]/g, (match, content) => {
        let indented = content.split('\n').map(line => line.trim() ? `<div style="text-indent: 1.5em; margin: 4px 0;">${line}</div>` : line).join('\n');
        return `<div style="margin: 10px 0;">${indented}</div>`;
    });

    // 표의 줄은 건드리지 않는다(칸 단위로 아래에서 처리). 표 밖 줄만 서식을 적용한다.
    preText = preText.split('\n').map((l) => (isTableRow(l) ? l : applyLineStyle(l))).join('\n');

    // 색: 안쪽부터 바꿔 가며 중첩을 풀고, 색 이름이 아닌 [영문:내용] 은 그대로 둔다.
    for (let i = 0; i < 6; i++) {
        let changed = false;
        preText = preText.replace(COLOR_RE, (match, colorKey, content) => {
            if (!isColorKey(colorKey)) return match;
            changed = true;
            return colorSpan(colorKey, content);
        });
        if (!changed) break;
    }

    let lines = preText.split('\n');
    let inQuote = false; let quoteBuffer = [];
    let inTable = false; let tableBuffer = [];
    let newLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i]; let trimmed = line.trim();

        if (isTableRow(line)) {
            if (inQuote) { newLines.push(`\n<div class="galpi-ext-quote">${quoteBuffer.join('<br>')}</div>\n`); inQuote = false; quoteBuffer = []; }
            if (!inTable) {
                inTable = true;
                tableBuffer.push('<div style="overflow-x:auto; margin: 15px 0;"><table class="gt-table" style="width:100%; border-collapse:collapse; background:var(--surface-color); font-size:13px; border-radius:8px; border-style:hidden; box-shadow:0 0 0 1px var(--border-color), 0 2px 8px rgba(0,0,0,0.02);"><tbody>');
            }
            const closed = closeRow(trimmed);
            let cells = closed.substring(2, closed.length - 2).split('||');
            let isHeaderRow = tableBuffer.length === 1;
            tableBuffer.push('<tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s;">');

            cells.forEach(cell => {
                let cellContent = cell.trim();
                let align = isHeaderRow ? 'center' : 'left'; // 헤더는 중앙, 내용은 좌측을 기본값으로 지정
                let colSpan = 1;
                let rowSpan = 1;
                let headCol = false;
                let noRowHeader = false;

                let match = cellContent.match(/^<([a-z0-9,\-|]+)>/i);
                if (match) {
                    let isValid = false;
                    match[1].split(',').forEach(tag => {
                        let t = tag.trim();
                        if (['left', 'center', 'right'].includes(t)) { align = t; isValid = true; }
                        else if (t.startsWith('-') && !isNaN(parseInt(t.substring(1)))) { colSpan = parseInt(t.substring(1)); isValid = true; }
                        else if (t.startsWith('|') && !isNaN(parseInt(t.substring(1)))) { rowSpan = parseInt(t.substring(1)); isValid = true; }
                        else if (t === 'h') { headCol = true; isValid = true; }
                        else if (t === 'nr') { noRowHeader = true; isValid = true; }
                    });
                    if (isValid) cellContent = cellContent.substring(match[0].length).trim();
                }

                // 표 편집기(TableEditor)에서 "열 헤더" 토글로 지정한 열은 0번 행이 아니어도
                // th로 렌더링한다 — 0번 행(isHeaderRow)과는 독립적인, 별도의 열 기준 헤더 지정.
                // 반대로 <nr> 태그가 붙은 0번 행 셀은 "행 헤더 끄기"로 옵트아웃된 것이므로
                // 위치만 보고 무조건 th로 되돌리지 않는다.
                let isHeaderCell = (isHeaderRow && !noRowHeader) || headCol;

                cellContent = applyCellStyle(cellContent);

                let bg = isHeaderCell ? 'background:var(--table-bg-alt); font-weight:900; color:var(--primary-color);' : 'color:var(--text-primary);';
                let tag = isHeaderCell ? 'th' : 'td';

                let attrs = '';
                if (colSpan > 1) attrs += ` colspan="${colSpan}"`;
                if (rowSpan > 1) attrs += ` rowspan="${rowSpan}"`;

                tableBuffer.push(`<${tag}${attrs} style="border:1px solid var(--border-color); padding:10px 14px; text-align:${align}; ${bg}">${cellContent}</${tag}>`);
            });
            tableBuffer.push('</tr>');
            continue;
        } else {
            if (inTable) { tableBuffer.push('</tbody></table></div>\n'); newLines.push(tableBuffer.join('')); inTable = false; tableBuffer = []; }
        }

        if (line.match(/^\|[ \t]*(.*)/) && !trimmed.startsWith('||')) {
            inQuote = true; quoteBuffer.push(line.replace(/^\|[ \t]*/, ''));
        } else {
            if (inQuote) { newLines.push(`\n<div class="galpi-ext-quote">${quoteBuffer.join('<br>')}</div>\n`); inQuote = false; quoteBuffer = []; }
            newLines.push(line);
        }
    }
    if (inTable) { tableBuffer.push('</tbody></table></div>\n'); newLines.push(tableBuffer.join('')); }
    if (inQuote) { newLines.push(`\n<div class="galpi-ext-quote">${quoteBuffer.join('<br>')}</div>\n`); }
    preText = newLines.join('\n');

    preText = preText.replace(/▤META_START▤:/g, '[META_DATA:');

    // ★ 누락되었던 백링크 [[문서명]] 파싱 정규식 추가
    // [[이름|표시글]] 은 표시글을 보여 주고 이동은 이름으로 한다.
    preText = preText.replace(/\[\[(.*?)\]\]/g, (m, inner) => {
        const bar = inner.indexOf('|');
        if (bar <= 0 || bar === inner.length - 1) return `<span class="wiki-backlink">${inner}</span>`;
        const target = inner.slice(0, bar).trim().replace(/"/g, '&quot;');
        return `<span class="wiki-backlink" data-target="${target}">${inner.slice(bar + 1).trim()}</span>`;
    });

    // ★ 각주 [* 내용] 파서 강화 (멀티라인 감지 및 br 태그 치환으로 팝오버 줄바꿈 허용)
    let fnCount = 1;
    preText = preText.replace(/\[\*([\s\S]*?)\]/g, (match, content) => {
        const num = fnCount++;
        const escaped = content.trim().replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        return `<sup class="wiki-footnote" data-content="${escaped}" style="cursor:help; color:var(--primary-color); font-weight:bold;">[${num}]</sup>`;
    });

    return preText.replace(PH_RE, (m, i) => stash[Number(i)]);
};

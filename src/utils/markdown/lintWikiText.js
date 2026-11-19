// Copyright (c) dendr000. MIT License.
// 갈피 문법을 잘못 쓴 곳을 저장 전에 찾아 알려 주는 순수 검사기. 본문은 바꾸지 않고 [{ line, message }] 만 돌려준다.
// 코드(``` 블록, `인라인`) 안의 글은 문법 예시이므로 검사하지 않는다.
import { isColorKey } from './syntaxParser';

const PAIRS = [
  { open: /\[로그탭:/g, close: /\[\/로그탭\]/g, openLabel: '[로그탭:이름]', closeLabel: '[/로그탭]' },
  { open: /\[스포일러\]/g, close: /\[\/스포일러\]/g, openLabel: '[스포일러]', closeLabel: '[/스포일러]' },
  { open: /\[대화:/g, close: /\[\/대화\]/g, openLabel: '[대화: 이름:]', closeLabel: '[/대화]' },
  { open: /\[우대화:/g, close: /\[\/우대화\]/g, openLabel: '[우대화: 이름:]', closeLabel: '[/우대화]' },
  { open: /\[TIMELINE\]/g, close: /\[\/TIMELINE\]/g, openLabel: '[TIMELINE]', closeLabel: '[/TIMELINE]' },
  { open: /\[RELATION_GRAPH\]/g, close: /\[\/RELATION_GRAPH\]/g, openLabel: '[RELATION_GRAPH]', closeLabel: '[/RELATION_GRAPH]' },
];

const blank = (m) => m.replace(/[^\n]/g, ' ');
const isRow = (l) => { const t = l.trim(); return t.startsWith('||') && (t.length >= 4 && t.endsWith('||') || t.slice(2).includes('||')); };
const cellCount = (l) => { const t = l.trim(); const c = t.endsWith('||') ? t : `${t}||`; return c.slice(2, -2).split('||').length; };

export const lintWikiText = (text) => {
  if (!text) return [];
  const src = text.replace(/```[\s\S]*?```/g, blank).replace(/`[^`\n]+`/g, blank);
  const lineOf = (idx) => src.slice(0, idx).split('\n').length;
  const warns = [];
  const add = (line, message) => warns.push({ line, message });

  // 짝이 있는 문법: 여는 것과 닫는 것의 수가 맞는지
  PAIRS.forEach((p) => {
    const events = [];
    for (const m of src.matchAll(p.open)) events.push({ idx: m.index, open: true });
    for (const m of src.matchAll(p.close)) events.push({ idx: m.index, open: false });
    events.sort((a, b) => a.idx - b.idx);
    const stack = [];
    events.forEach((e) => {
      if (e.open) stack.push(e.idx);
      else if (stack.length) stack.pop();
      else add(lineOf(e.idx), `${p.openLabel} 없이 ${p.closeLabel} 만 있습니다.`);
    });
    stack.forEach((idx) => add(lineOf(idx), `${p.openLabel} 를 닫는 ${p.closeLabel} 가 없습니다.`));
  });

  const lines = src.split('\n');

  // 색 문법: 같은 줄 안에서 닫는 ] 가 있어야 한다
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\[((?:bg-)?[a-zA-Z0-9#-]+):/g)) {
      if (!isColorKey(m[1])) continue;
      let depth = 0; let closed = false;
      for (let k = m.index; k < line.length; k++) {
        if (line[k] === '[') depth++;
        else if (line[k] === ']') { depth--; if (depth === 0) { closed = true; break; } }
      }
      if (!closed) add(i + 1, `색 문법 [${m[1]}:...] 에 닫는 ] 가 없습니다.`);
    }
  });

  // 각주: [* 내용] 은 여러 줄이어도 되지만 닫는 ] 는 있어야 한다
  for (const m of src.matchAll(/\[\*/g)) {
    if (!src.includes(']', m.index)) add(lineOf(m.index), '각주 [* 내용] 에 닫는 ] 가 없습니다.');
  }

  // 표: 연속된 행의 칸 수가 같은지(병합 표시가 있는 표는 건너뛴다)
  for (let i = 0; i < lines.length; i++) {
    if (!isRow(lines[i])) continue;
    let j = i;
    while (j + 1 < lines.length && isRow(lines[j + 1])) j++;
    const block = lines.slice(i, j + 1);
    if (!block.some((l) => /<[-|]\d+/.test(l))) {
      const n = cellCount(block[0]);
      block.forEach((l, k) => { if (k > 0 && cellCount(l) !== n) add(i + k + 1, `표의 칸 수가 윗줄(${n}칸)과 다릅니다.`); });
    }
    i = j;
  }

  // 제목: 단계를 건너뛰지 않았는지(# 다음에 ### 처럼)
  let prev = 0;
  lines.forEach((line, i) => {
    const m = line.match(/^(#{1,6})\s/);
    if (!m) return;
    const level = m[1].length;
    if (prev > 0 && level > prev + 1 && level <= 3) add(i + 1, `제목 단계를 건너뛰었습니다(${'#'.repeat(prev)} 다음에 ${'#'.repeat(level)}).`);
    prev = level;
  });

  return warns.sort((a, b) => a.line - b.line);
};

// Copyright (c) dendr000. MIT License.
// 캐릭터 목록 위의 칩 필터(소속, 등급) 순수 로직. 같은 그룹 안은 OR, 그룹 사이는 AND.
import { getPropValue } from './characterSort';
import { splitAffiliations } from '../work/organization';
import { normalizeName } from '../work/backlink';

export const FILTER_KEYS = ['소속', '등급'];

// 한 캐릭터의 그 속성 값 목록(쉼표로 쪼개고, *로 시작하는 값과 겹치는 값은 뺌). 비교는 정규화한 이름으로 한다.
const valuesOf = (char, key) => {
  const seen = new Set();
  const out = [];
  for (const p of splitAffiliations(getPropValue(char, key))) {
    if (p.plain) continue;
    const norm = normalizeName(p.text);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push({ text: p.text, norm });
  }
  return out;
};

// 칩으로 보여 줄 그룹: [{ key, options: [{ value, count }] }]. 값이 하나도 없는 그룹은 뺀다.
export const collectFilterGroups = (chars, keys = FILTER_KEYS) => {
  if (!Array.isArray(chars)) return [];
  const groups = [];
  for (const key of keys) {
    const byNorm = new Map(); // norm -> { value(처음 쓴 표기), count }
    for (const c of chars) {
      for (const v of valuesOf(c, key)) {
        const hit = byNorm.get(v.norm);
        if (hit) hit.count += 1;
        else byNorm.set(v.norm, { value: v.text, count: 1 });
      }
    }
    if (byNorm.size > 0) groups.push({ key, options: [...byNorm.values()] });
  }
  return groups;
};

// selection: { 속성이름: [선택한 값들] }. 선택이 없는 그룹은 조건에서 뺀다.
export const filterChars = (chars, selection) => {
  const active = Object.entries(selection || {}).filter(([, vals]) => Array.isArray(vals) && vals.length > 0);
  if (active.length === 0) return [...chars];
  return chars.filter((c) =>
    active.every(([key, vals]) => {
      const wanted = new Set(vals.map(normalizeName));
      return valuesOf(c, key).some((v) => wanted.has(v.norm));
    })
  );
};

// 값 하나를 켜고 끈 새 선택을 돌려준다. 그룹의 마지막 값을 끄면 그 그룹 항목을 지운다.
export const toggleFilterValue = (selection, key, value) => {
  const current = (selection && selection[key]) || [];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  const out = { ...selection };
  if (next.length > 0) out[key] = next; else delete out[key];
  return out;
};

export const hasActiveFilter = (selection) =>
  Object.values(selection || {}).some((vals) => Array.isArray(vals) && vals.length > 0);

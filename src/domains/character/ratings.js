// Copyright (c) dendr000. MIT License.
// 작품별 등급(위험도, 유용성 등) 설정을 읽고 캐릭터의 등급 배지 정보를 계산하는 순수 로직.
// 설정은 작품 메타의 문자열 두 개: ratingAxes("속성이름:약칭" 줄), ratingScale("등급:명칭:기준" 줄).
import { getPropValue } from './characterSort';

const lines = (str) => (typeof str === 'string' ? str.split(/\r?\n/) : []);

// "속성이름:약칭" 줄들 -> [{ key, abbr }]. 약칭이 없으면 이름 첫 글자(영문은 대문자), 같은 속성은 한 번만.
export const parseRatingAxes = (str) => {
  const out = [];
  for (const line of lines(str)) {
    const i = line.indexOf(':');
    const key = (i === -1 ? line : line.slice(0, i)).trim();
    if (!key || out.some((a) => a.key === key)) continue;
    const abbr = (i === -1 ? '' : line.slice(i + 1).trim()) || key.charAt(0).toUpperCase();
    out.push({ key, abbr });
  }
  return out;
};

// "등급:명칭:기준" 줄들 -> [{ level, name, desc }] (등급 순). 등급이 숫자가 아닌 줄은 건너뛴다.
export const parseRatingScale = (str) => {
  const out = [];
  for (const line of lines(str)) {
    const parts = line.split(':');
    const level = Number(parts[0].trim());
    if (parts[0].trim() === '' || Number.isNaN(level)) continue;
    out.push({ level, name: (parts[1] || '').trim(), desc: parts.slice(2).join(':').trim() });
  }
  return out.sort((a, b) => a.level - b.level);
};

const firstNumber = (s) => {
  const m = String(s).match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};

// 캐릭터의 등급 배지 정보. 값이 없거나 숫자가 없는 속성은 건너뛴다. 기준표에 없는 등급은 명칭과 기준이 빈 채로 돌려준다.
export const getRatings = (char, axes, scale) => {
  if (!Array.isArray(axes)) return [];
  const table = Array.isArray(scale) ? scale : [];
  const out = [];
  for (const axis of axes) {
    const level = firstNumber(getPropValue(char, axis.key));
    if (level === null) continue;
    const entry = table.find((s) => s.level === level);
    const name = entry ? entry.name : '';
    const desc = entry ? entry.desc : '';
    const title = `${axis.key} ${level}${name ? ` ${name}` : ''}${desc ? `: ${desc}` : ''}`;
    out.push({ key: axis.key, abbr: axis.abbr, level, name, desc, title });
  }
  return out;
};

// 등급 점 색: 낮음(회색)에서 높음(진홍)까지. 글자색이 아니라 작은 점에만 쓴다.
const PALETTE = ['#8a94a6', '#74b816', '#fab005', '#fd7e14', '#f03e3e', '#c2255c'];
export const ratingColor = (level) => PALETTE[Math.min(PALETTE.length - 1, Math.max(0, Math.round(level)))];

// 작품 설정 저장용: 편집기 텍스트칸 값을 메타에 넣고, 비어 있으면 메타에서 지운다. 원본 메타는 바꾸지 않는다.
export const applyRatingMeta = (meta, workMeta) => {
  const next = { ...meta };
  const axes = (workMeta.ratingAxesStr || '').trim();
  const scale = (workMeta.ratingScaleStr || '').trim();
  if (axes) next.ratingAxes = workMeta.ratingAxesStr; else delete next.ratingAxes;
  if (scale) next.ratingScale = workMeta.ratingScaleStr; else delete next.ratingScale;
  return next;
};

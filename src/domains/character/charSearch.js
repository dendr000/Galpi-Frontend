// Copyright (c) dendr000. MIT License.
// 큰 창의 캐릭터 검색과, 주변 캐릭터 띠가 쓰는 작은 도우미. 화면(React)에 의존하지 않는다.

// 저장된 속성(JSON, 두 번 감싸인 경우도 있음)을 객체로 읽는다. 깨져 있으면 빈 객체.
const readDynamic = (char) => {
  try {
    const raw = char?.dynamicProperties || char?._rawDynamic;
    if (!raw) return {};
    let parsed = JSON.parse(raw);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

// 그리드 카드와 같은 규칙: 속성의 테마 색 > 캐릭터의 테마 색 > 기본 색
export const getCharThemeColor = (char) =>
  readDynamic(char).themeColor || char?.themeColor || 'var(--primary-color)';

// 이름에 검색어가 들어 있는 캐릭터를 돌려준다. 이름이 검색어로 시작하는 것을 먼저 두고,
// 같은 묶음 안에서는 원래 순서(그리드 순서)를 지킨다. 검색어가 비어 있으면 아무것도 돌려주지 않는다.
export const searchChars = (chars, query, limit = Infinity) => {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q || !Array.isArray(chars)) return [];
  const starts = [];
  const contains = [];
  chars.forEach((c) => {
    const name = typeof c?.name === 'string' ? c.name.toLowerCase() : '';
    if (!name) return;
    if (name.startsWith(q)) starts.push(c);
    else if (name.includes(q)) contains.push(c);
  });
  return [...starts, ...contains].slice(0, limit);
};

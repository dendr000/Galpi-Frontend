// Copyright (c) dendr000. MIT License.
// 캐릭터를 속성값(서열, 나이 등)으로 정렬하는 순수 로직.

const FIELD_BY_KEY = { 나이: 'age', 성별: 'gender', 종족: 'species', 생일: 'birthday' };

// 속성 값 하나를 글자로 읽는다. 기본 항목(나이 등)은 전용 필드에서, 나머지는 같은 이름의 필드에서 읽는다.
export const getPropValue = (char, key) => {
  const field = FIELD_BY_KEY[key];
  const raw = (field && char[field]) ?? char[key];
  return raw === undefined || raw === null ? '' : String(raw).trim();
};

// 정렬 기준으로 고를 수 있는 속성 이름 목록: 캐릭터들의 속성 순서 목록을 합쳐 처음 나온 순서로,
// 값이 하나도 없는 속성과 시스템용(_로 시작) 이름은 뺀다.
export const collectSortKeys = (chars) => {
  const keys = [];
  for (const c of Array.isArray(chars) ? chars : []) {
    if (!Array.isArray(c._propOrder)) continue;
    for (const k of c._propOrder) {
      if (typeof k === 'string' && k && !k.startsWith('_') && !keys.includes(k)) keys.push(k);
    }
  }
  return keys.filter((k) => chars.some((c) => getPropValue(c, k) !== ''));
};

const firstNumber = (s) => {
  const m = s.match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};

const compareValues = (a, b) => {
  const na = firstNumber(a);
  const nb = firstNumber(b);
  if (na !== null && nb !== null && na !== nb) return na - nb;
  return a.localeCompare(b, 'ko');
};

// 속성값으로 정렬한 새 배열을 돌려준다. 값이 없는 캐릭터는 방향과 무관하게 맨 뒤, 값이 같으면 원래 순서를 지킨다.
export const sortCharsByProperty = (chars, key, dir = 'asc') => {
  if (!key) return [...chars];
  const sign = dir === 'desc' ? -1 : 1;
  return chars
    .map((char, index) => ({ char, index, value: getPropValue(char, key) }))
    .sort((x, y) => {
      if (x.value === '' && y.value === '') return x.index - y.index;
      if (x.value === '') return 1;
      if (y.value === '') return -1;
      const diff = compareValues(x.value, y.value) * sign;
      return diff !== 0 ? diff : x.index - y.index;
    })
    .map((e) => e.char);
};

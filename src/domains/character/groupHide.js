// Copyright (c) dendr000. MIT License.
// 작품 설정 "그룹에서 숨길 값": 속성별로 그룹을 만들 때 뺄 값을 저장하고 읽는다. 화면(React)에 의존하지 않는다.
// 저장 모양(작품 메타): _groupHide: { 소속: ['1조', '2조'], 등급: ['D급'] }
// 편집 칸 모양: 한 줄에 하나, "속성명: 값1, 값2"

const cleanValues = (list) => {
  const out = [];
  (Array.isArray(list) ? list : []).forEach((v) => {
    if (typeof v !== 'string') return;
    const t = v.trim();
    if (t && !out.includes(t)) out.push(t);
  });
  return out;
};

// 편집 칸 문자열 -> 맵. 첫 쌍점을 기준으로 나누고, 형식이 틀린 줄은 건너뛴다. 같은 속성을 여러 줄 쓰면 값을 합친다.
export const parseGroupHideStr = (text) => {
  const map = {};
  if (typeof text !== 'string') return map;
  text.split(/\r?\n/).forEach((line) => {
    const colon = line.indexOf(':');
    if (colon < 0) return;
    const key = line.slice(0, colon).trim();
    const values = cleanValues(line.slice(colon + 1).split(','));
    if (!key || values.length === 0) return;
    map[key] = cleanValues([...(map[key] || []), ...values]);
  });
  return map;
};

// 맵 -> 편집 칸 문자열(parseGroupHideStr 로 다시 읽으면 같다)
export const formatGroupHideStr = (map) => {
  if (!map || typeof map !== 'object') return '';
  return Object.keys(map).reduce((acc, key) => {
    const values = cleanValues(map[key]);
    return values.length > 0 ? `${acc}${key}: ${values.join(', ')}\n` : acc;
  }, '');
};

// 작품 설정 저장용: 편집 칸 내용을 메타에 넣고, 비면 메타에서 지운다. 원본 메타는 바꾸지 않는다.
export const applyGroupHideMeta = (meta, workMeta) => {
  const next = { ...meta };
  const map = parseGroupHideStr(workMeta?.groupHideStr);
  if (Object.keys(map).length > 0) next._groupHide = map; else delete next._groupHide;
  return next;
};

// 분류 기준(criteria)에서 숨길 값 배열. 설정이 없거나 모양이 잘못되면 빈 배열
export const getGroupHideValues = (meta, criteria) => cleanValues(meta?._groupHide?.[criteria]);

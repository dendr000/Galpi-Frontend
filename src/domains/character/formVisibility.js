// Copyright (c) dendr000. MIT License.
// 숨김 캐릭터(목록에서 숨기기) 관련 계산: 숨김 목록 뽑기, 숨김 켜고 끄기, 어느 캐릭터의 다음 폼인지 알아내기.
const parseDp = (c) => {
  try {
    let dp = JSON.parse(c?.dynamicProperties || c?._rawDynamic || '{}');
    if (typeof dp === 'string') dp = JSON.parse(dp);
    return dp && typeof dp === 'object' ? dp : {};
  } catch (e) { return {}; }
};

export const isCharHidden = (c) => !!parseDp(c)._isHidden;

// 숨겨진 캐릭터와, 그 캐릭터를 "다음 폼"으로 가리키는 캐릭터 이름(있으면)을 돌려준다.
export const getHiddenCharacters = (characters) => {
  const all = Array.isArray(characters) ? characters.filter((c) => !c.isTrash) : [];
  const owners = new Map();
  all.forEach((c) => {
    const t = parseDp(c)._switchTarget;
    if (t && !owners.has(t)) owners.set(t, c.name);
  });
  return all.filter(isCharHidden).map((char) => ({ char, formOf: owners.get(char.name) || '' }));
};

// 숨김 여부만 바꾼 새 캐릭터 객체(원본은 그대로). 서버에 보낼 dynamicProperties 문자열도 함께 갱신한다.
export const withHidden = (char, hidden) => {
  const dp = { ...parseDp(char), _isHidden: !!hidden };
  const json = JSON.stringify(dp);
  return { ...char, dynamicProperties: json, _rawDynamic: json };
};

// Copyright (c) dendr000. MIT License.
// 캐릭터의 소속 값과 같은 제목의 하위 문서를 이어 주는 순수 로직.
// 소속은 쉼표로 여러 개 쓸 수 있고, *로 시작하는 값은 그룹 분류와 같이 링크와 인물 목록에서 뺀다.
import { normalizeName, isHiddenChar } from './backlink';

// 소속 값을 [{ text, plain }] 로 쪼갠다. plain 은 *로 시작해 링크 대상에서 빠지는 값이다.
export const splitAffiliations = (value) =>
  String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.startsWith('*') ? { text: s.replace(/^\*/, '').trim(), plain: true } : { text: s, plain: false }))
    .filter((p) => p.text);

// 이름이 같은(공백, 대소문자 무시) 하위 문서. 같은 제목이 여럿이면 먼저 나온 것.
export const findAffiliationPage = (wikiPages, name) => {
  const key = normalizeName(name);
  if (!key || !Array.isArray(wikiPages)) return undefined;
  return wikiPages.find((p) => normalizeName(p.title) === key);
};

// 소속 값 중 하나가 문서 제목과 같은 캐릭터들(숨김 제외, 원래 순서 유지).
export const getAffiliationMembers = (characters, pageTitle) => {
  const key = normalizeName(pageTitle);
  if (!key || !Array.isArray(characters)) return [];
  return characters.filter(
    (c) =>
      !isHiddenChar(c) &&
      splitAffiliations(c['소속']).some((p) => !p.plain && normalizeName(p.text) === key)
  );
};

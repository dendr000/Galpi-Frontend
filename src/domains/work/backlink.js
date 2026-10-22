// Copyright (c) dendr000. MIT License.
// 본문의 [[이름]] 링크가 가리키는 대상을 찾는 순수 로직: 같은 작품의 캐릭터가 먼저, 없으면 다른 작품 제목.

// 공백을 모두 지우고 소문자로 바꿔 비교한다: "레온 폰 아인하르트"와 "레온폰아인하르트"를 같은 이름으로 본다.
export const normalizeName = (str) => (str || '').replace(/\s+/g, '').toLowerCase();

const isHidden = (c) => {
  try {
    let dp = JSON.parse(c.dynamicProperties || c._rawDynamic || '{}');
    if (typeof dp === 'string') dp = JSON.parse(dp);
    return !!(dp && dp._isHidden);
  } catch (e) {
    return false;
  }
};

// 같은 작품의 캐릭터 카드 중 이름이 같은 것을 찾는다. 숨김 캐릭터는 카드가 없으므로 뺀다.
// 반환: { baseId: 카드 위치를 찾는 id(본체), activeId: 선택 상태로 만들 id(폼 스왑 중이면 지금 보이는 쪽) }
// 폼 스왑 중에는 본체 이름과 보이는 서브폼 이름 둘 다로 찾을 수 있다.
export const findCharacterTarget = (characters, formSwaps, keyword) => {
  const key = normalizeName(keyword);
  if (!key || !Array.isArray(characters)) return null;
  const swaps = formSwaps || {};
  for (const base of characters) {
    if (isHidden(base)) continue;
    const shownId = swaps[base.id] && swaps[base.id] !== base.id ? swaps[base.id] : base.id;
    const shown = shownId === base.id ? base : characters.find((c) => c.id === shownId) || base;
    if (normalizeName(base.name) === key || normalizeName(shown.name) === key) {
      return { baseId: base.id, activeId: shown.id };
    }
  }
  return null;
};

// 다른 작품 중 제목이 같은 것을 찾는다. 지금 보고 있는 작품 자신은 뺀다.
export const findWorkTarget = (works, keyword, currentWorkId) => {
  const key = normalizeName(keyword);
  if (!key || !Array.isArray(works)) return null;
  return works.find((w) => String(w.id) !== String(currentWorkId) && normalizeName(w.title) === key) || null;
};

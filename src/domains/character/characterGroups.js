// Copyright (c) dendr000. MIT License.
// 작품 페이지(와 내보내기)가 캐릭터를 보여 줄 때 쓰는 계산: 숨김/폼 스왑 반영, 분류 그룹 묶기와 정렬.
import { getGroupSortOrder } from './characterOrder';
import { sortCharsByProperty } from './characterSort';

const parseDp = (c) => {
  let dp = JSON.parse(c.dynamicProperties || c._rawDynamic || '{}');
  if (typeof dp === 'string') dp = JSON.parse(dp);
  return dp || {};
};

// baseChars: 숨김 캐릭터를 뺀 목록. displayChars: 폼 스왑을 반영해 화면에 실제로 보이는 목록(_baseCharId 는 본체 id).
export const getVisibleCharacters = (characters, formSwaps) => {
  const all = Array.isArray(characters) ? characters : [];
  const swaps = formSwaps || {};
  const baseChars = all.filter((c) => {
    try { return !parseDp(c)._isHidden; } catch (e) { return true; }
  });
  const displayChars = baseChars.map((base) => {
    const activeFormId = swaps[base.id];
    if (activeFormId && activeFormId !== base.id) {
      const alt = all.find((c) => c.id === activeFormId);
      if (alt) return { ...alt, _baseCharId: base.id };
    }
    return { ...base, _baseCharId: base.id };
  });
  return { baseChars, displayChars };
};

// 분류 속성(groupCriteria)으로 묶고 그룹 안을 정렬한다. 반환: { groupedChars, sortedGroupNames }
// - 쉼표로 여러 값이면 여러 그룹에 들어가고, 값이 없거나 *로만 된 캐릭터는 "미분류"
// - 그룹 안 수동 순서: 그룹 전용 드래그 순서 -> 기본 순서 -> 999. 속성 정렬(sortKey)을 고르면 그 위에 덮어쓴다
// - 그룹 순서: groupOrderArray 에 있는 것이 먼저, 나머지는 뒤에 원래 순서대로
export const buildCharacterGroups = ({ chars, allCharacters, groupCriteria, groupOrderArray, sortKey, sortDir }) => {
  const groupedChars = {};
  chars.forEach((c) => {
    const rawVal = c[groupCriteria] || '미분류';
    const tags = String(rawVal).split(',').map((s) => s.trim()).filter(Boolean);
    let validTags = tags.filter((t) => !t.startsWith('*'));
    if (validTags.length === 0) validTags = ['미분류'];
    validTags.forEach((tag) => {
      if (!groupedChars[tag]) groupedChars[tag] = [];
      if (!groupedChars[tag].some((exist) => exist.id === c.id)) groupedChars[tag].push(c);
    });
  });

  const all = Array.isArray(allCharacters) ? allCharacters : [];
  Object.keys(groupedChars).forEach((k) => {
    const baseSort = (char) => {
      const base = all.find((bc) => bc.id === char._baseCharId) || char;
      try {
        // sortOrder 는 캐릭터 객체의 필드가 아니라 dynamicProperties(JSON) 안의 값이라 거기서 읽는다
        return getGroupSortOrder(parseDp(base), k);
      } catch (e) {
        return base.sortOrder ?? 999;
      }
    };
    groupedChars[k].sort((a, b) => baseSort(a) - baseSort(b));
    if (sortKey) groupedChars[k] = sortCharsByProperty(groupedChars[k], sortKey, sortDir);
  });

  const order = groupOrderArray || [];
  const sortedGroupNames = Object.keys(groupedChars).sort((a, b) => {
    let idxA = order.indexOf(a);
    let idxB = order.indexOf(b);
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  });

  return { groupedChars, sortedGroupNames };
};

// "관계" 기준으로 볼 때 작품마다 _groupOrder 를 따로 설정해 두지 않았으면 연인, 친구, 일반 순서를 기본값으로 쓴다
// (일괄 관리 스튜디오의 "카드 배치 순" 정렬과 같은 기본값).
const DEFAULT_GROUP_ORDER = { 관계: ['연인', '친구', '일반'] };
export const getGroupOrderArray = (meta, groupCriteria) =>
  meta?._groupOrder?.[groupCriteria] || DEFAULT_GROUP_ORDER[groupCriteria] || [];

// Copyright (c) dendr000. MIT License.
// 작품 페이지(와 내보내기)가 캐릭터를 보여 줄 때 쓰는 계산: 숨김/폼 스왑 반영, 분류 그룹 묶기와 정렬.
import { getGroupSortOrder } from './characterOrder';
import { sortCharsByProperty, getPropValue } from './characterSort';

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

// 값이 여러 개인 캐릭터를 어느 그룹에 넣을지: all(값마다 모두), first(첫 번째 값만), last(마지막 값만).
// 작품 메타(multiGroup)에 first, last 일 때만 저장하고 없으면 all 이다.
export const MULTI_GROUP_MODES = ['all', 'first', 'last'];
export const getMultiGroupMode = (meta) => (MULTI_GROUP_MODES.includes(meta?.multiGroup) ? meta.multiGroup : 'all');

// 작품 설정 저장용: 편집기에서 고른 값을 메타에 넣고, all 이거나 비면 메타에서 지운다. 원본 메타는 바꾸지 않는다.
export const applyMultiGroupMeta = (meta, workMeta) => {
  const next = { ...meta };
  const mode = workMeta?.multiGroupMode;
  if (mode === 'first' || mode === 'last') next.multiGroup = mode; else delete next.multiGroup;
  return next;
};

// 캐릭터 한 명이 분류 속성(criteria)으로 들어갈 그룹 이름들. 화면(buildCharacterGroups)과 카드 끌기(useCharacterDrag)가 같이 쓴다.
// - 쉼표로 여러 값이면 mode 에 따라 모두(all), 첫 번째(first), 마지막(last) 값만. *로 시작하는 값은 처음부터 뺀다
// - 값이 없거나 *로만 된 캐릭터는 "미분류". 나이, 성별, 종족은 전용 필드(age 등)에서도 읽는다
export const getGroupTags = (char, criteria, mode = 'all') => {
  const raw = getPropValue(char, criteria) || '미분류';
  let tags = String(raw).split(',').map((s) => s.trim()).filter((t) => t && !t.startsWith('*'));
  if (tags.length === 0) tags = ['미분류'];
  if (mode === 'first') return tags.slice(0, 1);
  if (mode === 'last') return tags.slice(-1);
  return tags;
};

// 분류 기준 선택 목록. 예전부터 있던 다섯 개는 속성이 없어도 항상 맨 앞에 두고, 작품 페이지에 있는 나머지 속성(정렬 목록과 같은 출처)을
// 그 뒤에 "속성별"로 붙인다. 저장해 둔 분류 기준이 지금 없는 속성이어도 선택이 비지 않게 목록 끝에 남긴다.
const BASE_CRITERIA = [
  { value: '관계', label: '관계별' },
  { value: '소속', label: '소속별' },
  { value: '등급', label: '등급별' },
  { value: '종족', label: '종족별' },
  { value: '성별', label: '성별별' },
];
export const getGroupCriteriaOptions = (propKeys, current) => {
  const options = [...BASE_CRITERIA];
  const seen = new Set(options.map((o) => o.value));
  const add = (key) => {
    if (typeof key !== 'string' || !key || seen.has(key)) return;
    seen.add(key);
    options.push({ value: key, label: `${key}별` });
  };
  (Array.isArray(propKeys) ? propKeys : []).forEach(add);
  add(current);
  return options;
};

// 분류 속성(groupCriteria)으로 묶고 그룹 안을 정렬한다. 반환: { groupedChars, sortedGroupNames }
// - 쉼표로 여러 값이면 multiGroupMode 에 따라 여러 그룹(all) 또는 첫 번째(first), 마지막(last) 그룹에만 들어간다.
//   *로 시작하는 값은 처음부터 빼고 센다. 값이 없거나 *로만 된 캐릭터는 "미분류"
// - 그룹 안 수동 순서: 그룹 전용 드래그 순서 -> 기본 순서 -> 999. 속성 정렬(sortKey)을 고르면 그 위에 덮어쓴다
// - 그룹 순서: groupOrderArray 에 있는 것이 먼저, 나머지는 뒤에 원래 순서대로
export const buildCharacterGroups = ({ chars, allCharacters, groupCriteria, groupOrderArray, sortKey, sortDir, multiGroupMode = 'all' }) => {
  const groupedChars = {};
  chars.forEach((c) => {
    getGroupTags(c, groupCriteria, multiGroupMode).forEach((tag) => {
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

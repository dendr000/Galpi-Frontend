// 파일 위치: src/pages/Home/utils/filterHiddenWorks.js
// 기능 요약: 메인 화면에서 "숨김 처리한 분류(비밀 금고)"에 걸린 작품을 걸러내는 순수 로직.
// 숨김 목록의 원본은 DB(/api/hidden-categories)다 — 이 함수는 그 목록을 받아서 적용만 한다.

// 비교용 정규화: 공백/#/*/대괄호를 지우고 소문자로 맞춘다("# NTL", "[ntl]" 모두 "ntl").
export const normalizeCategory = (s) => String(s).replace(/[\s#*[\]]/g, '').toLowerCase();

// 작품에 붙은 모든 분류 태그: genre 필드(쉼표 구분) + 설명 메타의 장르/태그/분류.
// metaInfo는 extractMeta(description)의 결과({ clean, meta })다.
export const collectWorkTags = (work) => {
  const tags = [];
  if (work.genre) tags.push(...work.genre.split(','));
  const meta = work.metaInfo?.meta || {};
  ['장르', '태그', '분류'].forEach((k) => {
    if (meta[k]) tags.push(...String(meta[k]).split(','));
  });
  return tags;
};

export const isWorkHidden = (work, hiddenCats) => {
  const hidden = hiddenCats.map(normalizeCategory);
  if (hidden.length === 0) return false;
  return collectWorkTags(work).some((t) => hidden.includes(normalizeCategory(t)));
};

export const filterHiddenWorks = (works, hiddenCats) => {
  if (!Array.isArray(hiddenCats) || hiddenCats.length === 0) return works;
  return works.filter((w) => !isWorkHidden(w, hiddenCats));
};

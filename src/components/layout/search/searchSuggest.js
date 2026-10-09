// Copyright (c) dendr000. MIT License.
// 헤더 검색의 후보 만들기와 추천 순위 계산(순수 함수).
import { isWorkHidden } from '../../../pages/Home/utils/filterHiddenWorks';

const norm = (s) => String(s || '').toLowerCase();

// works: metaInfo(extractMeta 결과)가 붙은 작품 목록. includeHidden이 false면 숨김 분류에 걸린 작품은 뺀다.
// 포함할 때는 hidden 표시를 남겨서 화면에서 구분할 수 있게 한다.
export const buildCandidates = (works, hiddenCats, includeHidden) => {
  const list = works.map((w) => ({
    id: w.id,
    title: w.title || '',
    alias: w.metaInfo?.meta?.alias || '',
    genre: w.genre || '',
    hidden: isWorkHidden(w, hiddenCats || []),
  }));
  return includeHidden ? list : list.filter((c) => !c.hidden);
};

// 낮을수록 먼저: 0 제목/약칭 정확 일치, 1 제목 앞부분, 2 약칭 앞부분, 3 제목 포함, 4 약칭 포함, 5 장르 포함, -1 불일치
const scoreOf = (candidate, q) => {
  const title = norm(candidate.title);
  const alias = norm(candidate.alias);
  const genre = norm(candidate.genre);
  if (title === q || alias === q) return 0;
  if (title.startsWith(q)) return 1;
  if (alias && alias.startsWith(q)) return 2;
  if (title.includes(q)) return 3;
  if (alias && alias.includes(q)) return 4;
  if (genre.includes(q)) return 5;
  return -1;
};

export const rankSuggestions = (candidates, query, limit = 8) => {
  const q = norm(query).trim();
  if (!q) return [];
  return candidates
    .map((c) => ({ c, score: scoreOf(c, q) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => a.score - b.score || a.c.title.localeCompare(b.c.title, 'ko'))
    .slice(0, limit)
    .map((x) => x.c);
};

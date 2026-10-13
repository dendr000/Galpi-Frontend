// Copyright (c) dendr000. MIT License.
// 같은 제작자(작가)의 다른 작품들이 가장 많이 쓴 이미지 확장자를 찾는 순수 함수.
// 작품 편집에서 제작자 입력 후 Tab을 누르면 캐릭터 확장자와 대문(커버) 확장자를 자동으로 채우는 데 쓴다.
import { extractMeta } from '../../utils/markdown/metaUtils';

// works: /api/works 응답(각 작품의 creator, description). key: 메타 키('charExt' 또는 'coverExt').
// 제작자가 같은 작품 중 그 키에 값이 있는 것만 세어 가장 많은 확장자를 돌려준다. 하나도 없으면 null.
// 동률이면 먼저 나온 것이 이긴다. 확장자 앞의 점/공백은 정리해서 센다(".png" == "png").
export const pickMostUsedExt = (works, creatorName, key) => {
  const name = String(creatorName || '').trim();
  if (!name) return null;

  const counts = new Map();
  works.forEach((w) => {
    if (w.creator?.trim() !== name) return;
    const raw = extractMeta(w.description || '').meta[key];
    const ext = raw ? String(raw).trim().replace(/^\./, '') : '';
    if (!ext) return;
    counts.set(ext, (counts.get(ext) || 0) + 1);
  });

  let best = null;
  let bestCount = 0;
  counts.forEach((count, ext) => {
    if (count > bestCount) {
      best = ext;
      bestCount = count;
    }
  });
  return best;
};

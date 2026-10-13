// Copyright (c) dendr000. MIT License.
// 메인 상단 배너 슬라이더가 쓰는 순수 로직: 어떤 작품을 보여줄지, 어떤 순서로, 어떤 이미지 주소로.
import { sanitizeFilenameTitle } from '../../utils/filenameSanitizer';

// 커버 이미지가 지정된 작품만 슬라이드 대상이다: 설명 메타에 coverExt(확장자) 또는 cover(옛 방식 경로)가 있어야 한다.
export const pickCoverWorks = (works) =>
  works.filter((w) => {
    const m = w.metaInfo?.meta || {};
    return (m.coverExt && String(m.coverExt).trim() !== '') || (m.cover && String(m.cover).trim() !== '');
  });

// Fisher-Yates 셔플. 원본을 바꾸지 않는다. rand는 테스트에서 고정값을 넣기 위한 주입점(기본 Math.random).
export const shuffle = (list, rand = Math.random) => {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// 커버 이미지 주소. coverExt가 있으면 /img/cover/<작품명>.<확장자>(파일명에 못 쓰는 문자는 전각으로 변환),
// 없고 cover가 있으면 옛 방식 경로(cover/파일명)를 쓴다. 둘 다 없으면 빈 문자열.
export const getCoverUrl = (work) => {
  const m = work.metaInfo?.meta || {};
  if (m.coverExt) {
    return `/img/cover/${encodeURIComponent(sanitizeFilenameTitle(work.title) + '.' + String(m.coverExt).trim().replace(/^\./, ''))}`;
  }
  if (m.cover) {
    return `/img/cover/${encodeURIComponent(String(m.cover).replace('cover/', ''))}`;
  }
  return '';
};

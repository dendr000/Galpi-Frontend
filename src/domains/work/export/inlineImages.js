// Copyright (c) dendr000. MIT License.
// 본문 HTML 속 "/img/..." 로컬 이미지 주소를 불러온 데이터 주소(data URI)로 바꿔 단일 파일에 담는다.
// 불러오지 못한 이미지는 깨진 그림이 남지 않게 빈 주소로 바꾼다.

// 따옴표, 괄호, 공백, 꺾쇠에서 끝나는 "/img/..." 주소
const IMG_URL = /\/img\/[^'"()\s<>]+/g;

export const inlineLocalImages = async (html, loadImage) => {
  if (!html) return '';
  const urls = [...new Set(html.match(IMG_URL) || [])];
  if (urls.length === 0) return html;

  const resolved = new Map();
  await Promise.all(
    urls.map(async (u) => {
      try {
        resolved.set(u, (await loadImage(u)) || '');
      } catch (e) {
        resolved.set(u, '');
      }
    })
  );
  return html.replace(IMG_URL, (u) => resolved.get(u) ?? '');
};

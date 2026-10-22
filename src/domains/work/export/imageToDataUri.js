// Copyright (c) dendr000. MIT License.
// 이미지 주소를 불러와 폭을 줄인 webp 데이터 주소(data URI)로 바꾼다. 단일 HTML 파일에 이미지를 담기 위한 브라우저 전용 함수.
// 실패하면 예외 대신 빈 문자열을 돌려준다(그 이미지만 빠진 채로 내보내기가 계속되게).

// 비율을 지켜 최대 폭에 맞춘 크기. 확대하지 않고, 크기가 이상하면 null.
export const fitSize = (width, height, maxWidth) => {
  if (!(width > 0) || !(height > 0)) return null;
  if (width <= maxWidth) return { width, height };
  const w = maxWidth;
  return { width: w, height: Math.max(1, Math.round((height * w) / width)) };
};

export const imageToDataUri = async (url, { maxWidth = 420, quality = 0.8 } = {}) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const bitmap = await createImageBitmap(await res.blob());
    const size = fitSize(bitmap.width, bitmap.height, maxWidth);
    if (!size) return '';
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, size.width, size.height);
    if (typeof bitmap.close === 'function') bitmap.close();
    return canvas.toDataURL('image/webp', quality);
  } catch (e) {
    return '';
  }
};

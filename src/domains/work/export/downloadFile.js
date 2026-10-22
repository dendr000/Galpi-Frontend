// Copyright (c) dendr000. MIT License.
// 글자로 된 내용을 파일로 내려받게 한다(브라우저 다운로드, exe 에서는 저장 창이 뜬다).
export const downloadTextFile = (filename, content, mime = 'text/html;charset=utf-8') => {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 내려받기가 시작된 뒤 주소를 정리한다
  URL.revokeObjectURL(url);
};

// Copyright (c) dendr000. MIT License.
// 공개용 내보내기에 넣는 본문 HTML 을 안전하게 만든다: 스크립트, 외부 연결 태그, 이벤트 속성, 위험한 주소를 제거.
// 파일을 열어 보는 사람의 브라우저에서 코드가 실행되지 않게 하려는 것이다(마크다운에 HTML 을 직접 쓴 경우 대비).
// DOMParser 가 필요한 브라우저 환경용(작성 시 만든 HTML 을 파싱해 걸러낸다).

const FORBIDDEN_TAGS = ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form', 'frame', 'frameset', 'applet'];
const URL_ATTRS = ['href', 'src', 'xlink:href', 'action', 'formaction', 'poster', 'data'];

const isDangerousUrl = (value) => {
  const v = value.replace(/[\u0000- ]+/g, '').toLowerCase();
  if (v.startsWith('javascript:') || v.startsWith('vbscript:')) return true;
  if (v.startsWith('data:') && !v.startsWith('data:image/')) return true;
  return false;
};

export const sanitizeExportHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  doc.querySelectorAll(FORBIDDEN_TAGS.join(',')).forEach((el) => el.remove());
  doc.body.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) el.removeAttribute(attr.name);
      else if (URL_ATTRS.includes(name) && isDangerousUrl(attr.value)) el.removeAttribute(attr.name);
    }
  });
  return doc.body.innerHTML;
};

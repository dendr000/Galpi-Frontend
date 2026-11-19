// 파일 위치: src/domains/macro/utils/htmlProcessor.js
// 기능 요약: 
// - Marked.js를 통해 1차 파싱된 HTML 문자열을 DOMParser로 분석하여 최종 출력 형태를 조립하는 후처리 엔진입니다.
// - H1, H2, H3 제목 태그를 실시간 스캔하여 트리 계층(1., 1.1., 1.1.1.)에 맞춘 자동 넘버링을 부여합니다.
// - 제목 단위로 본문을 분할하여 위키 특유의 문서 박스 형태인 '.md-box' 컨테이너로 감싸 렌더링 부하를 격리합니다.
// - 문서 내 목차(TOC) 생성을 위한 고유 ID(galpi-toc-target)를 각 헤딩 요소에 자동 주입합니다.

// 아직 나오지 않은 윗단계(0)는 번호에서 뺀다. (# 없이 ## 로 시작하면 0.1. 대신 1.)
const joinNumber = (...parts) => `${parts.filter((n) => n > 0).join('.')}.`;

export const processMarkdownHtml = (rawHtml, startH1 = 1) => {
  let counters = { h1: startH1 - 1, h2: 0, h3: 0 };
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3');

  headings.forEach((heading, globalIndex) => {
    const tag = heading.tagName.toLowerCase();
    let numStr = "";
    const currentText = heading.textContent || "";

    if (tag === 'h1') {
      const match = currentText.match(/^(\d+)\./);
      if (match) {
          counters.h1 = parseInt(match[1], 10);
      } else {
          counters.h1++;
          numStr = `${counters.h1}.`;
      }
      counters.h2 = 0;
      counters.h3 = 0;
      heading.classList.add('md-h1');
    } else if (tag === 'h2') {
      const match = currentText.match(/^(\d+)\.(\d+)\./);
      if (match) {
          counters.h1 = parseInt(match[1], 10);
          counters.h2 = parseInt(match[2], 10);
      } else {
          counters.h2++;
          numStr = joinNumber(counters.h1, counters.h2);
      }
      counters.h3 = 0;
    } else if (tag === 'h3') {
      const match = currentText.match(/^(\d+)\.(\d+)\.(\d+)\./);
      if (match) {
          counters.h1 = parseInt(match[1], 10);
          counters.h2 = parseInt(match[2], 10);
          counters.h3 = parseInt(match[3], 10);
      } else {
          counters.h3++;
          numStr = joinNumber(counters.h1, counters.h2, counters.h3);
      }
    }

    if (numStr) {
      heading.innerHTML = `<span class="gt-macro-ink-soft" style="color:var(--text-secondary); margin-right:8px;">${numStr}</span>${heading.innerHTML}`;
    }
    heading.id = `galpi-toc-target-${globalIndex}`;
  });

  const newBody = document.createElement('body');
  let currentBox = null;

  Array.from(doc.body.childNodes).forEach(node => {
    if (node.nodeType === 1 && node.tagName.toLowerCase() === 'h1') {
      newBody.appendChild(node.cloneNode(true));
      currentBox = document.createElement('div');
      currentBox.className = 'md-box';
      newBody.appendChild(currentBox);
    } else {
      if (!currentBox) {
        currentBox = document.createElement('div');
        currentBox.className = 'md-box';
        newBody.appendChild(currentBox);
      }
      currentBox.appendChild(node.cloneNode(true));
    }
  });

  Array.from(newBody.querySelectorAll('.md-box')).forEach(box => {
    if (box.innerHTML.trim() === '') box.remove();
  });

  return newBody.innerHTML;
};
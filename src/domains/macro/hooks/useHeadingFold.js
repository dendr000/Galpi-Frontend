// 파일 위치: src/domains/macro/hooks/useHeadingFold.js
// 기능 요약: 
// - 나무위키 스타일의 문단 접기/펼치기(Folding) 상호작용을 제어하는 마크다운 전용 UI 이벤트 훅입니다.
// - 렌더링이 완료된 HTML DOM 트리를 순회하며 H1~H6 제목 태그 옆에 '▼' 토글 버튼을 주입합니다.
// - H1 클릭 시 해당 섹션(.md-box) 전체를 숨김 처리하고, 하위 태그(H2, H3 등) 클릭 시에는 동급 이상의 다음 태그가 나타나기 전까지의 형제 노드(Siblings)를 추적하여 스마트하게 디스플레이를 토글합니다.

import { useEffect } from 'react';
import { iconHtml } from '../../../components/common/icons/iconRegistry';
import { FOLD_ALL_EVENT } from './foldEvents';

const HEADING = /^H([1-6])$/;

// 원래 display 값을 기억해 두었다가 되돌린다(인라인 display 를 가진 매크로 요소가 깨지지 않게).
const setHidden = (el, hide) => {
  if (hide && el.dataset.foldHidden !== '1') {
    el.dataset.originalDisplay = el.style.display || '';
    el.dataset.foldHidden = '1';
    el.style.display = 'none';
  } else if (!hide && el.dataset.foldHidden === '1') {
    el.style.display = el.dataset.originalDisplay || '';
    delete el.dataset.foldHidden;
  }
};

const paintButton = (heading) => {
  const btn = heading.querySelector('.wiki-fold-btn');
  if (!btn) return;
  const collapsed = heading.classList.contains('is-collapsed');
  btn.innerHTML = iconHtml(collapsed ? 'chevron-left' : 'chevron-down');
  btn.style.color = collapsed ? 'var(--primary-color)' : 'var(--text-secondary)';
};

// 접힌 제목 아래에 있는 것만 숨긴다. 접힌 하위 제목은 상위를 펼쳐도 계속 접힌 채로 둔다.
const refreshVisibility = (container) => {
  container.querySelectorAll('.md-box').forEach((box) => {
    const stack = [];
    Array.from(box.children).forEach((el) => {
      const m = el.tagName.match(HEADING);
      if (m) {
        const level = Number(m[1]);
        while (stack.length && stack[stack.length - 1] >= level) stack.pop();
        setHidden(el, stack.length > 0);
        if (el.classList.contains('is-collapsed')) stack.push(level);
      } else {
        setHidden(el, stack.length > 0);
      }
    });
  });
  // 제목 1단계는 바로 뒤의 본문 상자 전체를 접는다.
  container.querySelectorAll('h1').forEach((h1) => {
    const box = h1.nextElementSibling;
    if (box && box.classList.contains('md-box')) setHidden(box, h1.classList.contains('is-collapsed'));
  });
};

export const useHeadingFold = (containerRef, dependencies) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach((heading) => {
      if (heading.querySelector('.wiki-fold-btn')) return;

      const btn = document.createElement('span');
      btn.className = 'wiki-fold-btn';
      btn.innerHTML = iconHtml('chevron-down');
      btn.title = "문단 접기/펼치기";
      btn.style.cssText = "cursor: pointer; font-size: 0.7em; margin-left: 8px; color: var(--text-secondary); user-select: none; transition: color 0.2s; vertical-align: middle;";

      btn.onmouseover = () => btn.style.color = 'var(--primary-color)';
      btn.onmouseout = () => {
        if (!heading.classList.contains('is-collapsed')) btn.style.color = 'var(--text-secondary)';
      };

      heading.appendChild(btn);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        heading.classList.toggle('is-collapsed');
        paintButton(heading);
        refreshVisibility(container);
      });
    });

    // 목차의 "모두 접기/펼치기"
    const onFoldAll = (e) => {
      const collapsed = !!(e.detail && e.detail.collapsed);
      container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
        h.classList.toggle('is-collapsed', collapsed);
        paintButton(h);
      });
      refreshVisibility(container);
    };
    window.addEventListener(FOLD_ALL_EVENT, onFoldAll);
    return () => window.removeEventListener(FOLD_ALL_EVENT, onFoldAll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

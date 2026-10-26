// 파일 위치: src/domains/macro/hooks/useHeadingFold.js
// 기능 요약: 
// - 나무위키 스타일의 문단 접기/펼치기(Folding) 상호작용을 제어하는 마크다운 전용 UI 이벤트 훅입니다.
// - 렌더링이 완료된 HTML DOM 트리를 순회하며 H1~H6 제목 태그 옆에 '▼' 토글 버튼을 주입합니다.
// - H1 클릭 시 해당 섹션(.md-box) 전체를 숨김 처리하고, 하위 태그(H2, H3 등) 클릭 시에는 동급 이상의 다음 태그가 나타나기 전까지의 형제 노드(Siblings)를 추적하여 스마트하게 디스플레이를 토글합니다.

import { useEffect } from 'react';
import { iconHtml } from '../../../components/common/icons/iconRegistry';

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
        
        const isCollapsed = heading.classList.toggle('is-collapsed');
        btn.innerHTML = iconHtml(isCollapsed ? 'chevron-left' : 'chevron-down');
        btn.style.color = isCollapsed ? 'var(--primary-color)' : 'var(--text-secondary)';

        // 1. H1 태그를 클릭한 경우: 바로 뒤에 붙어있는 md-box 전체를 통째로 토글
        if (heading.tagName === 'H1') {
          const mdBox = heading.nextElementSibling;
          if (mdBox && mdBox.classList.contains('md-box')) {
            if (isCollapsed) {
              mdBox.dataset.originalDisplay = mdBox.style.display || '';
              mdBox.style.display = 'none';
            } else {
              mdBox.style.display = mdBox.dataset.originalDisplay || '';
            }
          }
        } 
        // 2. H2, H3 등 하위 태그를 클릭한 경우: md-box 내부에 있으므로 동급 태그가 나오기 전까지의 형제 요소들을 토글
        else {
          const currentLevel = parseInt(heading.tagName.substring(1));
          let sibling = heading.nextElementSibling;

          while (sibling) {
            const siblingLevelMatch = sibling.tagName.match(/^H(\d)$/);
            if (siblingLevelMatch) {
              const siblingLevel = parseInt(siblingLevelMatch[1]);
              if (siblingLevel <= currentLevel) break;
            }

            if (isCollapsed) {
              if (sibling.style.display !== 'none') {
                sibling.dataset.originalDisplay = sibling.style.display || '';
                sibling.style.display = 'none';
              }
            } else {
              sibling.style.display = sibling.dataset.originalDisplay || '';
            }
            sibling = sibling.nextElementSibling;
          }
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};
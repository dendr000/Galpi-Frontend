// 파일 위치: src/domains/macro/hooks/useFootnoteTooltip.js
// 기능 요약:
// - 마크다운 텍스트 내에서 파싱된 각주([*내용]) 요소에 대한 전역 마우스 이벤트를 통제하는 커스텀 훅입니다.
// - 마우스를 올리면 말풍선이 뜨고, 눌러(터치해) 고정하면 다른 곳을 누르거나 Esc 를 누를 때까지 남습니다.
// - 부모 컨테이너의 `overflow: hidden` 제약으로 인해 팝오버가 잘려나가는 현상(Clipping)을 원천 차단합니다.
// - 띄어쓰기가 없는 무식한 문자열이 들어와도 가로로 폭주하지 않도록 CSS 줄바꿈(Break-all) 안전망을 갖추고 있습니다.

import { useEffect } from 'react';

const TOOLTIP_ID = 'wiki-footnote-tooltip';

const getTooltip = () => {
  let tooltip = document.getElementById(TOOLTIP_ID);
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    // ★ absolute -> fixed로 교체하여 스크롤 꼬임 및 부모 제약 완벽 탈피, white-space/word-break로 가로 폭주 차단
    tooltip.style.cssText = "display:none; position:fixed; z-index:999999; background:var(--surface-color); border:2px solid var(--primary-color); border-radius:8px; padding:12px 16px; box-shadow:0 4px 20px rgba(0,0,0,0.15); max-width:350px; font-size:13px; font-weight:normal; line-height:1.6; word-break:break-all; white-space:pre-wrap; color:var(--text-primary); pointer-events:none; box-sizing:border-box;";
    document.body.appendChild(tooltip);
  }
  return tooltip;
};

const showTooltip = (target) => {
  const tooltip = getTooltip();
  // 내용은 글자로만 넣는다(HTML 로 해석하면 각주에 쓴 태그가 실행될 수 있다). 줄바꿈 표시(<br>)만 줄바꿈으로 바꾼다.
  tooltip.textContent = '';
  (target.getAttribute('data-content') || '').split(/<br\s*\/?>/i).forEach((part, i) => {
    if (i > 0) tooltip.appendChild(document.createElement('br'));
    tooltip.appendChild(document.createTextNode(part));
  });
  tooltip.style.display = 'block';

  const rect = target.getBoundingClientRect();

  // fixed 포지셔닝에 맞춰 scrollY 덧셈 제거
  let top = rect.bottom + 8;
  let left = rect.left - (tooltip.offsetWidth / 2) + (rect.width / 2);

  // 좌우 화면 이탈 보정
  if (left < 10) left = 10;
  if (left + tooltip.offsetWidth > window.innerWidth - 10) left = window.innerWidth - tooltip.offsetWidth - 10;

  // 하단 화면 이탈 시 마커의 위쪽으로 팝업을 밀어올리는 스마트 Y좌표 보정
  if (top + tooltip.offsetHeight > window.innerHeight - 10) {
    top = rect.top - tooltip.offsetHeight - 8;
  }

  tooltip.style.top = top + 'px';
  tooltip.style.left = left + 'px';
};

const hideTooltip = () => {
  const tooltip = document.getElementById(TOOLTIP_ID);
  if (tooltip) tooltip.style.display = 'none';
};

export const useFootnoteTooltip = () => {
  useEffect(() => {
    let pinned = null; // 눌러서 고정한 각주 요소

    const handleMouseOver = (e) => {
      const target = e.target.closest('.wiki-footnote');
      if (target && !pinned) showTooltip(target);
    };

    const handleMouseOut = (e) => {
      if (pinned) return;
      if (e.target.closest('.wiki-footnote')) hideTooltip();
    };

    // 각주를 누르면 고정/해제, 다른 곳을 누르면 고정 해제(터치 화면에는 마우스 올림이 없어서 이 길로만 열 수 있다)
    const handleClick = (e) => {
      const target = e.target.closest('.wiki-footnote');
      if (target) {
        if (pinned === target) { pinned = null; hideTooltip(); }
        else { pinned = target; showTooltip(target); }
      } else if (pinned) {
        pinned = null;
        hideTooltip();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && pinned) { pinned = null; hideTooltip(); }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      const tooltip = document.getElementById(TOOLTIP_ID);
      if (tooltip) tooltip.remove();
    };
  }, []);
};

// 파일 위치: src/hooks/useGlobalModalFocusGuard.js
// 기능 요약: 이 앱의 모달 오버레이는 구현이 제각각(ModalOverlay.jsx 공용 컴포넌트, MacroToolbar/
// BulkModals/EditorSettingsModal 등 각자 자체 구현)이라 모달마다 일일이 손대는 대신, "화면
// 전체를 덮는 position:fixed 오버레이가 새로 나타나면 그 즉시 포커스를 그 안으로 옮긴다"는
// 공통 규칙 하나로 전부 방어한다.
//
// 문제였던 시나리오: 모달을 열어도 안쪽에 자동 포커스되는 입력칸이 없으면, 방금 전까지
// 포커스돼 있던 "모달 뒤에 가려진" 배경 요소(예: 에디터 본문 textarea)가 계속 포커스를 쥔
// 채로 남는다. 이 상태에서 모달 안의 빈 공간(입력칸이 아닌 곳)을 클릭하고 Ctrl+A를 누르면,
// 브라우저는 여전히 포커스돼 있는 "안 보이는 배경 textarea" 전체를 선택해버린다. 그 직후
// 표(매크로) 삽입처럼 "현재 선택 영역을 교체"하는 동작이 실행되면 그 배경 textarea의 전체
// 내용이 통째로 사라지고 새로 넣은 것만 남는다 — 실제로 작품 편집 페이지에서 표를 삽입했더니
// 지금까지 쓴 본문이 전부 사라졌던 사고의 원인이었다.
//
// 고치는 방법은 모달이 열릴 때 포커스를 배경에 남겨두지 않는 것 — 모달 오버레이 자체를
// 포커스 가능하게 만들고 그 즉시 포커스를 옮기며, 모달 안의 입력칸이 아닌 곳을 클릭해도
// 배경으로 포커스가 새지 않도록 계속 오버레이 쪽으로 되돌린다.
import { useEffect } from 'react';

const MIN_SIZE = 400; // 이 정도는 돼야 "화면을 덮는 모달"이지, 작은 플로팅 UI(사이드바 센서,
// 커서 파티클 등)가 아니다 — 오탐 방지용 최소 크기 기준.
const MIN_Z_INDEX = 1000;

const INTERACTIVE_SELECTOR = 'input, textarea, select, button, a[href], [contenteditable="true"], [tabindex]';

// position:fixed + 뷰포트를 거의 다 덮는 크기 + 높은 z-index — 이 세 조건을 동시에 만족하는
// 요소만 "모달 오버레이"로 간주한다. 하나라도 빠지면 장식용 fixed 요소(작은 플로팅 버튼,
// 커스텀 커서 파티클 등)를 잘못 붙잡아 타이핑 중에 포커스를 뺏는 새 버그가 생기므로 신중하게 판별한다.
const looksLikeFullScreenModal = (el) => {
  if (!(el instanceof HTMLElement)) return false;
  const cs = window.getComputedStyle(el);
  if (cs.position !== 'fixed') return false;
  // ★ 장르 테마의 커서/클릭 이펙트/화면 플래시(예: 도심 히어로 테마의 gt-flash-urban)는
  // 전부 position:fixed + inset:0(또는 뷰포트를 덮는 크기) + 높은 z-index를 쓰지만,
  // 클릭이 아래 콘텐츠로 그대로 통과해야 하니 반드시 pointer-events:none을 건다.
  // 진짜 모달(ModalOverlay, BulkModals 등)은 클릭을 받아야 하므로 이 값을 쓰지 않는다 —
  // 이 하나로 "장식용 풀스크린 이펙트"와 "진짜 모달"을 구분한다. 이게 없으면 클릭 시
  // document.body에 잠깐 붙었다 사라지는 이펙트 레이어를 모달로 오인해, 방금 포커스한
  // 입력칸(작품 본문, 메모 등)에서 포커스를 계속 뺏어가 타이핑이 전혀 안 먹는 버그가 났다.
  if (cs.pointerEvents === 'none') return false;
  const z = parseInt(cs.zIndex, 10);
  if (Number.isNaN(z) || z < MIN_Z_INDEX) return false;
  return el.offsetWidth >= MIN_SIZE && el.offsetHeight >= MIN_SIZE;
};

const focusOverlay = (el) => {
  if (!document.body.contains(el)) return;
  // 이미 오버레이 안쪽 무언가(자동 포커스된 입력칸 등)에 포커스가 가 있으면 그대로 둔다.
  if (el.contains(document.activeElement) && document.activeElement !== document.body) return;
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
};

export const useGlobalModalFocusGuard = () => {
  useEffect(() => {
    // 1) 모달 오버레이가 새로 DOM에 나타나는 순간을 감지해서 그 즉시 포커스를 안으로 옮긴다.
    // ★ requestAnimationFrame으로 한 프레임 미뤘었는데, 브라우저 탭이 백그라운드/비활성
    // 상태면 rAF 콜백 자체가 사실상 멈춰서(파운데이션 이슈, 이 앱 다른 곳에서도 겪음) 포커스
    // 이동이 영영 실행되지 않는 문제가 있었다. offsetWidth/getComputedStyle은 화면에 실제로
    // 그려지는 것과 무관하게 DOM 삽입 직후 동기적으로 바로 계산 가능하므로 프레임을 기다릴
    // 이유가 없다 — MutationObserver 콜백 안에서 곧장 처리한다.
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          const targets = looksLikeFullScreenModal(node)
            ? [node]
            : Array.from(node.querySelectorAll('*')).filter(looksLikeFullScreenModal);
          targets.forEach((el) => focusOverlay(el));
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 2) 모달이 이미 열려 있는 상태에서, 그 안의 입력칸이 아닌 빈 공간(배경 padding, 헤더
    // 영역 등)을 클릭했을 때도 포커스가 계속 오버레이 쪽에 남아있도록 붙잡아 둔다 — 실제
    // 사고 재현 시나리오(모달 안 빈 공간 클릭 후 Ctrl+A)를 직접 방어하는 부분.
    const handlePointerDown = (e) => {
      if (!(e.target instanceof HTMLElement)) return;
      // 클릭된 지점부터 조상 방향으로 올라가며 "모달처럼 생긴" 요소를 찾는다.
      let el = e.target;
      let modalAncestor = null;
      while (el && el !== document.body) {
        if (looksLikeFullScreenModal(el)) { modalAncestor = el; break; }
        el = el.parentElement;
      }
      if (!modalAncestor) return;
      // 실제 입력 가능한 요소(텍스트칸, 버튼 등)를 클릭한 거면 그 요소가 정상적으로
      // 포커스를 받도록 건드리지 않는다.
      if (e.target.closest(INTERACTIVE_SELECTOR)) return;
      focusOverlay(modalAncestor);
    };
    document.addEventListener('mousedown', handlePointerDown, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('mousedown', handlePointerDown, true);
    };
  }, []);
};

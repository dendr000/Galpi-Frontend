// 파일 위치: src/domains/memo/shared/hooks/useMemoBookmark.js
// 기능 요약: 에디터 내 텍스트 노드에 투명 발판과 함께 마커를 꽂아 넣고, 텔레포트 스크롤을 제어하는 단독 엔진입니다.
import { useState, useCallback } from 'react';
import { askText } from '../../../../utils/askText';

export const useMemoBookmark = ({ editorRef, updateCharCount, saveMemo }) => {
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  // 에디터 본문에 박혀있는 책갈피 노드들을 싹 다 스캔해서 배열로 반환
  const scanBookmarks = useCallback(() => {
    if (!editorRef.current) return [];
    const nodes = editorRef.current.querySelectorAll('.galpi-bookmark');
    const found = Array.from(nodes).map(node => ({
      id: node.id,
      name: node.innerText.replace('🔖', '').trim(),
      element: node
    }));
    setBookmarks(found);
    return found;
  }, [editorRef]);

  // Ctrl+K 입력 시 책갈피 삽입
  const insertBookmark = useCallback(async () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    // 입력 창이 뜨면 커서(선택 영역)가 입력칸으로 옮겨가므로, 묻기 전에 삽입 위치를 기억해 두었다가 되돌린다.
    const savedRange = selection.getRangeAt(0).cloneRange();
    const name = await askText("새 책갈피 이름을 입력하세요:");
    if (!name || !name.trim()) return;

    if (!editorRef.current) return;
    editorRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(savedRange);

    const safeName = name.trim().replace(/\s+/g, '_');
    const bmId = `bm_${safeName}_${Date.now()}`;

    // ★ 커서 튕김 방지용 투명 발판(&#8203;) 및 단단한 블록(contenteditable="false") 설정
    const html = `&#8203;<span id="${bmId}" class="galpi-bookmark" contenteditable="false" style="color: var(--primary-color); background: rgba(59,91,219,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin: 0 2px; user-select: none; cursor: default;">🔖 ${name.trim()}</span>&#8203;`;

    document.execCommand('insertHTML', false, html);

    if (updateCharCount) updateCharCount();
    if (saveMemo) setTimeout(saveMemo, 100);

    scanBookmarks();
  }, [editorRef, updateCharCount, saveMemo, scanBookmarks]);

  // Alt+G 입력 시 찾아가기 모달 호출
  const openBookmarkModal = useCallback(() => {
    scanBookmarks();
    setIsBookmarkModalOpen(true);
  }, [scanBookmarks]);

  const closeBookmarkModal = useCallback(() => {
    setIsBookmarkModalOpen(false);
  }, []);

  // 모달에서 특정 책갈피 클릭 시 해당 노드로 부드럽게 스크롤 (텔레포트)
  const scrollToBookmark = useCallback((bmId) => {
    if (!editorRef.current) return;
    const node = editorRef.current.querySelector(`#${bmId}`);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 시각적 피드백: 찾은 책갈피 1.5초간 반짝임 효과
      const origBg = node.style.background;
      const origColor = node.style.color;
      node.style.background = 'var(--primary-color)';
      node.style.color = 'white';
      
      setTimeout(() => {
        node.style.background = origBg;
        node.style.color = origColor;
      }, 1500);
    }
    closeBookmarkModal();
  }, [editorRef, closeBookmarkModal]);

  return {
    isBookmarkModalOpen,
    bookmarks,
    insertBookmark,
    openBookmarkModal,
    closeBookmarkModal,
    scrollToBookmark
  };
};
// 파일 위치: src/domains/fabTools/hooks/useBoilerplateListener.js
// 기능 요약: 텍스트 입력망을 전역 감시하여 상용구를 즉각 추천하고 발동시키는 물리 이벤트 스캐너
// 버전: v2.4.0 (다중 리스너 고스트 팝업 제거 및 DB 타이틀 투명 공백 완벽 클렌징)

import { useEffect } from 'react';
import { getActiveFolder, selectActiveBoilerplates } from '../utils/activeFolder';

const getCurrentLineText = (editor, isContentEditable) => {
  if (!isContentEditable) {
    const textBefore = editor.value.substring(0, editor.selectionStart);
    return textBefore.substring(textBefore.lastIndexOf('\n') + 1);
  }
  
  const sel = window.getSelection();
  if (!sel.rangeCount) return "";
  const range = sel.getRangeAt(0);
  
  let block = range.startContainer;
  while (block && block !== editor && !['DIV', 'P', 'LI', 'TH', 'TD', 'TR'].includes(block.tagName)) {
    block = block.parentNode;
  }
  if (!block || block === editor) block = range.startContainer.parentNode;
  
  const preRange = range.cloneRange();
  preRange.selectNodeContents(block);
  preRange.setEnd(range.startContainer, range.startOffset);
  
  const frag = preRange.cloneContents();
  const tempDiv = document.createElement('div');
  tempDiv.appendChild(frag);
  
  const brs = tempDiv.querySelectorAll('br');
  brs.forEach(br => br.replaceWith(document.createTextNode('\n')));
  
  const textBefore = tempDiv.textContent || "";
  return textBefore.substring(textBefore.lastIndexOf('\n') + 1);
};

export const useBoilerplateListener = ({ globalBpList, bpCore, showToast }) => {
  useEffect(() => {
    const handleInput = (e) => {
      if (e._bpHandled) {
        bpCore.closeBpPopup();
        return;
      }

      const isTextarea = e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT';
      const isContentEditable = e.target.isContentEditable;
      if (!isTextarea && !isContentEditable) return;
      
      if (e.target.closest('.modal-overlay')) return;

      e._bpHandled = true;

      const isPreviewOn = localStorage.getItem('galpi-bp-preview') !== 'false';
      if (!isPreviewOn || bpCore.popupStateRef.current.mode === 'choice') return;

      const editor = e.target;
      let currentLine = getCurrentLineText(editor, isContentEditable);
      
      currentLine = currentLine.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '');

      if (currentLine.length >= 1) {
        const activeBps = selectActiveBoilerplates(globalBpList, getActiveFolder(localStorage));

        let suggests = [];
        let keywordLen = 0;
        const checkLimit = Math.max(0, currentLine.length - 30);

        for (let i = checkLimit; i < currentLine.length; i++) {
          let suffix = currentLine.substring(i);
          if (suffix.trim() === '') continue;

          // ★ 픽스: 내가 친 글자뿐만 아니라, 등록된 상용구 이름(title)에 묻은 투명 찌꺼기까지 완벽히 털어내고 비교합니다.
          let matched = activeBps.filter(b => {
             const cleanTitle = b.title.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').toLowerCase();
             return cleanTitle.startsWith(suffix.toLowerCase());
          });
          
          if (matched.length > 0) {
            matched.sort((a, b) => {
              const cleanA = a.title.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').toLowerCase();
              const cleanB = b.title.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').toLowerCase();
              const cleanSuffix = suffix.toLowerCase();
              if (cleanA === cleanSuffix && cleanB !== cleanSuffix) return -1;
              if (cleanB === cleanSuffix && cleanA !== cleanSuffix) return 1;
              return cleanA.length - cleanB.length;
            });
            suggests = matched;
            keywordLen = suffix.length;
            break;
          }
        }

        if (suggests.length > 0) {
          suggests = suggests.filter((v, idx, a) => a.findIndex(t => (t.id === v.id)) === idx);
          const coords = bpCore.getCaretCoordinates(editor, isContentEditable ? null : editor.selectionEnd);
          const rect = editor.getBoundingClientRect();
          
          let topPos = isContentEditable ? coords.y + 8 : rect.top - editor.scrollTop + coords.y + coords.h + 10;
          let leftPos = isContentEditable ? coords.x : rect.left - editor.scrollLeft + coords.x;

          if (topPos + 200 > window.innerHeight) topPos = window.innerHeight - 210;
          if (leftPos + 250 > window.innerWidth) leftPos = window.innerWidth - 260;

          bpCore.targetEditorRef.current = editor;
          bpCore.updatePopupState({
            active: true, mode: 'suggest', matches: suggests.slice(0, 6),
            selectedIdx: 0, keywordLength: keywordLen, x: leftPos, y: topPos
          });
        } else {
          bpCore.closeBpPopup();
        }
      } else {
        bpCore.closeBpPopup();
      }
    };

    const handleKeydown = (e) => {
      if (e._bpHandledKey) {
        bpCore.closeBpPopup();
        return;
      }

      const isTextarea = e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT';
      const isContentEditable = e.target.isContentEditable;
      if (!isTextarea && !isContentEditable) return;

      if (e.target.closest('.modal-overlay')) return;

      e._bpHandledKey = true;

      const state = bpCore.popupStateRef.current;
      const editor = e.target;

      if (state.active) {
        if (e.key === 'ArrowDown') { e.preventDefault(); bpCore.updatePopupState(p => ({ ...p, selectedIdx: (p.selectedIdx + 1) % p.matches.length })); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); bpCore.updatePopupState(p => ({ ...p, selectedIdx: (p.selectedIdx - 1 + p.matches.length) % p.matches.length })); return; }
        if (e.key === 'Escape') { e.preventDefault(); bpCore.closeBpPopup(); return; }

        if (state.mode === 'choice') {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bpCore.commitBpExpansion(); return; }
          if (e.key >= '1' && e.key <= '9') {
            const idx = parseInt(e.key) - 1;
            if (idx < state.matches.length) { e.preventDefault(); bpCore.commitBpExpansion(idx); }
            return;
          }
        } else if (state.mode === 'suggest') {
          if (e.key === 'Tab' || e.key === 'Enter') {
            if (e.isComposing) return;
            e.preventDefault(); bpCore.commitBpExpansion(); return;
          }
          if (e.key === ' ') { bpCore.closeBpPopup(); return; }
        }

        const allowedKeys = ['Process', 'Unidentified', 'Shift', 'Control', 'Alt', 'Meta', 'Backspace', 'Delete'];
        if (e.key.length !== 1 && !allowedKeys.includes(e.key)) {
          bpCore.closeBpPopup();
        }
      }

      const isAuto = localStorage.getItem('galpi-bp-auto') !== 'false' && (e.key === ' ' || e.key === 'Enter') && !e.shiftKey;
      const isManual = e.altKey && e.key === 'Enter';

      if (isManual || isAuto) {
        let currentLine = getCurrentLineText(editor, isContentEditable);

        currentLine = currentLine.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').trimEnd();

        const activeBps = selectActiveBoilerplates(globalBpList, getActiveFolder(localStorage));

        const exactMatches = activeBps.filter(b => {
           const cleanTitle = b.title.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').toLowerCase();
           return currentLine.toLowerCase().endsWith(cleanTitle);
        });

        if (exactMatches.length > 0) {
          const maxLength = Math.max(...exactMatches.map(b => b.title.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').length));
          const longestMatches = exactMatches.filter(b => b.title.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').length === maxLength);

          if (longestMatches.length === 1) {
            e.preventDefault();
            bpCore.targetEditorRef.current = editor;
            bpCore.popupStateRef.current = { ...bpCore.popupStateRef.current, active: true, matches: longestMatches, selectedIdx: 0, keywordLength: longestMatches[0].title.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').length };
            bpCore.commitBpExpansion();
            return;
          } else if (longestMatches.length > 1) {
            e.preventDefault();
            bpCore.targetEditorRef.current = editor;
            const coords = bpCore.getCaretCoordinates(editor, isContentEditable ? null : editor.selectionEnd);
            const rect = editor.getBoundingClientRect();
            
            let topPos = isContentEditable ? coords.y + 8 : rect.top - editor.scrollTop + coords.y + coords.h + 10;
            let leftPos = isContentEditable ? coords.x : rect.left - editor.scrollLeft + coords.x;
            
            bpCore.updatePopupState({
              active: true, mode: 'choice', matches: longestMatches, selectedIdx: 0,
              keywordLength: longestMatches[0].title.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').length, x: leftPos, y: topPos
            });
            return;
          }
        } else if (isManual) {
          if (showToast) showToast("커서 앞에 일치하는 단축어가 없습니다.");
        }
      }
    };

    const handleMouseDown = (e) => {
      if (bpCore.popupStateRef.current.active && !e.target.closest('.bp-suggest-popup')) {
        bpCore.closeBpPopup();
      }
    };

    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('mousedown', handleMouseDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeydown, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [globalBpList, bpCore, showToast]);
};
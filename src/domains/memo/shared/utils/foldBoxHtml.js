// Copyright (c) dendr000. MIT License.
// 파일 위치: src/domains/memo/shared/utils/foldBoxHtml.js
// 메모 에디터의 "접기 박스"(details) HTML 을 만드는 순수 함수.
// 툴바의 "접기 박스 삽입" 버튼과 '유저노트' 폴더 새 메모 자동 내용이 같은 모양을 쓰도록 한 곳에 모았다.

export const svgClose = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const svgPlay = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;

// 커서가 놓일 수 있는 빈 줄 한 칸.
export const BLANK_LINE_HTML = '<div><br></div>';

const escapeHtml = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 접기 박스 하나. title 을 주면 제목 칸에 미리 채워 넣고, 비우면 빈 제목 칸(플레이스홀더 표시)이 된다.
// 박스 뒤의 빈 줄은 붙이지 않는다(여러 박스를 이어 붙일 때 호출부가 정한다).
export const buildFoldBoxHtml = (title = '') =>
  `<div style="position:relative; margin:15px 0; padding-top:28px;" contenteditable="false"><button type="button" onclick="this.parentElement.remove()" style="position:absolute; top:0; right:0; background:#e53e3e; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer; font-size:11px; font-weight:bold; z-index:10; display:flex; align-items:center; gap:4px;">${svgClose} 박스 삭제</button><details open style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--table-bg-alt); overflow: hidden; font-size:13px;"><summary onmousedown="if(event.target.closest('.fold-title')) return; event.preventDefault(); const d = this.closest('details'); d.open = !d.open;" onclick="if(!event.target.closest('.fold-title')) event.preventDefault();" style="padding: 10px 15px; font-weight: 900; cursor: pointer; color: var(--primary-color); outline: none; list-style:none; display:flex; align-items:center; gap:8px;"><span contenteditable="false" style="display:flex; align-items:center; justify-content:center; user-select:none; padding:2px; pointer-events:none;">${svgPlay}</span><span class="fold-title" contenteditable="true" data-placeholder="접기 박스 제목 (Tab을 눌러 내용으로)" style="outline:none; flex:1; min-width:50px; cursor:text;">${escapeHtml(title)}</span></summary><div class="fold-content" contenteditable="true" data-placeholder="숨길 내용을 입력하세요..." style="padding: 15px; border-top: 1px dashed var(--border-color); line-height: 1.6; background: var(--surface-color); outline:none; min-height:50px;"></div></details></div>`;

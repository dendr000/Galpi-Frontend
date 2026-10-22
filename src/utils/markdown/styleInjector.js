// 매크로(각주, 백링크, 접기, 인용, 게이지, 대화) 전용 CSS. 화면에는 injectMacroStyles 가 주입하고, 공개용 내보내기는 이 문자열을 그대로 넣는다.
export const MACRO_STYLE_CSS = `
        .wiki-footnote { position: relative; display: inline-block; transition: background-color 0.2s; cursor: help; color: var(--primary-color); font-weight: bold; }
        .wiki-footnote:hover { background-color: var(--table-bg-alt); border-radius: 4px; }
        .wiki-backlink { color: var(--primary-color); font-weight: 900; text-decoration: none; border-bottom: 2px solid rgba(59,91,219,0.3); padding: 0 3px; transition: 0.2s; cursor: pointer; border-radius: 2px; }
        .wiki-backlink:hover { background: rgba(59,91,219,0.1); border-bottom-color: var(--primary-color); }
        .galpi-ext-fold { border: 1px solid var(--border-color); border-radius: 8px; margin: 15px 0; background: var(--surface-color); box-shadow: 0 4px 15px rgba(0,0,0,0.03); overflow: hidden; transition: all 0.3s ease; }
        .galpi-ext-fold summary { padding: 14px 18px; font-weight: 900; cursor: pointer; background: var(--table-bg-alt); color: var(--primary-color); list-style: none; user-select: none; font-size: 14px; outline: none; display: flex; align-items: center; }
        .galpi-ext-fold summary:hover { background: rgba(59,91,219,0.05); }
        .galpi-ext-fold summary::-webkit-details-marker { display: none; }
        .galpi-ext-fold summary::before { content: '>'; display: inline-block; margin-right: 12px; font-size: 18px; font-family: monospace; transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); line-height: 1; padding-bottom: 2px; color: var(--text-secondary); font-weight: 900; }
        .galpi-ext-fold[open] summary::before { transform: rotate(90deg); color: var(--primary-color); }
        .galpi-ext-fold .fold-content { padding: 18px; border-top: 1px dashed var(--border-color); font-size: 14px; line-height: 1.6; color: var(--text-primary); background: var(--bg-color); animation: fadeIn 0.3s ease; }
        .galpi-ext-quote { border: 1px solid var(--border-color); border-left: 4px solid var(--primary-color); background: var(--table-bg-alt); padding: 14px 20px; margin: 15px 0; border-radius: 4px 8px 8px 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); color: var(--text-primary); line-height: 1.7; font-size: 14px; word-break: keep-all; width: fit-content; max-width: 100%; }
        .galpi-ext-bar-wrap { margin: 15px 0; display: flex; flex-direction: column; gap: 10px; padding: 15px; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: var(--shadow-sm); }
        .galpi-ext-bar-item { display: flex; align-items: center; gap: 15px; }
        .galpi-ext-bar-label { width: 80px; font-weight: 900; font-size: 13px; color: var(--text-primary); text-align: right; }
        .galpi-ext-bar-track { flex: 1; height: 14px; background: var(--table-bg-alt); border-radius: 8px; overflow: hidden; position: relative; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); border: 1px solid var(--border-color); }
        .galpi-ext-bar-fill { height: 100%; border-radius: 8px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
        .galpi-ext-bar-value { width: 65px; font-size: 12px; font-weight: bold; color: var(--text-secondary); }
        .galpi-ext-chat-room { margin: 15px 0; display: flex; flex-direction: column; gap: 10px; padding: 15px; background: var(--table-bg-alt); border-radius: 12px; border: 1px solid var(--border-color); }
        .galpi-ext-msg { display: flex; flex-direction: column; gap: 4px; max-width: 80%; }
        .galpi-ext-msg-name { font-size: 11px; font-weight: bold; color: var(--text-secondary); margin-left: 5px; }
        .galpi-ext-msg-bubble { padding: 8px 12px; border-radius: 14px; font-size: 13px; line-height: 1.5; color: white; background: var(--primary-color); border-top-left-radius: 4px; word-break: break-all; box-shadow: 0 1px 2px rgba(0,0,0,0.1); display: inline-block; }
        .galpi-ext-msg.right { align-self: flex-end; align-items: flex-end; }
        .galpi-ext-msg.right .galpi-ext-msg-name { margin-left: 0; margin-right: 5px; }
        .galpi-ext-msg.right .galpi-ext-msg-bubble { background: var(--surface-color); color: var(--text-primary); border: 1px solid var(--border-color); border-top-left-radius: 14px; border-top-right-radius: 4px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;

export const injectMacroStyles = () => {
    if (typeof document === 'undefined' || document.getElementById('galpi-macro-styles')) return;
    const style = document.createElement('style');
    style.id = 'galpi-macro-styles';
    style.innerHTML = MACRO_STYLE_CSS;
    document.head.appendChild(style);
};
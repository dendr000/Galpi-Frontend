// Copyright (c) dendr000. MIT License.
// 파일 위치: src/components/common/TextPromptModal.jsx
// 기능 요약: window.prompt() 대신 쓰는 앱 안의 글자 입력 모달. Electron(exe)에서는 prompt 가 동작하지 않는다.
// 사용: askText(utils/askText.js) -> window.openTextPromptModal(메시지, 기본값) -> Promise<글자|null>

import React, { useState, useEffect, useRef } from 'react';

export const TextPromptModal = () => {
  const [state, setState] = useState(null); // { message, value } | null
  const resolverRef = useRef(null);

  useEffect(() => {
    window.openTextPromptModal = (message, defaultValue = '') => {
      // 이미 열린 입력창이 있으면 취소로 닫고 새로 연다.
      if (resolverRef.current) resolverRef.current(null);
      setState({ message, value: defaultValue });
      return new Promise((resolve) => {
        resolverRef.current = resolve;
      });
    };
    return () => {
      if (window.openTextPromptModal) delete window.openTextPromptModal;
    };
  }, []);

  const finish = (result) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setState(null);
    if (resolve) resolve(result);
  };

  if (!state) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) finish(state.value);
    if (e.key === 'Escape') finish(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, backdropFilter: 'blur(2px)' }}
      onClick={() => finish(null)}
    >
      <div
        style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', padding: '24px', borderRadius: '12px', width: '380px', maxWidth: '90vw', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{state.message}</div>
        <input
          type="text"
          autoFocus
          autoComplete="off"
          spellCheck="false"
          value={state.value}
          onChange={(e) => setState((prev) => ({ ...prev, value: e.target.value }))}
          onKeyDown={handleKeyDown}
          style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', outline: 'none' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="wiki-btn outline-btn gray" onClick={() => finish(null)} style={{ padding: '8px 16px', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>취소</button>
          <button className="wiki-btn" onClick={() => finish(state.value)} style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default TextPromptModal;

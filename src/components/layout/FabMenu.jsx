// 파일 위치: src/components/layout/FabMenu.jsx
// 기능 요약: 글로벌 모달 트리거들을 감싸고 있으며, 사전 및 상용구 데이터를 전역으로 패치하여 백그라운드 키보드 감시망에 연결하는 컴포넌트
// 버전: v2.7.0 (서브 모달 스택 구조 대응)

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useModalStore } from '../../store/useModalStore';
import api from '../../api/axiosCore';

import ClipboardModal from '../../domains/fabTools/ClipboardModal';
import DictModal from '../../domains/fabTools/dict/DictModal';
import SearchModal from '../../domains/fabTools/SearchModal';
import RecentModal from '../../domains/fabTools/RecentModal';
import MemoModal from '../../domains/memo/fab/FabMemoModal';
import { seedDictIfNeeded, resolveCycleReplacement } from '../../utils/dictLocalDb';

// 상용구 모듈 인젝션
import BoilerplateModal from '../../domains/fabTools/boilerplate/BoilerplateModal';
import BoilerplateSuggestPopup from '../../domains/fabTools/boilerplate/components/BoilerplateSuggestPopup';
import { useBoilerplateCore } from '../../domains/fabTools/boilerplate/hooks/useBoilerplateCore';
import { useBoilerplateListener } from '../../domains/fabTools/boilerplate/hooks/useBoilerplateListener';

const FabMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // ★ subModal 상태 추가 호출
  const { activeModal, subModal, openModal, closeModal, addClipboard } = useModalStore();
  const navigate = useNavigate();
  const location = useLocation();

  // ★ 픽스 1: ?id=15 형태의 주소에서도 정확히 작품 번호를 뽑아내도록 스캐너 업그레이드
  const searchParams = new URLSearchParams(location.search);
  const currentWorkId = searchParams.get('workId') || searchParams.get('id') || location.pathname.match(/\/work\/(\d+)/)?.[1] || 'global';

  const [globalBpList, setGlobalBpList] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  // ★ Alt+H 실시간 순환 치환용 사전은 이제 작품별로 나뉘지 않는다 — IndexedDB 로컬 캐시에
  // 전체(10만 건+)를 최초 1회만 적재해두고(dictLocalDb.seedDictIfNeeded, 재방문 시엔 즉시
  // 반환), 이후 매 키 입력마다 배열 전체를 순회하는 대신 인덱스로 조회한다. 예전엔 이 전체
  // 사전을 매번 API로 통째로 받아와 배열에 담던 게 백엔드 OOM/브라우저 크래시의 실제 원인이라
  // 작품별로 잘라서 받아오는 방식으로 우회했었는데, 그 우회가 "등록한 작품이 아니면 사전 검색이
  // 안 되는" 혼란을 낳아 이 방식으로 다시 바꿨다.
  useEffect(() => {
    seedDictIfNeeded(api);
  }, []);

  // 상용구 동기화 (실시간 핑 수신 대기)
  useEffect(() => {
    const fetchBps = () => api.get('/api/boilerplates').then(res => setGlobalBpList(res.data)).catch(() => {});
    fetchBps();
    window.addEventListener('galpi-bp-sync', fetchBps);
    return () => window.removeEventListener('galpi-bp-sync', fetchBps);
  }, []);

  const bpCore = useBoilerplateCore(showToast);
  useBoilerplateListener({ globalBpList, bpCore, showToast });

  useEffect(() => {
    const handleCopy = () => {
      const text = window.getSelection().toString();
      if (text) addClipboard(text);
    };
    
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault(); e.stopPropagation();
        openModal('clipboard');
      }
      
      // ★ 이전에 작성한 열려있는 팹 모달을 닫는 전역 단축키 (Ctrl + Esc) 유지
      if ((e.ctrlKey || e.metaKey) && e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        closeModal();
      }
      
      // Alt + H 고유명사 한자 실시간 다중 순환 치환 연산 (한자 단독 출력 제거)
      // IndexedDB 인덱스 조회라 비동기다 — 커서 앞 텍스트/위치를 미리 캡처해두고, 조회가 끝난
      // 뒤 그 사이 커서나 내용이 바뀌지 않았을 때만 적용한다(빠르게 연타해도 엉뚱한 자리에
      // 치환이 끼어드는 걸 방지).
      if (e.altKey && e.key.toLowerCase() === 'h' && e.target.tagName.match(/INPUT|TEXTAREA/)) {
        e.preventDefault(); e.stopPropagation();
        const input = e.target;
        const text = input.value;
        const cursor = input.selectionStart;
        const textBefore = text.substring(0, cursor);

        resolveCycleReplacement(textBefore).then(result => {
          if (!result) return;
          if (input.value !== text || input.selectionStart !== cursor) return; // 그 사이 변경됐으면 적용하지 않음

          const { matchLength, replacement } = result;
          input.value = text.substring(0, cursor - matchLength) + replacement + text.substring(cursor);
          input.selectionStart = input.selectionEnd = cursor - matchLength + replacement.length;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('keydown', handleKey, true);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('keydown', handleKey, true);
    };
  }, [addClipboard, openModal, closeModal]);

  const btnSty = { width: '48px', height: '48px', borderRadius: '50%', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', outline: 'none' };

  // ★ 핵심: 메인 모달이나 서브 모달 둘 중 하나라도 켜져 있으면 렌더링을 허용하는 함수
  const isModalOpen = (name) => activeModal === name || subModal === name;

  return (
    <>
      <BoilerplateSuggestPopup 
        popupState={bpCore.bpPopupState} 
        commitBpExpansion={bpCore.commitBpExpansion} 
        updatePopupState={bpCore.updatePopupState} 
      />

      {/* 바깥 상자는 닫힌 메뉴 칸(투명)까지 포함해 위로 길게 차지하므로 클릭을 통과시키고, 팹 버튼과 열린 메뉴만 클릭을 받는다 */}
      <div className="galpi-fab-wrap" style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 9000, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: '15px', pointerEvents: 'none' }}>
        <button 
          id="galpi-fab-main"
          onClick={() => setIsOpen(!isOpen)} 
          style={{ width: '60px', height: '60px', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.3s', outline: 'none', pointerEvents: 'auto' }}
        >
          <img src="/img/svg/fab.svg" alt="메뉴" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', transform: isOpen ? 'rotate(90deg) scale(1.05)' : 'none', transition: '0.3s' }} />
        </button>

        <div className="galpi-fab-menu" style={{ display: 'flex', flexDirection: 'column-reverse', gap: '12px', opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none', transform: isOpen ? 'translateY(0)' : 'translateY(20px)', transition: '0.3s' }}>
          <button className="galpi-fab-item" onClick={() => { setIsOpen(false); navigate(`/bulk?workId=${currentWorkId}`); }} style={btnSty} title="일괄 수정"><img src="/img/svg/character.svg" alt="일괄수정" style={{width:'100%', height:'100%', objectFit:'contain'}}/></button>
          <button className="galpi-fab-item" onClick={() => { setIsOpen(false); openModal('memo'); }} style={btnSty} title="가상 메모장"><img src="/img/svg/memo.svg" alt="메모" style={{width:'100%', height:'100%', objectFit:'contain'}}/></button>
          <button className="galpi-fab-item" onClick={() => openModal('search')} style={btnSty} title="전역 인물 검색"><img src="/img/svg/search.svg" alt="검색" style={{width:'100%', height:'100%', objectFit:'contain'}}/></button>
          <button className="galpi-fab-item" onClick={() => openModal('dict')} style={btnSty} title="고유명사 사전 (Alt+H)"><img src="/img/svg/dictionary.svg" alt="사전" style={{width:'100%', height:'100%', objectFit:'contain'}}/></button>
          <button className="galpi-fab-item" onClick={() => openModal('boilerplate')} style={btnSty} title="스마트 상용구"><img src="/img/svg/boilerplate.svg" alt="상용구" style={{width:'100%', height:'100%', objectFit:'contain'}}/></button>
          <button className="galpi-fab-item" onClick={() => openModal('clipboard')} style={btnSty} title="클립보드 내역 (Ctrl+Shift+V)"><img src="/img/svg/clipboard.svg" alt="클립보드" style={{width:'100%', height:'100%', objectFit:'contain'}}/></button>
          <button className="galpi-fab-item" onClick={() => openModal('recent')} style={btnSty} title="최근 열람 기록"><img src="/img/svg/recents.svg" alt="최근" style={{width:'100%', height:'100%', objectFit:'contain'}}/></button>
          <button className="galpi-fab-item" onClick={() => { setIsOpen(false); window.scrollTo({top:0, behavior:'smooth'}); }} style={{...btnSty, background: 'var(--table-bg-alt)'}} title="최상단 이동"><img src="/img/svg/scrollTop.svg" alt="최상단" style={{width:'100%', height:'100%', objectFit:'contain'}}/></button>
        </div>
      </div>

      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '110px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 999999, fontWeight: 'bold', fontSize: '14px', animation: 'fadeIn 0.3s ease' }}>
          {toastMsg}
        </div>
      )}

      {/* ★ 변경: activeModal뿐만 아니라 subModal 상태일 때도 렌더링되도록 스마트 허용 로직 적용 */}
      {isModalOpen('clipboard') && <ClipboardModal showToast={showToast} />}
      {isModalOpen('dict') && <DictModal showToast={showToast} />}
      {isModalOpen('boilerplate') && <BoilerplateModal showToast={showToast} />}
      {isModalOpen('search') && <SearchModal currentWorkId={currentWorkId} />}
      {isModalOpen('recent') && <RecentModal />}
      {isModalOpen('memo') && <MemoModal bpCore={bpCore} globalBpList={globalBpList} />}
    </>
  );
};

export default FabMenu;
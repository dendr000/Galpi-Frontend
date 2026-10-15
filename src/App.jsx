// 파일 위치: src/App.jsx
// 기능 요약: 애플리케이션 최상위 라우팅 및 에디터/스튜디오 모드 진입 시 전역 레이아웃 100% 확장 처리
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import { useBossKey } from './hooks/useBossKey';
import { useHorizontalScroll } from './hooks/useHorizontalScroll';
import { useGlobalModalFocusGuard } from './hooks/useGlobalModalFocusGuard';
import useSettingStore from './store/useSettingStore';
import useAuthStore from './store/useAuthStore';
import LoginPage from './pages/Login/LoginPage';

import Gnb from './components/layout/Gnb';
import BossBlindLayer from './components/common/BossBlindLayer';
import SettingModal from './components/common/SettingModal';
import SafeDeleteModal from './components/common/SafeDeleteModal';
import TextPromptModal from './components/common/TextPromptModal';
import FabMenu from './components/layout/FabMenu';
import GlobalContextMenu from './components/layout/GlobalContextMenu';
import Footer from './components/layout/footer/Footer';
import CustomCursor from './components/common/CustomCursor';
import StarryBackground from './components/common/StarryBackground';

import Home from './pages/Home/HomePage';
import CategoryPage from './pages/Category/CategoryPage';
import BulkStudioPage from './pages/BulkStudio/BulkStudioPage';
import EditorPage from './pages/Editor/EditorPage'; 
import WorkDetailPage from './pages/WorkDetail/WorkDetailPage'; 

import PageMemoMain from './domains/memo/page/PageMemoMain';
import NovelViewerPage from './pages/NovelViewer/NovelViewerPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

function App() {
  console.log("[App] 최상위 애플리케이션 컴포넌트 렌더링 시작");

  const location = useLocation();
  const isBulkMode = location.pathname.startsWith('/bulk');
  const isEditorMode = location.pathname.startsWith('/edit');
  const isMemoMode = location.pathname.startsWith('/memo');

  // 시크릿 게이트 — 세션 토큰이 없으면(로그아웃 상태거나 만료돼서 axios 인터셉터가 지웠거나)
  // 무슨 경로로 들어왔든 로그인 화면만 보여준다. 서버를 껐다 켜도, 브라우저를 새로 열어도
  // 토큰이 로컬에 남아있는 한 이 체크를 그냥 통과하는 게 "자동 로그인"의 정체다.
  // ★ 훅 규칙 때문에 이 값으로 분기하는 return은 아래 다른 훅들을 전부 호출한 다음에 해야 한다
  // (로그인/로그아웃으로 token 유무가 바뀔 때마다 훅 호출 개수가 달라지면 안 되므로).
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    console.log("[App] 오버스크롤 스와이프 네비게이션 방지 CSS 전역 주입 가동");
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';
    return () => {
      document.documentElement.style.overscrollBehaviorX = 'auto';
      document.body.style.overscrollBehaviorX = 'auto';
    };
  }, []);

  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const { fontSize, layoutWidth, fontFamily, isStarryBackground } = useSettingStore();

  useBossKey();
  useHorizontalScroll();
  useGlobalModalFocusGuard();

  if (!token) return <LoginPage />;

  return (
    <div 
      className="galpi-app"
      spellCheck={false}
      style={{ 
        '--markdown-font-size': `${fontSize}px`, 
        '--markdown-font-family': fontFamily === 'serif' ? "'Noto Serif KR', serif" : (fontFamily === 'monospace' ? "monospace" : "inherit"),
        maxWidth: (isBulkMode || isEditorMode || isMemoMode) ? '100%' : (layoutWidth === 'full' ? '100%' : '1200px'),
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: isBulkMode ? '0' : '48px',
        transition: 'max-width 0.3s ease',
        background: 'var(--bg-color)'
      }}
    >
      <CustomCursor /> {/* ★ 앱 전역 커스텀 커서 마운트 */}
      {isStarryBackground && <StarryBackground />}
      <SettingModal isOpen={isSettingOpen} onClose={() => setIsSettingOpen(false)} />
      <SafeDeleteModal />
      <TextPromptModal />
      <BossBlindLayer />
      <GlobalContextMenu /> 
      
      {!isBulkMode && <FabMenu />}
      {!isBulkMode && !isEditorMode && !isMemoMode && <Gnb setIsSettingOpen={setIsSettingOpen} />}     
      {!isBulkMode && <Footer />}
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/edit" element={<EditorPage />} />
        <Route path="/bulk" element={<BulkStudioPage />} />
        <Route path="/work/:workId" element={<WorkDetailPage />} />
        <Route path="/viewer/:pageId" element={<NovelViewerPage />} />
        <Route path="/memo" element={<PageMemoMain />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
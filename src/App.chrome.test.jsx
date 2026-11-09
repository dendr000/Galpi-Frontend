// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// App 이 화면(주소)별로 앱 틀을 규칙대로 붙이는지 확인한다. 자식 컴포넌트는 표시용 껍데기로 바꿔서 연결만 본다.
import React from 'react';
globalThis.__React = React;
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// vi.mock 은 파일 맨 위로 끌어올려지므로 껍데기 만드는 함수도 함께 끌어올린다
const { stub } = vi.hoisted(() => ({
  stub: (id) => () => globalThis.__React.createElement('div', { 'data-testid': id }),
}));

vi.mock('./hooks/useBossKey', () => ({ useBossKey: () => {} }));
vi.mock('./hooks/useHorizontalScroll', () => ({ useHorizontalScroll: () => {} }));
vi.mock('./hooks/useGlobalModalFocusGuard', () => ({ useGlobalModalFocusGuard: () => {} }));
vi.mock('./store/useAuthStore', () => ({ default: (sel) => sel({ token: 'test-token' }) }));
vi.mock('./pages/Login/LoginPage', () => ({ default: stub('login') }));
vi.mock('./components/layout/Gnb', () => ({ default: stub('gnb') }));
vi.mock('./components/layout/menuBar/MenuBar', () => ({ default: stub('menubar') }));
vi.mock('./components/common/BossBlindLayer', () => ({ default: stub('boss') }));
vi.mock('./components/common/SettingModal', () => ({ default: stub('setting') }));
vi.mock('./components/common/SafeDeleteModal', () => ({ default: stub('safedelete') }));
vi.mock('./components/common/TextPromptModal', () => ({ default: stub('textprompt') }));
vi.mock('./components/common/FindBar', () => ({ default: stub('findbar') }));
vi.mock('./components/layout/FabMenu', () => ({ default: stub('fab') }));
vi.mock('./components/layout/GlobalContextMenu', () => ({ default: stub('ctx') }));
vi.mock('./components/layout/footer/Footer', () => ({ default: stub('footer') }));
vi.mock('./components/common/CustomCursor', () => ({ default: stub('cursor') }));
vi.mock('./components/common/StarryBackground', () => ({ default: stub('starry') }));
vi.mock('./pages/Home/HomePage', () => ({ default: stub('page-home') }));
vi.mock('./pages/Category/CategoryPage', () => ({ default: stub('page-category') }));
vi.mock('./pages/BulkStudio/BulkStudioPage', () => ({ default: stub('page-bulk') }));
vi.mock('./pages/Editor/EditorPage', () => ({ default: stub('page-edit') }));
vi.mock('./pages/WorkDetail/WorkDetailPage', () => ({ default: stub('page-work') }));
vi.mock('./domains/memo/page/PageMemoMain', () => ({ default: stub('page-memo') }));
vi.mock('./pages/NovelViewer/NovelViewerPage', () => ({ default: stub('page-viewer') }));
vi.mock('./pages/NotFound/NotFoundPage', () => ({ default: stub('page-404') }));

import App from './App';

afterEach(cleanup);

const renderAt = (path) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
const has = (id) => screen.queryByTestId(id) !== null;

describe('App: 화면별 앱 틀 연결', () => {
  it('홈에서는 메뉴 바, 상단 바, 떠 있는 메뉴, 푸터가 모두 있다', () => {
    renderAt('/');
    expect(has('page-home')).toBe(true);
    expect(['menubar', 'gnb', 'fab', 'footer'].map(has)).toEqual([true, true, true, true]);
  });

  it('편집기에는 메뉴 바가 있고 상단 바는 없다', () => {
    renderAt('/edit?type=work&action=new');
    expect(has('page-edit')).toBe(true);
    expect(has('menubar')).toBe(true);
    expect(has('gnb')).toBe(false);
  });

  it('메모 화면에는 메뉴 바가 있고 상단 바는 없다', () => {
    renderAt('/memo');
    expect(has('page-memo')).toBe(true);
    expect(has('menubar')).toBe(true);
    expect(has('gnb')).toBe(false);
  });

  it('일괄 편집에는 메뉴 바만 있고 상단 바, 떠 있는 메뉴, 푸터는 없다', () => {
    renderAt('/bulk?workId=3');
    expect(has('page-bulk')).toBe(true);
    expect(has('menubar')).toBe(true);
    expect(['gnb', 'fab', 'footer'].map(has)).toEqual([false, false, false]);
  });
});

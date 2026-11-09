// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 상단 메뉴 바: 역할 속성, 마우스와 키보드 조작, 화면별 활성 조건, 기존 기능 연결.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';

const nav = vi.hoisted(() => ({ navigate: vi.fn(), pathname: '/', search: '' }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => nav.navigate,
  useLocation: () => ({ pathname: nav.pathname, search: nav.search }),
}));

const acts = vi.hoisted(() => ({
  toggleDarkMode: vi.fn(), cycleThemeForWork: vi.fn(), dispatchMenuAction: vi.fn(), openFindBar: vi.fn(),
}));
vi.mock('./menuActions', () => ({
  isDarkMode: () => false,
  MENU_ACTION_EVENT: 'galpi-menu-action',
  ...acts,
}));

import MenuBar from './MenuBar';
import useSettingStore from '../../../store/useSettingStore';

const setIsSettingOpen = vi.fn();
const renderBar = () => render(<MenuBar setIsSettingOpen={setIsSettingOpen} />);
const top = (name) => screen.getByRole('menuitem', { name });
const open = (name) => { fireEvent.click(top(name)); return screen.getByRole('menu'); };

beforeEach(() => {
  nav.pathname = '/';
  nav.search = '';
  Object.values(nav).forEach((v) => v?.mockReset?.());
  Object.values(acts).forEach((f) => f.mockReset());
  setIsSettingOpen.mockReset();
  localStorage.clear();
  useSettingStore.setState({ layoutWidth: 'full', panelLeftOpen: true, panelRightOpen: true });
});
afterEach(cleanup);

describe('MenuBar 구조', () => {
  it('menubar 안에 파일, 편집, 보기, 설정이 있고 처음에는 모두 닫혀 있다', () => {
    renderBar();
    const bar = screen.getByRole('menubar');
    const names = within(bar).getAllByRole('menuitem').map((b) => b.textContent);
    expect(names).toEqual(['파일', '편집', '보기', '설정']);
    for (const n of names) {
      expect(top(n).getAttribute('aria-expanded')).toBe('false');
      expect(top(n).getAttribute('aria-haspopup')).toBe('menu');
    }
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('MenuBar 마우스 조작', () => {
  it('누르면 열리고 다시 누르면 닫힌다', () => {
    renderBar();
    open('파일');
    expect(top('파일').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(top('파일'));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('열린 상태에서 다른 메뉴 위로 마우스를 옮기면 그 메뉴가 열린다', () => {
    renderBar();
    open('파일');
    fireEvent.mouseEnter(top('보기'));
    expect(top('보기').getAttribute('aria-expanded')).toBe('true');
    expect(top('파일').getAttribute('aria-expanded')).toBe('false');
  });

  it('닫혀 있을 때는 마우스를 올려도 열리지 않는다', () => {
    renderBar();
    fireEvent.mouseEnter(top('보기'));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('메뉴 바 바깥을 누르면 닫힌다', () => {
    renderBar();
    open('파일');
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('메뉴 안쪽을 누르는 것만으로는 닫히지 않는다', () => {
    renderBar();
    const menu = open('파일');
    fireEvent.mouseDown(menu);
    expect(screen.queryByRole('menu')).not.toBeNull();
  });

  it('항목을 고르면 기능이 실행되고 메뉴가 닫힌다', () => {
    renderBar();
    open('파일');
    fireEvent.click(screen.getByRole('menuitem', { name: /새 작품/ }));
    expect(nav.navigate).toHaveBeenCalledWith('/edit?type=work&action=new');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('비활성 항목은 aria-disabled 이고 눌러도 실행되지 않으며 메뉴도 그대로다', () => {
    renderBar();
    open('파일');
    const item = screen.getByRole('menuitem', { name: /새 문서/ });
    expect(item.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(item);
    expect(nav.navigate).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeNull();
  });
});

describe('MenuBar 키보드 조작', () => {
  it('Esc 로 닫고 그 메뉴 버튼으로 포커스가 돌아온다', () => {
    renderBar();
    open('편집');
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(top('편집'));
  });

  it('위 버튼에서 아래 방향키를 누르면 열리고 첫 활성 항목에 포커스가 간다', () => {
    renderBar();
    top('파일').focus();
    fireEvent.keyDown(top('파일'), { key: 'ArrowDown' });
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(document.activeElement.textContent).toMatch(/새 작품/);
  });

  it('메뉴 안에서 아래, 위 방향키는 활성 항목만 오가고 끝에서 돌아온다', () => {
    renderBar();
    open('파일'); // 작품 페이지가 아니므로 새 작품만 활성
    const menu = screen.getByRole('menu');
    screen.getByRole('menuitem', { name: /새 작품/ }).focus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement.textContent).toMatch(/새 작품/); // 비활성은 건너뛰고 하나뿐이라 제자리
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement.textContent).toMatch(/새 작품/);
  });

  it('작품 페이지에서는 아래 방향키가 활성 항목을 차례로 지나가고, Home/End 는 처음과 끝으로 간다', () => {
    nav.pathname = '/work/91';
    renderBar();
    open('파일');
    const menu = screen.getByRole('menu');
    screen.getByRole('menuitem', { name: /새 작품/ }).focus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement.textContent).toMatch(/새 문서/);
    fireEvent.keyDown(menu, { key: 'End' });
    expect(document.activeElement.textContent).toMatch(/일괄 편집/);
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement.textContent).toMatch(/새 작품/);
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement.textContent).toMatch(/일괄 편집/);
    fireEvent.keyDown(menu, { key: 'Home' });
    expect(document.activeElement.textContent).toMatch(/새 작품/);
  });

  it('좌우 방향키는 옆 메뉴로 넘어가고 양 끝에서 돌아온다', () => {
    renderBar();
    open('파일');
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowRight' });
    expect(top('편집').getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowLeft' });
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowLeft' });
    expect(top('설정').getAttribute('aria-expanded')).toBe('true');
  });

  it('Enter 와 Space 로 포커스된 항목을 실행한다', () => {
    renderBar();
    open('파일');
    const item = screen.getByRole('menuitem', { name: /새 작품/ });
    item.focus();
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    open('파일');
    const again = screen.getByRole('menuitem', { name: /새 작품/ });
    again.focus();
    fireEvent.keyDown(again, { key: ' ' });
    expect(nav.navigate).toHaveBeenCalledTimes(2);
  });

  it('비활성 항목에 Enter 를 눌러도 실행되지 않는다', () => {
    renderBar();
    open('파일');
    const item = screen.getByRole('menuitem', { name: /새 문서/ });
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('Tab 을 누르면 메뉴가 닫힌다', () => {
    renderBar();
    open('파일');
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('MenuBar 기존 기능 연결', () => {
  it('보기 메뉴의 패널 항목은 menuitemcheckbox 이고 누르면 설정이 바뀐다', () => {
    nav.pathname = '/work/91';
    renderBar();
    open('보기');
    const left = screen.getByRole('menuitemcheckbox', { name: /왼쪽 패널/ });
    expect(left.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(left);
    expect(useSettingStore.getState().panelLeftOpen).toBe(false);
    open('보기');
    expect(screen.getByRole('menuitemcheckbox', { name: /왼쪽 패널/ }).getAttribute('aria-checked')).toBe('false');
  });

  it('본문 폭 제한을 고르면 layoutWidth 가 center 가 되고 다시 고르면 full 로 돌아온다', () => {
    renderBar();
    open('보기');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /본문 폭 제한/ }));
    expect(useSettingStore.getState().layoutWidth).toBe('center');
    open('보기');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /본문 폭 제한/ }));
    expect(useSettingStore.getState().layoutWidth).toBe('full');
  });

  it('다크 모드와 작품 테마 항목은 공용 동작을 부른다', () => {
    nav.pathname = '/work/91';
    renderBar();
    open('보기');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /다크 모드/ }));
    expect(acts.toggleDarkMode).toHaveBeenCalledTimes(1);
    open('보기');
    fireEvent.click(screen.getByRole('menuitem', { name: /작품 테마/ }));
    expect(acts.cycleThemeForWork).toHaveBeenCalledWith('91');
  });

  it('내보내기는 화면에 메뉴 동작 이벤트(export-work)를 보낸다', () => {
    nav.pathname = '/work/91';
    renderBar();
    open('파일');
    fireEvent.click(screen.getByRole('menuitem', { name: /내보내기/ }));
    expect(acts.dispatchMenuAction).toHaveBeenCalledWith('export-work');
  });

  it('환경 설정은 설정 창을 연다', () => {
    renderBar();
    open('설정');
    fireEvent.click(screen.getByRole('menuitem', { name: /환경 설정/ }));
    expect(setIsSettingOpen).toHaveBeenCalledWith(true);
  });

  it('콘솔 로그 항목은 켜고 끈 상태를 저장한다', () => {
    renderBar();
    open('설정');
    const before = screen.getByRole('menuitemcheckbox', { name: /콘솔 로그/ }).getAttribute('aria-checked');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /콘솔 로그/ }));
    expect(localStorage.getItem('galpi.debug')).toBe(before === 'true' ? '0' : '1');
  });

  it('찾기는 이 환경(일반 브라우저)에서 쓸 수 없으면 비활성이다', () => {
    renderBar();
    open('편집');
    expect(screen.getByRole('menuitem', { name: /찾기/ }).getAttribute('aria-disabled')).toBe('true');
  });
});

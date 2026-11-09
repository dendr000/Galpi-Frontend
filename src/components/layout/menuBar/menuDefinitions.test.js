// Copyright (c) dendr000. MIT License.
import { describe, it, expect, vi } from 'vitest';
import { buildMenus, parseWorkRoute } from './menuDefinitions';

const makeActions = () => ({
  navigate: vi.fn(),
  openSettings: vi.fn(),
  toggleDark: vi.fn(),
  cycleTheme: vi.fn(),
  openFind: vi.fn(),
  exportWork: vi.fn(),
  setSetting: vi.fn(),
  toggleDebug: vi.fn(),
});

const ctx = (over = {}) => ({
  pathname: '/',
  search: '',
  settings: { layoutWidth: 'full', panelLeftOpen: true, panelRightOpen: true },
  isDark: false,
  debugOn: false,
  canFind: true,
  actions: makeActions(),
  ...over,
});

const find = (menus, menuId, itemId) => menus.find((m) => m.id === menuId).items.find((i) => i.id === itemId);

describe('parseWorkRoute: 주소에서 작품과 문서 번호 읽기', () => {
  it('작품 페이지면 작품 번호를, 하위 문서를 보고 있으면 문서 번호도 돌려준다', () => {
    expect(parseWorkRoute('/work/91', '')).toEqual({ workId: '91', pageId: null });
    expect(parseWorkRoute('/work/91', '?pageId=7')).toEqual({ workId: '91', pageId: '7' });
  });

  it('작품 페이지가 아니면 둘 다 없다', () => {
    expect(parseWorkRoute('/', '')).toEqual({ workId: null, pageId: null });
    expect(parseWorkRoute('/category', '?pageId=7')).toEqual({ workId: null, pageId: null });
    expect(parseWorkRoute('/edit', '')).toEqual({ workId: null, pageId: null });
  });

  it('작품 번호가 숫자가 아니면 작품 페이지로 보지 않는다', () => {
    expect(parseWorkRoute('/work/abc', '').workId).toBeNull();
  });
});

describe('buildMenus: 메뉴 구성', () => {
  it('메뉴는 파일, 편집, 보기, 설정 순서다', () => {
    const menus = buildMenus(ctx());
    expect(menus.map((m) => m.label)).toEqual(['파일', '편집', '보기', '설정']);
  });

  it('작품 페이지가 아니면 작품에 딸린 항목은 비활성이고 전역 항목은 활성이다', () => {
    const menus = buildMenus(ctx({ pathname: '/' }));
    for (const [m, i] of [['file', 'new-page'], ['file', 'new-char'], ['file', 'export'], ['file', 'bulk'], ['edit', 'edit-work'], ['edit', 'edit-page'], ['view', 'panel-left'], ['view', 'panel-right'], ['view', 'cycle-theme']]) {
      expect(find(menus, m, i).disabled, `${m}/${i}`).toBe(true);
    }
    for (const [m, i] of [['file', 'new-work'], ['edit', 'find'], ['view', 'wide-limit'], ['view', 'dark'], ['settings', 'open-settings'], ['settings', 'debug-logs']]) {
      expect(find(menus, m, i).disabled, `${m}/${i}`).toBeFalsy();
    }
  });

  it('작품 페이지(첫 화면)에서는 작품 항목이 활성이고 문서 수정만 비활성이다', () => {
    const menus = buildMenus(ctx({ pathname: '/work/91' }));
    expect(find(menus, 'file', 'new-page').disabled).toBeFalsy();
    expect(find(menus, 'file', 'new-char').disabled).toBeFalsy();
    expect(find(menus, 'file', 'export').disabled).toBeFalsy();
    expect(find(menus, 'file', 'bulk').disabled).toBeFalsy();
    expect(find(menus, 'edit', 'edit-work').disabled).toBeFalsy();
    expect(find(menus, 'edit', 'edit-page').disabled).toBe(true);
    expect(find(menus, 'view', 'panel-left').disabled).toBeFalsy();
  });

  it('하위 문서를 보는 중에는 문서 수정이 활성이고 내보내기는 비활성이다(내보내기는 작품 첫 화면의 기능)', () => {
    const menus = buildMenus(ctx({ pathname: '/work/91', search: '?pageId=7' }));
    expect(find(menus, 'edit', 'edit-page').disabled).toBeFalsy();
    expect(find(menus, 'file', 'export').disabled).toBe(true);
  });

  it('찾기는 이 환경에서 쓸 수 없으면(canFind=false) 비활성이다', () => {
    const menus = buildMenus(ctx({ canFind: false }));
    expect(find(menus, 'edit', 'find').disabled).toBe(true);
  });

  it('켜고 끄는 항목은 현재 상태를 checked 로 보여 준다', () => {
    const on = buildMenus(ctx({
      pathname: '/work/91', isDark: true, debugOn: true,
      settings: { layoutWidth: 'center', panelLeftOpen: false, panelRightOpen: true },
    }));
    expect(find(on, 'view', 'panel-left').checked).toBe(false);
    expect(find(on, 'view', 'panel-right').checked).toBe(true);
    expect(find(on, 'view', 'wide-limit').checked).toBe(true);
    expect(find(on, 'view', 'dark').checked).toBe(true);
    expect(find(on, 'settings', 'debug-logs').checked).toBe(true);
    const off = buildMenus(ctx({ pathname: '/work/91' }));
    expect(find(off, 'view', 'wide-limit').checked).toBe(false);
    expect(find(off, 'view', 'dark').checked).toBe(false);
    expect(find(off, 'settings', 'debug-logs').checked).toBe(false);
  });

  it('구분선은 항목이 아니라 separator 종류로 들어 있다', () => {
    const menus = buildMenus(ctx());
    const seps = menus.flatMap((m) => m.items).filter((i) => i.kind === 'separator');
    expect(seps.length).toBeGreaterThan(0);
    expect(seps.every((s) => !s.onSelect)).toBe(true);
  });
});

describe('buildMenus: 항목을 고르면 기존 기능을 실행한다', () => {
  it('새 작품, 새 문서, 새 캐릭터, 일괄 편집은 각 화면 주소로 이동한다', () => {
    const c = ctx({ pathname: '/work/91' });
    const menus = buildMenus(c);
    find(menus, 'file', 'new-work').onSelect();
    expect(c.actions.navigate).toHaveBeenLastCalledWith('/edit?type=work&action=new');
    find(menus, 'file', 'new-page').onSelect();
    expect(c.actions.navigate).toHaveBeenLastCalledWith('/edit?type=page&action=new&workId=91');
    find(menus, 'file', 'new-char').onSelect();
    expect(c.actions.navigate).toHaveBeenLastCalledWith('/edit?type=char&action=new&workId=91');
    find(menus, 'file', 'bulk').onSelect();
    expect(c.actions.navigate).toHaveBeenLastCalledWith('/bulk?workId=91');
  });

  it('작품 수정과 문서 수정은 편집 화면 주소로 이동한다', () => {
    const c = ctx({ pathname: '/work/91', search: '?pageId=7' });
    const menus = buildMenus(c);
    find(menus, 'edit', 'edit-work').onSelect();
    expect(c.actions.navigate).toHaveBeenLastCalledWith('/edit?type=work&action=edit&id=91');
    find(menus, 'edit', 'edit-page').onSelect();
    expect(c.actions.navigate).toHaveBeenLastCalledWith('/edit?type=page&action=edit&workId=91&id=7');
  });

  it('내보내기, 찾기, 테마 순환, 다크 모드, 환경 설정, 콘솔 로그는 해당 동작을 부른다', () => {
    const c = ctx({ pathname: '/work/91', debugOn: true });
    const menus = buildMenus(c);
    find(menus, 'file', 'export').onSelect();
    expect(c.actions.exportWork).toHaveBeenCalledTimes(1);
    find(menus, 'edit', 'find').onSelect();
    expect(c.actions.openFind).toHaveBeenCalledTimes(1);
    find(menus, 'view', 'cycle-theme').onSelect();
    expect(c.actions.cycleTheme).toHaveBeenCalledWith('91');
    find(menus, 'view', 'dark').onSelect();
    expect(c.actions.toggleDark).toHaveBeenCalledTimes(1);
    find(menus, 'settings', 'open-settings').onSelect();
    expect(c.actions.openSettings).toHaveBeenCalledTimes(1);
    find(menus, 'settings', 'debug-logs').onSelect();
    expect(c.actions.toggleDebug).toHaveBeenCalledWith(false);
  });

  it('패널과 폭 항목은 설정을 반대로 바꾼다', () => {
    const c = ctx({ pathname: '/work/91', settings: { layoutWidth: 'full', panelLeftOpen: true, panelRightOpen: false } });
    const menus = buildMenus(c);
    find(menus, 'view', 'panel-left').onSelect();
    expect(c.actions.setSetting).toHaveBeenLastCalledWith('panelLeftOpen', false);
    find(menus, 'view', 'panel-right').onSelect();
    expect(c.actions.setSetting).toHaveBeenLastCalledWith('panelRightOpen', true);
    find(menus, 'view', 'wide-limit').onSelect();
    expect(c.actions.setSetting).toHaveBeenLastCalledWith('layoutWidth', 'center');
  });

  it('본문 폭 제한이 켜져 있으면 다시 고를 때 전체 폭으로 돌아간다', () => {
    const c = ctx({ settings: { layoutWidth: 'center', panelLeftOpen: true, panelRightOpen: true } });
    find(buildMenus(c), 'view', 'wide-limit').onSelect();
    expect(c.actions.setSetting).toHaveBeenLastCalledWith('layoutWidth', 'full');
  });
});

describe('buildMenus: 작업 중 화면(편집기, 일괄, 메모)', () => {
  const newWork = (pathname) => {
    const menus = buildMenus({ pathname, search: '', settings: { layoutWidth: 'full', panelLeftOpen: true, panelRightOpen: true }, isDark: false, debugOn: false, canFind: true, actions: {} });
    return menus[0].items.find((i) => i.id === 'new-work');
  };

  it('편집기, 일괄, 메모에서는 저장 안 한 내용을 잃지 않도록 새 작품(화면 이동)이 비활성이다', () => {
    expect(newWork('/edit').disabled).toBe(true);
    expect(newWork('/bulk').disabled).toBe(true);
    expect(newWork('/memo').disabled).toBe(true);
  });

  it('홈, 분류, 작품 페이지에서는 새 작품이 활성이다', () => {
    expect(newWork('/').disabled).toBeFalsy();
    expect(newWork('/category').disabled).toBeFalsy();
    expect(newWork('/work/3').disabled).toBeFalsy();
  });
});

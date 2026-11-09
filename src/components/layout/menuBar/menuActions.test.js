// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const apiMock = vi.hoisted(() => ({ get: vi.fn() }));
const cycleMock = vi.hoisted(() => vi.fn());
vi.mock('../../../api/axiosCore', () => ({ default: apiMock }));
vi.mock('../../../domains/work/genreTheme', () => ({ cycleWorkTheme: cycleMock, THEME_LABELS: { a: '테마 A' } }));

import { isDarkMode, toggleDarkMode, cycleThemeForWork, dispatchMenuAction, MENU_ACTION_EVENT, openFindBar } from './menuActions';

beforeEach(() => {
  document.body.removeAttribute('data-theme');
  localStorage.clear();
  apiMock.get.mockReset();
  cycleMock.mockReset();
});
afterEach(() => { vi.restoreAllMocks(); });

describe('다크 모드', () => {
  it('data-theme 가 dark 일 때만 다크 모드다', () => {
    expect(isDarkMode()).toBe(false);
    document.body.setAttribute('data-theme', 'dark');
    expect(isDarkMode()).toBe(true);
    document.body.setAttribute('data-theme', 'light');
    expect(isDarkMode()).toBe(false);
  });

  it('전환하면 body 속성과 저장값(wiki-theme)이 함께 바뀐다', () => {
    toggleDarkMode();
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('wiki-theme')).toBe('dark');
    toggleDarkMode();
    expect(document.body.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('wiki-theme')).toBe('light');
  });
});

describe('작품 테마 순환', () => {
  it('성공하면 galpi-theme-cycled 이벤트를 보내고 테마 행에 강조 효과를 준다', async () => {
    apiMock.get.mockResolvedValue({ data: { id: 5, genre: 'x' } });
    cycleMock.mockResolvedValue({ theme: 'a' });
    const row = document.createElement('div');
    row.id = 'galpi-theme-row';
    document.body.appendChild(row);
    const got = [];
    window.addEventListener('galpi-theme-cycled', (e) => got.push(e.detail));
    await cycleThemeForWork('5');
    expect(apiMock.get).toHaveBeenCalledWith('/api/works/5');
    expect(got).toEqual([{ workId: '5', theme: 'a' }]);
    expect(row.classList.contains('galpi-theme-pulse')).toBe(true);
    row.remove();
  });

  it('준비된 테마가 없으면 안내만 하고 이벤트는 보내지 않는다', async () => {
    apiMock.get.mockResolvedValue({ data: { id: 5 } });
    cycleMock.mockResolvedValue(null);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const handler = vi.fn();
    window.addEventListener('galpi-theme-cycled', handler);
    await cycleThemeForWork('5');
    expect(alertSpy).toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    window.removeEventListener('galpi-theme-cycled', handler);
  });

  it('작품 번호가 없으면 아무것도 하지 않는다', async () => {
    await cycleThemeForWork(null);
    expect(apiMock.get).not.toHaveBeenCalled();
  });

  it('서버 오류가 나도 예외를 밖으로 던지지 않는다', async () => {
    apiMock.get.mockRejectedValue(new Error('fail'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(cycleThemeForWork('5')).resolves.toBeUndefined();
  });
});

describe('화면에서 보내는 메뉴 동작 이벤트', () => {
  it('dispatchMenuAction 은 종류를 담아 window 이벤트를 보낸다', () => {
    const got = [];
    const h = (e) => got.push(e.detail);
    window.addEventListener(MENU_ACTION_EVENT, h);
    dispatchMenuAction('export-work');
    window.removeEventListener(MENU_ACTION_EVENT, h);
    expect(got).toEqual([{ type: 'export-work' }]);
  });
});

describe('찾기 열기', () => {
  it('Ctrl+F 키 입력을 창에 보내 찾기 창이 열리게 한다', () => {
    const got = [];
    const h = (e) => got.push([e.key, e.ctrlKey]);
    window.addEventListener('keydown', h);
    openFindBar();
    window.removeEventListener('keydown', h);
    expect(got).toEqual([['f', true]]);
  });
});

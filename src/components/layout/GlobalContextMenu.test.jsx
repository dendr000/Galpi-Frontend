// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

vi.mock('../../api/axiosCore', () => ({
  default: { get: vi.fn(), delete: vi.fn() },
}));

import api from '../../api/axiosCore';
import GlobalContextMenu from './GlobalContextMenu';

const LocationProbe = () => <div data-testid="loc">{useLocation().pathname}</div>;

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <GlobalContextMenu />
      <LocationProbe />
    </MemoryRouter>
  );

// Shift+우클릭으로 메뉴를 연다(이 앱의 커스텀 메뉴는 Shift를 누른 우클릭에서만 뜬다).
const openMenu = () => fireEvent.contextMenu(document.body, { shiftKey: true, clientX: 100, clientY: 100 });

beforeEach(() => {
  api.get.mockReset();
  api.delete.mockReset();
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GlobalContextMenu - 현재 작품 영구 삭제 모달', () => {
  const openDeleteDialog = () => {
    renderAt('/work/33');
    openMenu();
    fireEvent.click(screen.getByText(/현재 작품 영구 삭제/));
    return screen.getByPlaceholderText('delete');
  };

  it('Shift 없이 우클릭하면 메뉴가 뜨지 않는다', () => {
    renderAt('/work/33');
    fireEvent.contextMenu(document.body, { clientX: 100, clientY: 100 });
    expect(screen.queryByText(/현재 작품 영구 삭제/)).toBeNull();
  });

  it('작품 페이지가 아니면 삭제 항목이 없다', () => {
    renderAt('/');
    openMenu();
    expect(screen.getByText(/페이지 새로고침/)).toBeTruthy();
    expect(screen.queryByText(/현재 작품 영구 삭제/)).toBeNull();
  });

  // Electron(exe)은 window.prompt()를 지원하지 않아 예전 구현에서는 항목을 눌러도 아무 일도
  // 안 일어났다. 이제는 앱 안의 모달이 떠야 하고 prompt에 의존하면 안 된다.
  it('항목을 누르면 prompt 없이 앱 안의 확인 모달이 뜨고 입력칸에 포커스가 간다', () => {
    const promptSpy = vi.fn();
    window.prompt = promptSpy;
    const input = openDeleteDialog();
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);
    expect(promptSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/소속 등장인물도 함께 삭제/)).toBeTruthy();
  });

  it('틀린 문구를 입력하면 오류를 보여주고 삭제 요청을 보내지 않는다', () => {
    const input = openDeleteDialog();
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('영구 삭제'));
    expect(screen.getByText(/입력한 문구가 정확하지 않습니다/)).toBeTruthy();
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('delete')).toBeTruthy();
  });

  it('비워 둔 채 누르면 삭제하지 않는다', () => {
    openDeleteDialog();
    fireEvent.click(screen.getByText('영구 삭제'));
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('대소문자가 다르면(Delete) 삭제하지 않는다', () => {
    const input = openDeleteDialog();
    fireEvent.change(input, { target: { value: 'Delete' } });
    fireEvent.click(screen.getByText('영구 삭제'));
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('문구를 다시 고치면 오류 메시지가 사라진다', () => {
    const input = openDeleteDialog();
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('영구 삭제'));
    fireEvent.change(input, { target: { value: 'delet' } });
    expect(screen.queryByText(/입력한 문구가 정확하지 않습니다/)).toBeNull();
  });

  it('취소를 누르면 닫히고 아무것도 삭제하지 않는다', () => {
    openDeleteDialog();
    fireEvent.click(screen.getByText('취소'));
    expect(screen.queryByPlaceholderText('delete')).toBeNull();
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByTestId('loc').textContent).toBe('/work/33');
  });

  it('Esc를 누르면 닫힌다', () => {
    const input = openDeleteDialog();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByPlaceholderText('delete')).toBeNull();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('delete를 정확히 입력하고 누르면 해당 작품을 삭제하고 홈으로 이동한다', async () => {
    api.delete.mockResolvedValue({});
    const input = openDeleteDialog();
    fireEvent.change(input, { target: { value: 'delete' } });
    fireEvent.click(screen.getByText('영구 삭제'));

    await waitFor(() => expect(screen.getByTestId('loc').textContent).toBe('/'));
    expect(api.delete).toHaveBeenCalledTimes(1);
    expect(api.delete).toHaveBeenCalledWith('/api/works/33');
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('파기'));
    expect(screen.queryByPlaceholderText('delete')).toBeNull();
  });

  it('Enter 키로도 확인할 수 있다', async () => {
    api.delete.mockResolvedValue({});
    const input = openDeleteDialog();
    fireEvent.change(input, { target: { value: 'delete' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/api/works/33'));
  });

  it('서버가 삭제를 거부하면 오류를 보여주고 모달과 현재 페이지를 유지한다', async () => {
    api.delete.mockRejectedValue(new Error('500'));
    const input = openDeleteDialog();
    fireEvent.change(input, { target: { value: 'delete' } });
    fireEvent.click(screen.getByText('영구 삭제'));

    await waitFor(() => expect(screen.getByText(/삭제 요청이 거부되었습니다/)).toBeTruthy());
    expect(screen.getByTestId('loc').textContent).toBe('/work/33');
    expect(screen.getByPlaceholderText('delete')).toBeTruthy();
    // 실패 뒤에는 다시 시도할 수 있어야 한다(버튼이 '삭제 중...'에 갇히면 안 된다).
    expect(screen.getByText('영구 삭제')).toBeTruthy();
  });

  it('요청이 진행 중일 때 연달아 눌러도 삭제 요청은 한 번만 간다', async () => {
    let resolve;
    api.delete.mockImplementation(() => new Promise((r) => { resolve = r; }));
    const input = openDeleteDialog();
    fireEvent.change(input, { target: { value: 'delete' } });
    fireEvent.click(screen.getByText('영구 삭제'));
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(api.delete).toHaveBeenCalledTimes(1);
    resolve({});
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toBe('/'));
  });
});

describe('GlobalContextMenu - 비밀 금고 열람', () => {
  const clickVault = () => {
    openMenu();
    fireEvent.click(screen.getByText(/비밀 금고 열람/));
  };

  // 숨김 분류의 원본은 DB다. 예전에는 아무도 안 쓰는 localStorage만 읽어서 숨긴 분류가 있는데도
  // "숨김 처리된 분류가 없습니다"라고 나왔다.
  it('DB에 숨김 분류가 있으면 금고 화면을 여는 이벤트를 보낸다', async () => {
    api.get.mockResolvedValue({ data: ['NTL', 'NTR'] });
    const onTrigger = vi.fn();
    window.addEventListener('galpi-trigger-secret-mode', onTrigger);
    renderAt('/category');
    clickVault();

    await waitFor(() => expect(onTrigger).toHaveBeenCalledTimes(1));
    expect(api.get).toHaveBeenCalledWith('/api/hidden-categories');
    expect(window.alert).not.toHaveBeenCalled();
    window.removeEventListener('galpi-trigger-secret-mode', onTrigger);
  });

  it('localStorage가 비어 있어도 DB 기준으로 판단한다(회귀)', async () => {
    localStorage.removeItem('galpi-hidden-categories');
    api.get.mockResolvedValue({ data: ['MTL'] });
    const onTrigger = vi.fn();
    window.addEventListener('galpi-trigger-secret-mode', onTrigger);
    renderAt('/category');
    clickVault();

    await waitFor(() => expect(onTrigger).toHaveBeenCalledTimes(1));
    window.removeEventListener('galpi-trigger-secret-mode', onTrigger);
  });

  it('DB에 숨김 분류가 하나도 없으면 안내만 하고 금고를 열지 않는다', async () => {
    api.get.mockResolvedValue({ data: [] });
    const onTrigger = vi.fn();
    window.addEventListener('galpi-trigger-secret-mode', onTrigger);
    renderAt('/category');
    clickVault();

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('숨김 처리된 분류가 없습니다')));
    expect(onTrigger).not.toHaveBeenCalled();
    window.removeEventListener('galpi-trigger-secret-mode', onTrigger);
  });

  it('조회가 실패해도 "없다"고 단정하지 않고 금고 화면을 연다', async () => {
    api.get.mockRejectedValue(new Error('network'));
    const onTrigger = vi.fn();
    window.addEventListener('galpi-trigger-secret-mode', onTrigger);
    renderAt('/category');
    clickVault();

    await waitFor(() => expect(onTrigger).toHaveBeenCalledTimes(1));
    expect(window.alert).not.toHaveBeenCalled();
    window.removeEventListener('galpi-trigger-secret-mode', onTrigger);
  });

  it('분류 페이지가 아니면 금고 항목이 없다', () => {
    renderAt('/');
    openMenu();
    expect(screen.queryByText(/비밀 금고 열람/)).toBeNull();
  });
});

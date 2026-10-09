// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

vi.mock('../../../api/axiosCore', () => ({
  default: { get: vi.fn() },
}));

import api from '../../../api/axiosCore';
import HeaderSearch from './HeaderSearch';
import { setIncludeHidden } from './searchSettings';

const WORKS = [
  { id: 1, title: '헌터 길드의 하루', genre: '헌터, 현대판타지', description: '' },
  { id: 2, title: '헌터 NTL 이야기', genre: 'NTL, 헌터', description: '' },
  { id: 3, title: '무협 소설', genre: '무협', description: '[META_DATA:{"alias":"헌터무협"}]\n본문' },
  { id: 4, title: '로맨스 일기', genre: '로맨스', description: '' },
];

const LocationProbe = () => <div data-testid="loc">{useLocation().pathname}</div>;

const setup = async ({ hidden = ['NTL'] } = {}) => {
  api.get.mockImplementation((url) => {
    if (url === '/api/works') return Promise.resolve({ data: WORKS });
    if (url === '/api/hidden-categories') return Promise.resolve({ data: hidden });
    return Promise.reject(new Error('unexpected ' + url));
  });
  render(
    <MemoryRouter initialEntries={['/']}>
      <HeaderSearch />
      <LocationProbe />
    </MemoryRouter>
  );
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/hidden-categories'));
  return screen.getByRole('combobox');
};

const type = (input, value) => {
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
};

const options = () => screen.queryAllByRole('option').map((o) => o.textContent);

beforeEach(() => {
  localStorage.clear();
  api.get.mockReset();
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('HeaderSearch - 추천 목록', () => {
  it('입력하기 전에는 추천 목록이 없다', async () => {
    const input = await setup();
    fireEvent.focus(input);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('글자를 입력하면 관련 작품이 아래로 추천된다', async () => {
    const input = await setup();
    type(input, '헌터');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    const titles = options().join('|');
    expect(titles).toContain('헌터 길드의 하루');
    expect(titles).toContain('무협 소설');
    expect(titles).not.toContain('로맨스 일기');
  });

  it('약칭과 장르로도 찾는다', async () => {
    const input = await setup();
    type(input, '헌터무협');
    await waitFor(() => expect(options().join('|')).toContain('무협 소설'));
    type(input, '현대판타지');
    await waitFor(() => expect(options().join('|')).toContain('헌터 길드의 하루'));
  });

  it('일치하는 작품이 없으면 목록을 열지 않는다', async () => {
    const input = await setup();
    type(input, '없는작품');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('입력을 지우면 목록이 사라진다', async () => {
    const input = await setup();
    type(input, '헌터');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Escape로 목록을 닫는다', async () => {
    const input = await setup();
    type(input, '헌터');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('바깥을 누르면 목록이 닫힌다', async () => {
    const input = await setup();
    type(input, '헌터');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

describe('HeaderSearch - 이동', () => {
  it('추천 항목을 클릭하면 그 작품 페이지로 이동하고 검색어가 지워진다', async () => {
    const input = await setup();
    type(input, '로맨스');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    fireEvent.click(screen.getByRole('option'));
    expect(screen.getByTestId('loc').textContent).toBe('/work/4');
    expect(input.value).toBe('');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('화살표로 고르고 엔터를 누르면 고른 작품으로 이동한다', async () => {
    const input = await setup();
    type(input, '헌터');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    const second = screen.getAllByRole('option')[1].textContent;
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'Enter' });
    const id = WORKS.find((w) => second.includes(w.title)).id;
    expect(screen.getByTestId('loc').textContent).toBe(`/work/${id}`);
  });

  it('화살표로 고르지 않고 엔터를 누르면 가장 위(가장 잘 맞는) 작품으로 이동한다', async () => {
    const input = await setup();
    type(input, '헌터');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    const first = screen.getAllByRole('option')[0].textContent;
    fireEvent.keyDown(input, { key: 'Enter' });
    const id = WORKS.find((w) => first.includes(w.title)).id;
    expect(screen.getByTestId('loc').textContent).toBe(`/work/${id}`);
  });

  it('ArrowUp으로 선택을 해제할 수 있다', async () => {
    const input = await setup();
    type(input, '헌터');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    screen.getAllByRole('option').forEach((o) => expect(o.getAttribute('aria-selected')).toBe('false'));
  });

  it('한글 입력 조합 중의 엔터는 무시한다', async () => {
    const input = await setup();
    type(input, '헌터');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(screen.getByTestId('loc').textContent).toBe('/');
  });

  it('일치하는 작품이 없을 때 엔터를 누르면 안내하고 이동하지 않는다', async () => {
    const input = await setup();
    type(input, '없는작품');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('없는작품'));
    expect(screen.getByTestId('loc').textContent).toBe('/');
  });

  it('검색어가 비어 있을 때 엔터는 아무 일도 하지 않는다', async () => {
    const input = await setup();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.getByTestId('loc').textContent).toBe('/');
  });
});

describe('HeaderSearch - 숨김 분류 작품', () => {
  it('기본값에서는 숨김 분류 작품도 추천에 나오고 "숨김 분류" 표시가 붙는다', async () => {
    const input = await setup();
    type(input, 'NTL');
    await waitFor(() => expect(options().join('|')).toContain('헌터 NTL 이야기'));
    expect(options().find((t) => t.includes('헌터 NTL 이야기'))).toContain('숨김 분류');
  });

  it('설정을 끄면 숨김 분류 작품은 추천에서 빠진다', async () => {
    setIncludeHidden(false);
    const input = await setup();
    type(input, '헌터');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    expect(options().join('|')).not.toContain('헌터 NTL 이야기');
    expect(options().join('|')).toContain('헌터 길드의 하루');
  });

  it('설정을 끈 상태에서는 엔터로도 숨김 분류 작품으로 이동하지 않는다', async () => {
    setIncludeHidden(false);
    const input = await setup();
    type(input, 'NTL');
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(window.alert).toHaveBeenCalled();
    expect(screen.getByTestId('loc').textContent).toBe('/');
  });

  it('검색창이 열려 있는 동안 설정을 바꾸면 바로 반영된다', async () => {
    const input = await setup();
    type(input, '헌터');
    await waitFor(() => expect(options().join('|')).toContain('헌터 NTL 이야기'));
    act(() => setIncludeHidden(false));
    await waitFor(() => expect(options().join('|')).not.toContain('헌터 NTL 이야기'));
    act(() => setIncludeHidden(true));
    await waitFor(() => expect(options().join('|')).toContain('헌터 NTL 이야기'));
  });

  it('숨김 분류 목록을 불러오지 못해도 검색은 동작한다', async () => {
    api.get.mockImplementation((url) =>
      url === '/api/works' ? Promise.resolve({ data: WORKS }) : Promise.reject(new Error('fail'))
    );
    render(
      <MemoryRouter>
        <HeaderSearch />
      </MemoryRouter>
    );
    const input = screen.getByRole('combobox');
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/works'));
    type(input, '헌터');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    expect(options().join('|')).toContain('헌터 NTL 이야기');
  });

  it('작품 목록을 못 불러와도 오류 없이 빈 상태로 둔다', async () => {
    api.get.mockRejectedValue(new Error('down'));
    render(
      <MemoryRouter>
        <HeaderSearch />
      </MemoryRouter>
    );
    const input = screen.getByRole('combobox');
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    type(input, '헌터');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

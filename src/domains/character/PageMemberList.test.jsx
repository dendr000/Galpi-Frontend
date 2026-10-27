// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import PageMemberList from './PageMemberList';

afterEach(cleanup);

const members = [
  { id: 4, name: '존 왓슨', 서열: '3' },
  { id: 1, name: '셜록 홈즈', 서열: '4' },
];

const renderList = (over = {}) => {
  const props = { members, work: { title: '작품' }, charExt: 'png', activeCharId: null, onSelect: vi.fn(), styles: {}, sortKey: '', ...over };
  return { props, ...render(<PageMemberList {...props} />) };
};

describe('PageMemberList', () => {
  it('소속 인물이 없으면 아무것도 그리지 않는다', () => {
    const { container } = renderList({ members: [] });
    expect(container.firstChild).toBeNull();
  });

  it('제목에 인원 수를 보여 주고 받은 순서대로 카드를 그린다', () => {
    renderList();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('2');
    expect(screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual(['존 왓슨', '셜록 홈즈']);
  });

  it('카드를 누르면 페이지를 옮기지 않고 그 캐릭터를 선택한다(정보 상자에서 보도록)', () => {
    const { props } = renderList();
    fireEvent.click(screen.getByText('셜록 홈즈').closest('[id^="member-card-"]'));
    expect(props.onSelect).toHaveBeenCalledWith(1);
  });

  it('이미 선택된 카드를 다시 누르면 선택을 푼다', () => {
    const { props } = renderList({ activeCharId: 1 });
    fireEvent.click(screen.getByText('셜록 홈즈').closest('[id^="member-card-"]'));
    expect(props.onSelect).toHaveBeenCalledWith(null);
  });

  it('선택된 카드는 표시한다(aria-pressed, 배경)', () => {
    renderList({ activeCharId: 1 });
    const on = document.getElementById('member-card-1');
    const off = document.getElementById('member-card-4');
    expect(on.getAttribute('aria-pressed')).toBe('true');
    expect(off.getAttribute('aria-pressed')).toBe('false');
    expect(on.style.backgroundColor).not.toBe(off.style.backgroundColor);
  });

  it('키보드(Enter)로도 선택할 수 있다', () => {
    const { props } = renderList();
    fireEvent.keyDown(document.getElementById('member-card-4'), { key: 'Enter' });
    expect(props.onSelect).toHaveBeenCalledWith(4);
  });

  it('정렬 속성이 있으면 카드에 그 값을 함께 보여 준다', () => {
    renderList({ sortKey: '서열' });
    expect(screen.getByText('서열 3')).toBeTruthy();
    expect(screen.getByText('서열 4')).toBeTruthy();
  });

  it('정렬 속성이 없으면 값을 보여 주지 않는다', () => {
    renderList();
    expect(screen.queryByText('서열 3')).toBeNull();
  });

  it('이미지 주소는 작품 제목과 캐릭터 이름으로 만든다', () => {
    renderList();
    const img = screen.getByAltText('존 왓슨');
    expect(img.getAttribute('src')).toBe(`/img/character/${encodeURIComponent('작품_존 왓슨.png')}`);
  });
});

describe('PageMemberList 기밀 표시', () => {
  const secretMembers = [{ id: 4, name: '존 왓슨', 기밀: 'Y' }, { id: 1, name: '셜록 홈즈' }];
  const classified = (concealed) => ({
    has: true, mask: concealed, setMask: vi.fn(), reveal: vi.fn(),
    isClassified: (c) => c.기밀 === 'Y', isConcealed: (c) => concealed && c.기밀 === 'Y',
  });

  it('기밀 캐릭터 카드에 도장이 붙는다', () => {
    renderList({ members: secretMembers, classified: classified(false) });
    expect(document.querySelectorAll('.gt-classified-stamp')).toHaveLength(1);
  });

  it('가려진 카드는 사진이 흐려지지만 나머지는 그대로다', () => {
    renderList({ members: secretMembers, classified: classified(true) });
    const blurred = document.querySelectorAll('[data-concealed]');
    expect(blurred).toHaveLength(1);
    expect(blurred[0].getAttribute('alt')).toBe('존 왓슨');
  });
});

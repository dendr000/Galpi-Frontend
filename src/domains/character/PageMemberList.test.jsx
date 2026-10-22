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
  const props = { members, workId: '91', work: { title: '작품' }, charExt: 'png', navigate: vi.fn(), styles: {}, sortKey: '', ...over };
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

  it('카드를 누르면 작품 페이지에서 그 캐릭터가 선택되도록 charId 주소로 이동한다', () => {
    const { props } = renderList();
    fireEvent.click(screen.getByText('셜록 홈즈').closest('[id^="member-card-"]'));
    expect(props.navigate).toHaveBeenCalledWith('/work/91?charId=1');
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

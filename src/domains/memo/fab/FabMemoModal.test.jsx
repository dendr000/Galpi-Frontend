// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../api/axiosCore', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: [] })), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../store/useModalStore', () => ({ useModalStore: () => ({ closeModal: vi.fn() }) }));

// 사이드바: 폴더를 고르고 새 메모를 만드는 버튼만 흉내 낸다.
vi.mock('./components/FabMemoSidebar', () => ({
  default: ({ setCurrentFolder, handleCreateMemo }) => (
    <div>
      <button onClick={() => setCurrentFolder('유저노트')}>유저노트 폴더</button>
      <button onClick={() => setCurrentFolder('기타')}>기타 폴더</button>
      <button onClick={handleCreateMemo}>새 메모</button>
    </div>
  ),
}));
// 에디터: 지금 열린 메모의 본문을 그대로 보여 준다.
vi.mock('./FabMemoEditor', () => ({
  default: ({ activeMemo }) => <div data-testid="body" dangerouslySetInnerHTML={{ __html: activeMemo?.content || '' }} />,
}));

import FabMemoModal from './FabMemoModal';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const titlesOf = (el) => [...el.querySelectorAll('.fold-title')].map((t) => t.textContent);

describe('FabMemoModal - 새 메모 만들기', () => {
  it('유저노트 폴더에서 새 메모를 만들면 접기 박스 두 개와 빈 줄이 채워진다', () => {
    const { getByText, getByTestId } = render(<FabMemoModal />);
    fireEvent.click(getByText('유저노트 폴더'));
    fireEvent.click(getByText('새 메모'));
    const body = getByTestId('body');
    expect(titlesOf(body)).toEqual(['대화 프로필', '유저노트']);
    expect(body.lastElementChild.outerHTML).toBe('<div><br></div>');
  });

  it('다른 폴더에서 새 메모를 만들면 본문이 비어 있다', () => {
    const { getByText, getByTestId } = render(<FabMemoModal />);
    fireEvent.click(getByText('기타 폴더'));
    fireEvent.click(getByText('새 메모'));
    expect(getByTestId('body').innerHTML).toBe('');
  });
});

// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지에서 하위 문서를 지우는 버튼: 확인하면 삭제 API 를 부르고 작품 첫 화면으로 돌아간다.
// (버그: api 를 불러오지 않아 누르면 항상 "삭제 실패" 가 떴다.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({ data: null }));
const apiMock = vi.hoisted(() => ({ delete: vi.fn(), get: vi.fn(), put: vi.fn(), post: vi.fn() }));
const stub = vi.hoisted(() => (name) => () => <div data-stub={name} />);

vi.mock('../../api/axiosCore', () => ({ default: apiMock }));
vi.mock('../../domains/work/useWorkDetailData', () => ({ useWorkDetailData: () => state.data }));
vi.mock('../../domains/work/useWorkBacklink', () => ({ useWorkBacklink: () => () => {} }));
vi.mock('../../domains/character/useCharacterDrag', () => ({
  useCharacterDrag: () => ({ handleCharDragStart: () => {}, handleCharDragOver: () => {}, handleCharDragEnd: () => {} }),
}));
vi.mock('../../components/common/GenreCursor', () => ({ default: stub('GenreCursor') }));
vi.mock('../../domains/work/FloatingLeftTree', () => ({ default: stub('FloatingLeftTree') }));
vi.mock('../../domains/work/FloatingToc', () => ({ default: stub('FloatingToc') }));
vi.mock('../../domains/work/WorkCover', () => ({ default: stub('WorkCover') }));
vi.mock('../../domains/work/WorkCategoryBar', () => ({ default: stub('WorkCategoryBar') }));
vi.mock('../../domains/work/SubPageList', () => ({ default: stub('SubPageList') }));
vi.mock('../../domains/character/CharacterQuickNav', () => ({ default: stub('CharacterQuickNav') }));
vi.mock('../../domains/character/BatchImageModal', () => ({ default: stub('BatchImageModal') }));
vi.mock('../../domains/character/CharacterDetailSection', () => ({ default: stub('CharacterDetailSection') }));
vi.mock('../../domains/character/CharacterGrid', () => ({ default: stub('CharacterGrid') }));
vi.mock('../../domains/character/CharacterInfobox', () => ({ default: stub('CharacterInfobox') }));
vi.mock('../../domains/character/PageMemberList', () => ({ default: stub('PageMemberList') }));
vi.mock('../../domains/work/export/ExportDialog', () => ({ default: stub('ExportDialog') }));
vi.mock('../../domains/macro/MarkdownRenderer', () => ({ default: () => <div data-stub="MarkdownRenderer" /> }));

import WorkDetailPage from './WorkDetailPage';

const baseData = () => ({
  loading: false, workId: '91', pageId: '5', charIdParam: null, navigate: vi.fn(),
  work: { id: 91, title: '시험 작품', genre: '', description: '개요' },
  wikiPages: [{ id: 5, title: '시험 하위 문서', content: '본문' }],
  characters: [], activeCharId: null, setActiveCharId: vi.fn(), setCharacters: vi.fn(), setWork: vi.fn(),
  formSwaps: {}, setFormSwaps: vi.fn(), cardVariants: {}, setCardVariants: vi.fn(),
  groupCriteria: '관계', setGroupCriteria: vi.fn(), charSectionNum: 3, tocList: [],
  coverY: 50, setCoverY: vi.fn(), isCoverEdit: false, setIsCoverEdit: vi.fn(), isCoverDragging: false, setIsCoverDragging: vi.fn(),
  isBatchImgModalOpen: false, setIsBatchImgModalOpen: vi.fn(),
  batchImgY: 50, setBatchImgY: vi.fn(), batchImgX: 50, setBatchImgX: vi.fn(),
});

let confirmSpy;
let alertSpy;

beforeEach(() => {
  localStorage.clear();
  state.data = baseData();
  apiMock.delete.mockReset();
  confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  confirmSpy.mockRestore();
  alertSpy.mockRestore();
});

describe('하위 문서 삭제 버튼', () => {
  it('확인하면 삭제 API 를 부르고 작품 첫 화면으로 돌아간다', async () => {
    apiMock.delete.mockResolvedValue({});
    render(<WorkDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(apiMock.delete).toHaveBeenCalledTimes(1));
    expect(apiMock.delete).toHaveBeenCalledWith('/api/wikipages/5');
    await waitFor(() => expect(state.data.navigate).toHaveBeenCalledWith('/work/91'));
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('확인 창에서 취소하면 아무것도 지우지 않는다', async () => {
    confirmSpy.mockReturnValue(false);
    render(<WorkDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    await Promise.resolve();
    expect(apiMock.delete).not.toHaveBeenCalled();
    expect(state.data.navigate).not.toHaveBeenCalled();
  });

  it('서버 삭제가 실패하면 "삭제 실패" 를 알리고 화면을 옮기지 않는다', async () => {
    apiMock.delete.mockRejectedValue(new Error('500'));
    render(<WorkDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('삭제 실패'));
    expect(state.data.navigate).not.toHaveBeenCalled();
  });
});

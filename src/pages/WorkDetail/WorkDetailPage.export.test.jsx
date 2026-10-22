// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지의 공개용 HTML 내보내기 버튼과 옵션 창 연결을 확인한다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({ data: null, grid: null, infobox: null, runExport: null, exportArgs: null }));
const stub = vi.hoisted(() => (name) => () => <div data-stub={name} />);

vi.mock('../../domains/work/useWorkDetailData', () => ({ useWorkDetailData: () => state.data }));
vi.mock('../../domains/work/useWorkBacklink', () => ({ useWorkBacklink: () => () => {} }));
vi.mock('../../domains/work/export/useWorkExport', () => ({ useWorkExport: (ctx) => { state.exportArgs = ctx; return state.runExport; } }));
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
vi.mock('../../domains/character/CharacterGrid', () => ({ default: (props) => { state.grid = props; return <div data-stub="CharacterGrid" />; } }));
vi.mock('../../domains/character/CharacterInfobox', () => ({ default: (props) => { state.infobox = props; return <div data-stub="CharacterInfobox" />; } }));

import WorkDetailPage from './WorkDetailPage';

const baseData = (over = {}) => ({
  loading: false, workId: '91', pageId: null, charIdParam: null, navigate: vi.fn(),
  work: { id: 91, title: '시험 작품', genre: '', description: '개요' },
  wikiPages: [{ id: 5, title: '문서', content: '본문' }],
  characters: [{ id: 1, name: '릴리', 관계: '일반', 기밀: 'Y' }, { id: 2, name: '레온', 관계: '일반' }],
  activeCharId: null, setActiveCharId: vi.fn(), setCharacters: vi.fn(), setWork: vi.fn(),
  formSwaps: { 1: 1 }, setFormSwaps: vi.fn(), cardVariants: {}, setCardVariants: vi.fn(),
  groupCriteria: '관계', setGroupCriteria: vi.fn(), charSectionNum: 3, tocList: [],
  coverY: 50, setCoverY: vi.fn(), isCoverEdit: false, setIsCoverEdit: vi.fn(), isCoverDragging: false, setIsCoverDragging: vi.fn(),
  isBatchImgModalOpen: false, setIsBatchImgModalOpen: vi.fn(), batchImgY: 50, setBatchImgY: vi.fn(), batchImgX: 50, setBatchImgX: vi.fn(),
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  state.grid = null; state.infobox = null; state.exportArgs = null;
  state.runExport = vi.fn(async () => {});
});
afterEach(cleanup);

const exportButton = () => screen.queryByRole('button', { name: '공개용 HTML 내보내기' });

describe('WorkDetailPage 공개용 내보내기', () => {
  it('작품 첫 화면에 내보내기 버튼이 있고, 처음에는 옵션 창이 닫혀 있다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(exportButton()).not.toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('하위 문서를 보는 화면에는 버튼이 없다', () => {
    state.data = baseData({ pageId: '5' });
    render(<WorkDetailPage />);
    expect(exportButton()).toBeNull();
  });

  it('버튼을 누르면 옵션 창이 열리고, 기밀 캐릭터가 있으면 기밀 처리 선택이 보인다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    fireEvent.click(exportButton());
    expect(screen.getByRole('dialog', { name: '공개용 HTML 내보내기' })).toBeTruthy();
    expect(screen.getByLabelText('제외')).toBeTruthy();
  });

  it('기밀 캐릭터가 없으면 기밀 처리 선택이 없다', () => {
    state.data = baseData({ characters: [{ id: 2, name: '레온', 관계: '일반' }] });
    render(<WorkDetailPage />);
    fireEvent.click(exportButton());
    expect(screen.queryByLabelText('제외')).toBeNull();
  });

  it('창에서 내보내기를 누르면 화면의 상태와 고른 옵션으로 내보내기를 실행하고 창을 닫는다', async () => {
    localStorage.setItem('galpi-char-sort-91', JSON.stringify({ key: '서열', dir: 'desc' }));
    state.data = baseData();
    render(<WorkDetailPage />);
    fireEvent.click(exportButton());
    fireEvent.click(screen.getByLabelText('제외'));
    fireEvent.click(screen.getByRole('button', { name: '내보내기' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(state.runExport).toHaveBeenCalledWith({ classified: 'exclude', images: true, pages: true });
    expect(state.exportArgs).toMatchObject({
      work: state.data.work, characters: state.data.characters, wikiPages: state.data.wikiPages,
      formSwaps: state.data.formSwaps, groupCriteria: '관계', sortKey: '서열', sortDir: 'desc',
    });
  });

  it('취소하면 내보내기를 실행하지 않고 창만 닫는다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    fireEvent.click(exportButton());
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(state.runExport).not.toHaveBeenCalled();
  });
});

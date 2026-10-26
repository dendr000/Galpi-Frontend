// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지의 새 문서 만들기 흐름(같은 위치에 만들기 버튼, 문서 트리 연결)을 확인한다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

const state = vi.hoisted(() => ({ data: null, tree: null }));
const stub = vi.hoisted(() => (name) => () => <div data-stub={name} />);

vi.mock('../../domains/work/useWorkDetailData', () => ({ useWorkDetailData: () => state.data }));
vi.mock('../../domains/work/useWorkBacklink', () => ({ useWorkBacklink: () => () => {} }));
vi.mock('../../domains/character/useCharacterDrag', () => ({
  useCharacterDrag: () => ({ handleCharDragStart: () => {}, handleCharDragOver: () => {}, handleCharDragEnd: () => {} }),
}));
vi.mock('../../components/common/GenreCursor', () => ({ default: stub('GenreCursor') }));
vi.mock('../../domains/work/FloatingLeftTree', () => ({ default: (props) => { state.tree = props; return <div data-stub="FloatingLeftTree" />; } }));
vi.mock('../../domains/work/FloatingToc', () => ({ default: stub('FloatingToc') }));
vi.mock('../../domains/work/WorkCover', () => ({ default: stub('WorkCover') }));
vi.mock('../../domains/work/WorkCategoryBar', () => ({ default: stub('WorkCategoryBar') }));
vi.mock('../../domains/character/CharacterQuickNav', () => ({ default: stub('CharacterQuickNav') }));
vi.mock('../../domains/character/BatchImageModal', () => ({ default: stub('BatchImageModal') }));
vi.mock('../../domains/character/CharacterDetailSection', () => ({ default: stub('CharacterDetailSection') }));
vi.mock('../../domains/character/CharacterGrid', () => ({ default: (props) => { state.grid = props; return <div data-stub="CharacterGrid" />; } }));
vi.mock('../../domains/character/CharacterInfobox', () => ({ default: (props) => { state.infobox = props; return <div data-stub="CharacterInfobox" />; } }));

import WorkDetailPage from './WorkDetailPage';

const baseData = (over = {}) => ({
  loading: false, workId: '91', pageId: null, charIdParam: null, navigate: vi.fn(),
  work: { id: 91, title: '시험 작품', genre: '', description: '개요' },
  wikiPages: [
    { id: 1, title: '조직', parentId: null, content: '조직 소개' },
    { id: 2, title: '북부', parentId: 1, content: '북부 소개' },
  ],
  characters: [], activeCharId: null, setActiveCharId: vi.fn(), setCharacters: vi.fn(), setWork: vi.fn(),
  formSwaps: {}, setFormSwaps: vi.fn(), cardVariants: {}, setCardVariants: vi.fn(),
  groupCriteria: '관계', setGroupCriteria: vi.fn(), charSectionNum: 3, tocList: [],
  coverY: 50, setCoverY: vi.fn(), isCoverEdit: false, setIsCoverEdit: vi.fn(), isCoverDragging: false, setIsCoverDragging: vi.fn(),
  isBatchImgModalOpen: false, setIsBatchImgModalOpen: vi.fn(), batchImgY: 50, setBatchImgY: vi.fn(), batchImgX: 50, setBatchImgX: vi.fn(),
  ...over,
});

beforeEach(() => { localStorage.clear(); state.tree = null; });
afterEach(cleanup);

const siblingButton = () => screen.queryByRole('button', { name: '같은 위치에 새 문서' });

describe('WorkDetailPage 같은 위치에 새 문서', () => {
  it('하위 문서를 보는 화면에 "같은 위치에 새 문서" 버튼이 있다', () => {
    state.data = baseData({ pageId: '2' });
    render(<WorkDetailPage />);
    expect(siblingButton()).not.toBeNull();
  });

  it('작품 첫 화면에는 이 버튼이 없다(기존 "새 문서 추가"가 최상위 문서를 만든다)', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(siblingButton()).toBeNull();
  });

  it('중첩된 문서에서 누르면 같은 상위 문서 아래에 만드는 편집 화면으로 간다', () => {
    state.data = baseData({ pageId: '2' });
    render(<WorkDetailPage />);
    fireEvent.click(siblingButton());
    expect(state.data.navigate).toHaveBeenCalledWith('/edit?type=page&action=new&workId=91&parentId=1');
  });

  it('최상위 문서에서 누르면 최상위에 만드는 편집 화면으로 간다', () => {
    state.data = baseData({ pageId: '1' });
    render(<WorkDetailPage />);
    fireEvent.click(siblingButton());
    expect(state.data.navigate).toHaveBeenCalledWith('/edit?type=page&action=new&workId=91');
  });

  it('기존 "새 문서 추가"는 지금 문서의 하위 문서를 만든다(동작 그대로)', () => {
    state.data = baseData({ pageId: '1' });
    render(<WorkDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: /새 문서 추가/ }));
    expect(state.data.navigate).toHaveBeenCalledWith('/edit?type=page&action=new&workId=91&parentId=1');
  });
});

describe('WorkDetailPage 문서 트리 연결', () => {
  it('문서 트리에 작품 제목을 넘겨 맨 위에 작품 첫 화면 행을 그릴 수 있게 한다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(state.tree.workTitle).toBe('시험 작품');
    expect(state.tree.workId).toBe('91');
    expect(state.tree.wikiPages).toEqual(state.data.wikiPages);
  });
});

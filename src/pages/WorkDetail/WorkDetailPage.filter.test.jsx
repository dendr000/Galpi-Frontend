// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지가 칩 필터(소속, 등급)를 그리드에 이어 주고 인물 목록을 걸러 주는지 확인한다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

const state = vi.hoisted(() => ({ data: null, grid: null, infobox: null }));
const stub = vi.hoisted(() => (name) => () => <div data-stub={name} />);

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
vi.mock('../../domains/character/CharacterGrid', () => ({ default: (props) => { state.grid = props; return <div data-stub="CharacterGrid" />; } }));
vi.mock('../../domains/character/CharacterInfobox', () => ({ default: (props) => { state.infobox = props; return <div data-stub="CharacterInfobox" />; } }));

import WorkDetailPage from './WorkDetailPage';

const baseData = (over = {}) => ({
  loading: false, workId: '91', pageId: null, charIdParam: null, navigate: vi.fn(),
  work: { id: 91, title: '시험 작품', genre: '', description: '개요' },
  wikiPages: [],
  characters: [
    { id: 1, name: '릴리', 소속: '북부, 사교', 등급: 'S급', 관계: '일반' },
    { id: 2, name: '레온', 소속: '북부', 등급: 'A급', 관계: '일반' },
    { id: 3, name: '루시', 소속: '남부', 등급: 'S급', 관계: '일반' },
    { id: 4, name: '숨은', 소속: '북부', 등급: 'S급', 관계: '일반', _isHidden: true, dynamicProperties: JSON.stringify({ _isHidden: true }) },
  ],
  activeCharId: null, setActiveCharId: vi.fn(), setCharacters: vi.fn(), setWork: vi.fn(),
  formSwaps: {}, setFormSwaps: vi.fn(), cardVariants: {}, setCardVariants: vi.fn(),
  groupCriteria: '관계', setGroupCriteria: vi.fn(), charSectionNum: 3, tocList: [],
  coverY: 50, setCoverY: vi.fn(), isCoverEdit: false, setIsCoverEdit: vi.fn(), isCoverDragging: false, setIsCoverDragging: vi.fn(),
  isBatchImgModalOpen: false, setIsBatchImgModalOpen: vi.fn(), batchImgY: 50, setBatchImgY: vi.fn(), batchImgX: 50, setBatchImgX: vi.fn(),
  ...over,
});

beforeEach(() => { localStorage.clear(); state.grid = null; state.infobox = null; });
afterEach(cleanup);

const shownIds = () => state.grid.groupedChars['일반']?.map((c) => c.id) ?? [];

describe('WorkDetailPage 칩 필터', () => {
  it('필터 그룹(소속, 등급)을 보이는 캐릭터 기준으로 그리드에 넘긴다(숨김 캐릭터 제외)', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(state.grid.filterGroups).toEqual([
      { key: '소속', options: [{ value: '북부', count: 2 }, { value: '사교', count: 1 }, { value: '남부', count: 1 }] },
      { key: '등급', options: [{ value: 'S급', count: 2 }, { value: 'A급', count: 1 }] },
    ]);
    expect(state.grid.filterTotal).toBe(3);
    expect(state.grid.filterShown).toBe(3);
  });

  it('칩을 켜면 그 소속의 인물만 그리드에 넘기고, 다시 누르면 원래대로', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    act(() => state.grid.onFilterToggle('소속', '북부'));
    expect(shownIds()).toEqual([1, 2]);
    expect(state.grid.filterShown).toBe(2);
    act(() => state.grid.onFilterToggle('소속', '북부'));
    expect(shownIds()).toEqual([1, 2, 3]);
  });

  it('다른 그룹 칩을 함께 켜면 둘 다 맞는 인물만 남는다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    act(() => state.grid.onFilterToggle('소속', '북부'));
    act(() => state.grid.onFilterToggle('등급', 'S급'));
    expect(shownIds()).toEqual([1]);
  });

  it('필터 해제는 선택을 모두 지운다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    act(() => state.grid.onFilterToggle('소속', '북부'));
    act(() => state.grid.onFilterToggle('등급', 'A급'));
    act(() => state.grid.onFilterClear());
    expect(shownIds()).toEqual([1, 2, 3]);
    expect(state.grid.filterSelection).toEqual({});
  });

  it('맞는 인물이 없으면 그리드에 빈 그룹 목록을 넘긴다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    act(() => state.grid.onFilterToggle('소속', '남부'));
    act(() => state.grid.onFilterToggle('등급', 'A급'));
    expect(state.grid.sortedGroupNames).toEqual([]);
    expect(state.grid.filterShown).toBe(0);
  });
});

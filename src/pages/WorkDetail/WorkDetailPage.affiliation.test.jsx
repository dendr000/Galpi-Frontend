// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지가 속성 정렬과 소속 문서 연결을 각 부품에 제대로 이어 주는지 확인한다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';

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

const chars = () => [
  { id: 1, name: '릴리', 소속: '북부', 서열: '3', 관계: '일반', _propOrder: ['소속', '서열'] },
  { id: 2, name: '레온', 소속: '북부, 사교', 서열: '1', 관계: '일반', _propOrder: ['소속', '서열'] },
  { id: 3, name: '루시', 소속: '남부', 서열: '2', 관계: '일반', _propOrder: ['소속', '서열'] },
];

const baseData = (over = {}) => ({
  loading: false,
  workId: '91',
  pageId: null,
  charIdParam: null,
  navigate: vi.fn(),
  work: { id: 91, title: '시험 작품', genre: '', description: '개요' },
  wikiPages: [{ id: 7, title: '북부', content: '북부 소개' }],
  characters: chars(),
  activeCharId: null,
  setActiveCharId: vi.fn(),
  setCharacters: vi.fn(),
  setWork: vi.fn(),
  formSwaps: {},
  setFormSwaps: vi.fn(),
  cardVariants: {},
  setCardVariants: vi.fn(),
  groupCriteria: '관계',
  setGroupCriteria: vi.fn(),
  charSectionNum: 3,
  tocList: [],
  coverY: 50, setCoverY: vi.fn(), isCoverEdit: false, setIsCoverEdit: vi.fn(), isCoverDragging: false, setIsCoverDragging: vi.fn(),
  isBatchImgModalOpen: false, setIsBatchImgModalOpen: vi.fn(),
  batchImgY: 50, setBatchImgY: vi.fn(), batchImgX: 50, setBatchImgX: vi.fn(),
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  state.grid = null;
  state.infobox = null;
});
afterEach(cleanup);

describe('WorkDetailPage 속성 정렬', () => {
  it('정렬을 고르지 않았으면 원래(수동) 순서 그대로 그리드에 넘긴다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(state.grid.groupedChars['일반'].map((c) => c.id)).toEqual([1, 2, 3]);
    expect(state.grid.sortKey).toBe('');
  });

  it('저장된 정렬(서열 오름차순)이 있으면 그룹 안 순서를 그 값으로 바꿔 그리드에 넘긴다', () => {
    localStorage.setItem('galpi-char-sort-91', JSON.stringify({ key: '서열', dir: 'asc' }));
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(state.grid.groupedChars['일반'].map((c) => c.id)).toEqual([2, 3, 1]);
    expect(state.grid.sortKey).toBe('서열');
    expect(state.grid.sortDir).toBe('asc');
  });

  it('내림차순도 반영한다', () => {
    localStorage.setItem('galpi-char-sort-91', JSON.stringify({ key: '서열', dir: 'desc' }));
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(state.grid.groupedChars['일반'].map((c) => c.id)).toEqual([1, 3, 2]);
  });

  it('정렬로 고를 수 있는 속성 목록과 선택 함수를 그리드에 넘긴다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(state.grid.sortKeys).toEqual(['소속', '서열']);
    expect(typeof state.grid.setSort).toBe('function');
  });
});

describe('WorkDetailPage 소속 문서 연결', () => {
  it('그리드와 정보 상자에 하위 문서 목록을 넘긴다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(state.grid.wikiPages).toEqual(state.data.wikiPages);
    expect(state.infobox.wikiPages).toEqual(state.data.wikiPages);
  });

  it('정보 상자의 문서 열기는 그 하위 문서 주소로 이동한다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    state.infobox.onOpenPage(7);
    expect(state.data.navigate).toHaveBeenCalledWith('/work/91?pageId=7');
  });

  it('하위 문서를 보는 화면에는 그 제목과 같은 소속의 인물이 카드로 나온다', () => {
    state.data = baseData({ pageId: '7' });
    const { container } = render(<WorkDetailPage />);
    const names = Array.from(container.querySelectorAll('[id^="member-card-"] h4')).map((h) => h.textContent);
    expect(names).toEqual(['릴리', '레온']);
  });

  it('인물 목록도 선택한 정렬을 따른다', () => {
    localStorage.setItem('galpi-char-sort-91', JSON.stringify({ key: '서열', dir: 'asc' }));
    state.data = baseData({ pageId: '7' });
    const { container } = render(<WorkDetailPage />);
    const names = Array.from(container.querySelectorAll('[id^="member-card-"] h4')).map((h) => h.textContent);
    expect(names).toEqual(['레온', '릴리']);
  });

  it('인물 카드를 누르면 페이지를 옮기지 않고 그 캐릭터를 선택한다', () => {
    state.data = baseData({ pageId: '7' });
    const { container } = render(<WorkDetailPage />);
    fireEvent.click(container.querySelector('#member-card-2'));
    expect(state.data.setActiveCharId).toHaveBeenCalledWith(2);
    expect(state.data.navigate).not.toHaveBeenCalled();
  });

  it('하위 문서 화면에서도 선택된 캐릭터를 정보 상자에 보여 준다', () => {
    state.data = baseData({ pageId: '7', activeCharId: 2 });
    render(<WorkDetailPage />);
    expect(state.infobox.char).toMatchObject({ id: 2, name: '레온' });
  });

  it('선택된 인물 카드는 표시되고, 다시 누르면 선택이 풀린다', () => {
    state.data = baseData({ pageId: '7', activeCharId: 2 });
    const { container } = render(<WorkDetailPage />);
    expect(container.querySelector('#member-card-2').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('#member-card-1').getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(container.querySelector('#member-card-2'));
    expect(state.data.setActiveCharId).toHaveBeenCalledWith(null);
  });

  it('작품 첫 화면(하위 문서를 보지 않을 때)에는 소속 인물 목록을 그리지 않는다', () => {
    state.data = baseData();
    const { container } = render(<WorkDetailPage />);
    expect(container.querySelector('[id^="member-card-"]')).toBeNull();
  });

  it('주소에 charId 가 있으면 그 캐릭터를 선택한다', () => {
    state.data = baseData({ charIdParam: '3' });
    render(<WorkDetailPage />);
    expect(state.data.setActiveCharId).toHaveBeenCalledWith(3);
  });
});

describe('WorkDetailPage 여러 값일 때 그룹 표시', () => {
  const names = () => Object.entries(state.grid.groupedChars).map(([k, v]) => `${k}:${v.map((c) => c.id).join('+')}`).sort();
  const withMode = (mode) => baseData({
    groupCriteria: '소속',
    work: { id: 91, title: '시험 작품', genre: '', description: `[META_DATA:${JSON.stringify(mode ? { multiGroup: mode } : {})}]\n개요` },
  });

  it('작품 설정이 없으면 모든 소속 그룹에 넣는다', () => {
    state.data = withMode(undefined);
    render(<WorkDetailPage />);
    expect(names()).toEqual(['남부:3', '북부:1+2', '사교:2']);
  });

  it('first 면 첫 번째 소속 그룹에만 넣는다', () => {
    state.data = withMode('first');
    render(<WorkDetailPage />);
    expect(names()).toEqual(['남부:3', '북부:1+2']);
  });

  it('last 면 마지막 소속 그룹에만 넣는다', () => {
    state.data = withMode('last');
    render(<WorkDetailPage />);
    expect(names()).toEqual(['남부:3', '북부:1', '사교:2']);
  });
});

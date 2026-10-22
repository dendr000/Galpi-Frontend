// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지가 작품 메타의 등급 설정을 그리드, 정보 상자, 기준표에 이어 주는지 확인한다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

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

const meta = (obj) => `[META_DATA:${JSON.stringify(obj)}]\n설정 본문`;

const baseData = (over = {}) => ({
  loading: false, workId: '91', pageId: null, charIdParam: null, navigate: vi.fn(),
  work: { id: 91, title: '시험 작품', genre: '', description: meta({}) },
  wikiPages: [], characters: [{ id: 1, name: '릴리', 위험도: '3', 관계: '일반' }],
  activeCharId: 1, setActiveCharId: vi.fn(), setCharacters: vi.fn(), setWork: vi.fn(),
  formSwaps: {}, setFormSwaps: vi.fn(), cardVariants: {}, setCardVariants: vi.fn(),
  groupCriteria: '관계', setGroupCriteria: vi.fn(), charSectionNum: 3, tocList: [],
  coverY: 50, setCoverY: vi.fn(), isCoverEdit: false, setIsCoverEdit: vi.fn(), isCoverDragging: false, setIsCoverDragging: vi.fn(),
  isBatchImgModalOpen: false, setIsBatchImgModalOpen: vi.fn(), batchImgY: 50, setBatchImgY: vi.fn(), batchImgX: 50, setBatchImgX: vi.fn(),
  ...over,
});

const withRatings = () => baseData({
  work: { id: 91, title: '시험 작품', genre: '', description: meta({ ratingAxes: '위험도:R', ratingScale: '3:중대:도시 단위' }) },
});

beforeEach(() => { localStorage.clear(); state.grid = null; state.infobox = null; });
afterEach(cleanup);

describe('WorkDetailPage 등급 배지', () => {
  it('작품 메타의 등급 설정을 읽어 그리드와 정보 상자에 넘긴다', () => {
    state.data = withRatings();
    render(<WorkDetailPage />);
    expect(state.grid.ratingAxes).toEqual([{ key: '위험도', abbr: 'R' }]);
    expect(state.grid.ratingScale).toEqual([{ level: 3, name: '중대', desc: '도시 단위' }]);
    expect(state.infobox.ratingAxes).toEqual(state.grid.ratingAxes);
    expect(state.infobox.ratingScale).toEqual(state.grid.ratingScale);
  });

  it('작품 첫 화면에 등급 기준표를 그린다', () => {
    state.data = withRatings();
    const { container } = render(<WorkDetailPage />);
    expect(container.querySelector('#sec-ratings')).not.toBeNull();
    expect(container.textContent).toContain('도시 단위');
  });

  it('등급 설정이 없으면 기준표를 그리지 않고 빈 설정을 넘긴다', () => {
    state.data = baseData();
    const { container } = render(<WorkDetailPage />);
    expect(container.querySelector('#sec-ratings')).toBeNull();
    expect(state.grid.ratingAxes).toEqual([]);
  });

  it('하위 문서를 보는 화면에는 기준표를 그리지 않는다', () => {
    state.data = { ...withRatings(), pageId: '5', wikiPages: [{ id: 5, title: '문서', content: '본문' }] };
    const { container } = render(<WorkDetailPage />);
    expect(container.querySelector('#sec-ratings')).toBeNull();
  });
});

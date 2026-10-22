// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지가 기밀 표시와 가리기 상태를 그리드, 정보 상자, 소속 인물 목록에 이어 주는지 확인한다.
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
  wikiPages: [{ id: 7, title: '북부', content: '북부 소개' }],
  characters: [
    { id: 1, name: '릴리', 소속: '북부', 기밀: 'Y', 관계: '일반' },
    { id: 2, name: '레온', 소속: '북부', 관계: '일반' },
  ],
  activeCharId: 1, setActiveCharId: vi.fn(), setCharacters: vi.fn(), setWork: vi.fn(),
  formSwaps: {}, setFormSwaps: vi.fn(), cardVariants: {}, setCardVariants: vi.fn(),
  groupCriteria: '관계', setGroupCriteria: vi.fn(), charSectionNum: 3, tocList: [],
  coverY: 50, setCoverY: vi.fn(), isCoverEdit: false, setIsCoverEdit: vi.fn(), isCoverDragging: false, setIsCoverDragging: vi.fn(),
  isBatchImgModalOpen: false, setIsBatchImgModalOpen: vi.fn(), batchImgY: 50, setBatchImgY: vi.fn(), batchImgX: 50, setBatchImgX: vi.fn(),
  ...over,
});

beforeEach(() => { localStorage.clear(); state.grid = null; state.infobox = null; });
afterEach(cleanup);

describe('WorkDetailPage 기밀 표시', () => {
  it('그리드와 정보 상자에 같은 기밀 상태를 넘긴다(기밀 캐릭터가 있으면 has)', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(state.grid.classified.has).toBe(true);
    expect(state.infobox.classified.has).toBe(true);
    expect(state.grid.classified.isClassified(state.data.characters[0])).toBe(true);
    expect(state.grid.classified.isClassified(state.data.characters[1])).toBe(false);
  });

  it('기밀 캐릭터가 하나도 없으면 has 가 false', () => {
    state.data = baseData({ characters: [{ id: 2, name: '레온', 관계: '일반' }] });
    render(<WorkDetailPage />);
    expect(state.grid.classified.has).toBe(false);
  });

  it('가리기를 켜면 기밀 캐릭터만 가려지고, 열람하면 다시 보인다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    act(() => state.grid.classified.setMask(true));
    expect(state.grid.classified.isConcealed(state.data.characters[0])).toBe(true);
    expect(state.infobox.classified.isConcealed(state.data.characters[0])).toBe(true);
    expect(state.grid.classified.isConcealed(state.data.characters[1])).toBe(false);
    act(() => state.grid.classified.reveal(1));
    expect(state.grid.classified.isConcealed(state.data.characters[0])).toBe(false);
  });

  it('소속 인물 목록(하위 문서 화면)에도 도장과 가림이 적용된다', () => {
    localStorage.setItem('galpi-classified-mask-91', '1');
    state.data = baseData({ pageId: '7' });
    const { container } = render(<WorkDetailPage />);
    expect(container.querySelectorAll('#member-card-1 .gt-classified-stamp')).toHaveLength(1);
    expect(container.querySelector('#member-card-1 [data-concealed]')).not.toBeNull();
    expect(container.querySelector('#member-card-2 [data-concealed]')).toBeNull();
  });
});

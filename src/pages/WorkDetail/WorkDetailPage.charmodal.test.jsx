// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지가 그리드의 "큰 창으로 보기"를 큰 창과 이어 주는지 확인한다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act, screen, fireEvent } from '@testing-library/react';

const state = vi.hoisted(() => ({ data: null, grid: null, backlink: vi.fn() }));
const stub = vi.hoisted(() => (name) => () => <div data-stub={name} />);

vi.mock('../../domains/work/useWorkDetailData', () => ({ useWorkDetailData: () => state.data }));
vi.mock('../../domains/work/useWorkBacklink', () => ({ useWorkBacklink: () => state.backlink }));
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
vi.mock('../../domains/character/CharacterDetailSection', async (importOriginal) => ({ ...(await importOriginal()), default: stub('CharacterDetailSection') }));
vi.mock('../../domains/character/CharacterGrid', () => ({ default: (props) => { state.grid = props; return <div data-stub="CharacterGrid" />; } }));
vi.mock('../../domains/character/CharacterInfobox', () => ({ default: ({ char }) => <div data-stub="CharacterInfobox">{char?.name} 인포</div> }));

import WorkDetailPage from './WorkDetailPage';

const baseData = (over = {}) => ({
  loading: false, workId: '91', pageId: null, charIdParam: null, navigate: vi.fn(),
  work: { id: 91, title: '시험 작품', genre: '', description: '개요' },
  wikiPages: [],
  characters: [
    { id: 1, name: '릴리', 관계: '일반', 기밀: 'Y', pageBodyRaw: '릴리 본문' },
    { id: 2, name: '레온', 관계: '일반', pageBodyRaw: '그날 [[세라]]를 만났다.' },
    { id: 3, name: '세라', 관계: '일반', pageBodyRaw: '세라 본문' },
  ],
  activeCharId: 2, setActiveCharId: vi.fn(), setCharacters: vi.fn(), setWork: vi.fn(),
  formSwaps: {}, setFormSwaps: vi.fn(), cardVariants: {}, setCardVariants: vi.fn(),
  groupCriteria: '관계', setGroupCriteria: vi.fn(), charSectionNum: 3, tocList: [],
  coverY: 50, setCoverY: vi.fn(), isCoverEdit: false, setIsCoverEdit: vi.fn(), isCoverDragging: false, setIsCoverDragging: vi.fn(),
  isBatchImgModalOpen: false, setIsBatchImgModalOpen: vi.fn(), batchImgY: 50, setBatchImgY: vi.fn(), batchImgX: 50, setBatchImgX: vi.fn(),
  ...over,
});

beforeEach(() => { localStorage.clear(); state.grid = null; state.backlink = vi.fn(); });
afterEach(cleanup);

describe('WorkDetailPage 캐릭터 큰 창', () => {
  it('처음에는 큰 창이 없고, 그리드에 열기 함수를 넘긴다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    expect(typeof state.grid.onOpenModal).toBe('function');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('열기를 호출하면 그 캐릭터를 선택하고 큰 창에 본문과 인포박스를 보여 준다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    act(() => state.grid.onOpenModal(2));
    expect(state.data.setActiveCharId).toHaveBeenCalledWith(2);
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('그날');
    expect(dialog.textContent).toContain('레온 인포');
  });

  it('Esc 로 닫는다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    act(() => state.grid.onOpenModal(2));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('넘기는 목록에서 가려진 기밀 캐릭터는 빠진다(보이는 2명 중 1번째)', () => {
    localStorage.setItem('galpi-classified-mask-91', '1');
    state.data = baseData({ activeCharId: 2 });
    render(<WorkDetailPage />);
    act(() => state.grid.onOpenModal(2));
    expect(screen.getByText('1 / 2')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(state.data.setActiveCharId).toHaveBeenLastCalledWith(3);
  });

  it('큰 창의 본문 링크를 누르면 큰 창을 닫고 평소 링크 동작을 한다', () => {
    state.data = baseData();
    render(<WorkDetailPage />);
    act(() => state.grid.onOpenModal(2));
    fireEvent.click(screen.getByRole('dialog').querySelector('.wiki-backlink'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(state.backlink).toHaveBeenCalledWith('세라');
  });

  it('아래 주변 캐릭터 띠에 그리드와 같은 규칙의 이미지 주소가 들어가고, 가려진 기밀 캐릭터는 빠진다', () => {
    localStorage.setItem('galpi-classified-mask-91', '1');
    state.data = baseData({
      activeCharId: 2,
      work: { id: 91, title: '누구?', genre: '', description: '개요' },
      characters: [
        { id: 1, name: '릴리', 관계: '일반', 기밀: 'Y', pageBodyRaw: '릴리 본문' },
        { id: 2, name: '레온/2세', 관계: '일반', pageBodyRaw: '그날 [[세라]]를 만났다.' },
        { id: 3, name: '세라', 관계: '일반', pageBodyRaw: '세라 본문' },
      ],
    });
    render(<WorkDetailPage />);
    act(() => state.grid.onOpenModal(2));
    const strip = screen.getByRole('navigation', { name: '주변 캐릭터' });
    expect(strip.querySelectorAll('button')).toHaveLength(2);
    const srcs = Array.from(strip.querySelectorAll('img')).map((i) => i.getAttribute('src'));
    expect(srcs).toEqual([
      '/img/character/' + encodeURIComponent('누구？_레온／2세.png'),
      '/img/character/' + encodeURIComponent('누구？_세라.png'),
    ]);
  });

  it('검색 상자로 찾은 캐릭터를 고르면 그 캐릭터로 넘어간다', () => {
    state.data = baseData({ activeCharId: 2 });
    render(<WorkDetailPage />);
    act(() => state.grid.onOpenModal(2));
    fireEvent.change(screen.getByRole('combobox', { name: '캐릭터 검색' }), { target: { value: '세' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: '세라' }));
    expect(state.data.setActiveCharId).toHaveBeenLastCalledWith(3);
  });

  it('하위 문서 화면에서는 큰 창을 그리지 않는다', () => {
    state.data = baseData({ pageId: '7', wikiPages: [{ id: 7, title: '북부', content: '소개' }] });
    render(<WorkDetailPage />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

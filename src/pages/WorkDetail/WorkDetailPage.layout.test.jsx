// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지의 폭 규칙: 전체 폭이면 테마 영역이 창 전체를 채우고 안쪽 칼럼만 읽기 폭을 가진다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

const state = vi.hoisted(() => ({ data: null, left: null, toc: null }));
const stub = vi.hoisted(() => (name) => () => <div data-stub={name} />);

vi.mock('../../domains/work/useWorkDetailData', () => ({ useWorkDetailData: () => state.data }));
vi.mock('../../domains/work/useWorkBacklink', () => ({ useWorkBacklink: () => () => {} }));
vi.mock('../../domains/character/useCharacterDrag', () => ({
  useCharacterDrag: () => ({ handleCharDragStart: () => {}, handleCharDragOver: () => {}, handleCharDragEnd: () => {} }),
}));
vi.mock('../../components/common/GenreCursor', () => ({ default: stub('GenreCursor') }));
vi.mock('../../domains/work/FloatingLeftTree', () => ({ default: (p) => { state.left = p; return <div data-stub="FloatingLeftTree" />; } }));
vi.mock('../../domains/work/FloatingToc', () => ({ default: (p) => { state.toc = p; return <div data-stub="FloatingToc" />; } }));
vi.mock('../../domains/work/WorkCover', () => ({ default: stub('WorkCover') }));
vi.mock('../../domains/work/WorkCategoryBar', () => ({ default: stub('WorkCategoryBar') }));
vi.mock('../../domains/work/SubPageList', () => ({ default: stub('SubPageList') }));
vi.mock('../../domains/character/CharacterQuickNav', () => ({ default: stub('CharacterQuickNav') }));
vi.mock('../../domains/character/BatchImageModal', () => ({ default: stub('BatchImageModal') }));
vi.mock('../../domains/character/CharacterDetailSection', () => ({ default: stub('CharacterDetailSection') }));
vi.mock('../../domains/character/CharacterGrid', () => ({ default: stub('CharacterGrid') }));
vi.mock('../../domains/character/CharacterInfobox', () => ({ default: stub('CharacterInfobox') }));

import WorkDetailPage from './WorkDetailPage';
import useSettingStore from '../../store/useSettingStore';

const baseData = () => ({
  loading: false, workId: '91', pageId: null, charIdParam: null, navigate: vi.fn(),
  work: { id: 91, title: '시험 작품', genre: '', description: '개요' },
  wikiPages: [], characters: [], activeCharId: null, setActiveCharId: vi.fn(), setCharacters: vi.fn(), setWork: vi.fn(),
  formSwaps: {}, setFormSwaps: vi.fn(), cardVariants: {}, setCardVariants: vi.fn(),
  groupCriteria: '관계', setGroupCriteria: vi.fn(), charSectionNum: 3, tocList: [],
  coverY: 50, setCoverY: vi.fn(), isCoverEdit: false, setIsCoverEdit: vi.fn(), isCoverDragging: false, setIsCoverDragging: vi.fn(),
  isBatchImgModalOpen: false, setIsBatchImgModalOpen: vi.fn(),
  batchImgY: 50, setBatchImgY: vi.fn(), batchImgX: 50, setBatchImgX: vi.fn(),
});

const originalWidth = window.innerWidth;
const setWindowWidth = (w) => { window.innerWidth = w; window.dispatchEvent(new Event('resize')); };

beforeEach(() => {
  localStorage.clear();
  state.data = baseData();
  state.left = null;
  state.toc = null;
});
afterEach(() => {
  cleanup();
  window.innerWidth = originalWidth;
  useSettingStore.setState({ layoutWidth: 'full', panelLeftOpen: true, panelRightOpen: true });
});

describe('WorkDetailPage 폭 규칙', () => {
  it('기본(전체 폭)이면 테마 영역이 창 전체를 채우고 안쪽에 읽기 폭 칼럼이 있다', () => {
    useSettingStore.setState({ layoutWidth: 'full' });
    const { container } = render(<WorkDetailPage />);
    const zone = container.querySelector('#galpi-genre-zone');
    expect(zone.classList.contains('galpi-work-full')).toBe(true);
    expect(zone.classList.contains('fixed-container')).toBe(false);
    const inner = zone.firstElementChild;
    expect(inner.classList.contains('galpi-work-inner')).toBe(true);
    expect(inner.querySelector('main')).not.toBeNull();
  });

  it('본문 폭 제한이면 예전처럼 fixed-container 이고 읽기 폭 칼럼 클래스는 없다', () => {
    useSettingStore.setState({ layoutWidth: 'center' });
    const { container } = render(<WorkDetailPage />);
    const zone = container.querySelector('#galpi-genre-zone');
    expect(zone.classList.contains('fixed-container')).toBe(true);
    expect(zone.classList.contains('galpi-work-full')).toBe(false);
    expect(zone.querySelector('.galpi-work-inner')).toBeNull();
  });

  it('설정을 바꾸면 곧바로 다른 폭 규칙이 적용된다', () => {
    useSettingStore.setState({ layoutWidth: 'full' });
    const { container, rerender } = render(<WorkDetailPage />);
    useSettingStore.setState({ layoutWidth: 'center' });
    rerender(<WorkDetailPage />);
    expect(container.querySelector('#galpi-genre-zone').classList.contains('fixed-container')).toBe(true);
  });
});

describe('WorkDetailPage 양옆 패널 붙이기', () => {
  it('넓은 창(1920)이고 둘 다 열려 있으면 두 패널이 붙는다. 정보 상자는 테마 영역 안 본문 옆에 그대로 있다', () => {
    window.innerWidth = 1920;
    const { container } = render(<WorkDetailPage />);
    expect(state.left.docked).toBe(true);
    expect(state.toc.docked).toBe(true);
    expect(container.querySelector('#galpi-genre-zone aside')).not.toBeNull();
  });

  it('두 패널은 테마 영역 바깥(가로 배치 안)에서 영역의 앞뒤에 놓인다', () => {
    window.innerWidth = 1920;
    const { container } = render(<WorkDetailPage />);
    const shell = container.querySelector('.galpi-work-shell');
    const kids = Array.from(shell.children).map((c) => c.getAttribute('data-stub') || c.id);
    expect(kids).toEqual(['FloatingLeftTree', 'galpi-genre-zone', 'FloatingToc']);
  });

  it('좁은 창(1024)에서는 패널이 붙지 않는다', () => {
    window.innerWidth = 1024;
    render(<WorkDetailPage />);
    expect(state.left.docked).toBe(false);
    expect(state.toc.docked).toBe(false);
  });

  it('붙이는 기준 폭 바로 아래(1649)에서는 접히고 1650 에서는 붙는다', () => {
    window.innerWidth = 1649;
    render(<WorkDetailPage />);
    expect(state.left.docked).toBe(false);
    cleanup();
    window.innerWidth = 1650;
    render(<WorkDetailPage />);
    expect(state.left.docked).toBe(true);
  });

  it('붙일 수 있는 폭에서는 손잡이에 onDock 이 주어지고, 좁은 폭에서는 주어지지 않는다', () => {
    window.innerWidth = 1920;
    render(<WorkDetailPage />);
    expect(typeof state.left.onDock).toBe('function');
    expect(typeof state.toc.onDock).toBe('function');
    cleanup();
    window.innerWidth = 1024;
    render(<WorkDetailPage />);
    expect(state.left.onDock).toBeUndefined();
    expect(state.toc.onDock).toBeUndefined();
  });

  it('왼쪽을 접으면 왼쪽만 접히고 설정에 저장된다(오른쪽은 그대로 붙음)', () => {
    window.innerWidth = 1920;
    render(<WorkDetailPage />);
    act(() => state.left.onCollapse());
    expect(useSettingStore.getState().panelLeftOpen).toBe(false);
    expect(state.left.docked).toBe(false);
    expect(state.toc.docked).toBe(true);
  });

  it('오른쪽을 접었다가 손잡이로 다시 붙이면 설정이 되돌아간다', () => {
    window.innerWidth = 1920;
    render(<WorkDetailPage />);
    act(() => state.toc.onCollapse());
    expect(useSettingStore.getState().panelRightOpen).toBe(false);
    expect(state.toc.docked).toBe(false);
    act(() => state.toc.onDock());
    expect(useSettingStore.getState().panelRightOpen).toBe(true);
    expect(state.toc.docked).toBe(true);
  });

  it('창 폭을 줄이면 저장된 열림 값은 그대로 두고 화면만 접힌다', () => {
    window.innerWidth = 1920;
    render(<WorkDetailPage />);
    act(() => setWindowWidth(1000));
    expect(state.left.docked).toBe(false);
    expect(useSettingStore.getState().panelLeftOpen).toBe(true);
    act(() => setWindowWidth(1920));
    expect(state.left.docked).toBe(true);
  });
});

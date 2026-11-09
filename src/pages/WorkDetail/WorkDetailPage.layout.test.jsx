// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지의 폭 규칙: 전체 폭이면 테마 영역이 창 전체를 채우고 안쪽 칼럼만 읽기 폭을 가진다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

const state = vi.hoisted(() => ({ data: null }));
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

beforeEach(() => {
  localStorage.clear();
  state.data = baseData();
});
afterEach(() => {
  cleanup();
  useSettingStore.setState({ layoutWidth: 'full' });
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

// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 페이지가 본문의 [[이름]] 파란 링크 클릭을 백링크 처리 함수에 연결했는지 확인한다.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';

const state = vi.hoisted(() => ({ data: null, backlink: null }));
// vi.mock 은 파일 맨 위로 끌어올려지므로 공용 스텁 만드는 함수도 hoisted 로 선언한다
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
vi.mock('../../domains/character/CharacterInfobox', () => ({ default: stub('CharacterInfobox') }));
vi.mock('../../domains/character/CharacterGrid', () => ({ default: stub('CharacterGrid') }));
vi.mock('../../domains/character/CharacterQuickNav', () => ({ default: stub('CharacterQuickNav') }));
vi.mock('../../domains/character/BatchImageModal', () => ({ default: stub('BatchImageModal') }));

import WorkDetailPage from './WorkDetailPage';

const baseData = () => ({
  loading: false,
  workId: '91',
  pageId: null,
  navigate: vi.fn(),
  work: {
    id: 91,
    title: '시험 작품',
    genre: '',
    description: '[META_DATA:{"overview":"개요에 [[리안]] 이 있다"}]\n설정에 [[세라]] 가 있다',
  },
  wikiPages: [],
  characters: [{ id: 1, name: '릴리', pageBodyRaw: '상세에 [[루시]] 가 있다' }],
  activeCharId: 1,
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
});

const clickLink = (container, text) => {
  const link = Array.from(container.querySelectorAll('.wiki-backlink')).find((el) => el.textContent === text);
  expect(link, `링크 ${text}`).toBeTruthy();
  fireEvent.click(link);
};

afterEach(cleanup);

describe('WorkDetailPage [[이름]] 링크 연결', () => {
  it('개요, 설정, 캐릭터 상세 본문의 링크를 누르면 백링크 처리 함수가 이름과 함께 불린다', () => {
    state.data = baseData();
    state.backlink = vi.fn();
    const { container } = render(<WorkDetailPage />);
    clickLink(container, '리안');
    clickLink(container, '세라');
    clickLink(container, '루시');
    expect(state.backlink.mock.calls.map((c) => c[0])).toEqual(['리안', '세라', '루시']);
  });

  it('하위 문서를 보는 화면의 링크도 연결된다', () => {
    state.data = { ...baseData(), pageId: '5', wikiPages: [{ id: 5, title: '하위 문서', content: '문서에 [[레온]] 이 있다' }] };
    state.backlink = vi.fn();
    const { container } = render(<WorkDetailPage />);
    clickLink(container, '레온');
    expect(state.backlink).toHaveBeenCalledWith('레온');
  });
});

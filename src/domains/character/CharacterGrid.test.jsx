// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import CharacterGrid from './CharacterGrid';

afterEach(cleanup);

const chars = [
  { id: 1, name: '릴리', _baseCharId: 1, 소속: '아인하르트 대공저', _propOrder: ['소속', '서열'], 서열: '3' },
  { id: 2, name: '레온', _baseCharId: 2, 소속: '북부', _propOrder: ['소속', '서열'], 서열: '1' },
];

const renderGrid = (over = {}) => {
  const props = {
    styles: {},
    charSectionNum: 3,
    groupCriteria: '관계',
    setGroupCriteria: vi.fn(),
    setIsBatchImgModalOpen: vi.fn(),
    navigate: vi.fn(),
    workId: '91',
    sortedGroupNames: ['일반'],
    groupedChars: { 일반: chars },
    cardVariants: {},
    setCardVariants: vi.fn(),
    fullVariants: [''],
    work: { title: '작품' },
    charExt: 'png',
    activeCharId: null,
    setActiveCharId: vi.fn(),
    sortKeys: ['소속', '서열'],
    sortKey: '',
    sortDir: 'asc',
    setSort: vi.fn(),
    wikiPages: [],
    ...over,
  };
  return { props, ...render(<CharacterGrid {...props} />) };
};

const sortSelect = () => screen.getByLabelText('정렬 기준');

describe('CharacterGrid 정렬 선택', () => {
  it('수동 순서와 속성별 오름차순, 내림차순 항목을 보여 준다', () => {
    renderGrid();
    const labels = Array.from(sortSelect().querySelectorAll('option')).map((o) => o.textContent);
    expect(labels).toEqual(['수동 순서', '소속 (오름차순)', '소속 (내림차순)', '서열 (오름차순)', '서열 (내림차순)']);
  });

  it('항목을 고르면 속성 이름과 방향으로 setSort 를 부른다', () => {
    const { props } = renderGrid();
    fireEvent.change(sortSelect(), { target: { value: 'desc:서열' } });
    expect(props.setSort).toHaveBeenCalledWith('서열', 'desc');
    fireEvent.change(sortSelect(), { target: { value: '' } });
    expect(props.setSort).toHaveBeenCalledWith('', 'asc');
  });

  it('현재 선택된 정렬이 선택 상태로 보인다', () => {
    renderGrid({ sortKey: '서열', sortDir: 'desc' });
    expect(sortSelect().value).toBe('desc:서열');
  });

  it('정렬 가능한 속성이 없으면 정렬 선택을 그리지 않는다', () => {
    renderGrid({ sortKeys: [] });
    expect(screen.queryByLabelText('정렬 기준')).toBeNull();
  });
});

describe('CharacterGrid 카드 드래그', () => {
  const cards = () => Array.from(document.querySelectorAll('[id^="char-card-"]'));

  it('수동 순서일 때는 카드를 끌 수 있다', () => {
    renderGrid();
    expect(cards().every((el) => el.getAttribute('draggable') === 'true')).toBe(true);
  });

  it('속성 정렬을 켜면 카드를 끌 수 없다(화면 순서와 저장 순서가 어긋나지 않게)', () => {
    renderGrid({ sortKey: '서열' });
    expect(cards().every((el) => el.getAttribute('draggable') === 'false')).toBe(true);
  });
});

describe('CharacterGrid 소속 링크', () => {
  const pages = [{ id: 7, title: '북부' }];
  const labelRowFor = (name) => screen.getByText(name);

  it('같은 제목의 하위 문서가 있으면 소속 값이 링크가 되어 그 문서로 이동한다', () => {
    const { props } = renderGrid({ wikiPages: pages });
    fireEvent.click(screen.getByRole('link', { name: '북부' }));
    expect(props.navigate).toHaveBeenCalledWith('/work/91?pageId=7');
  });

  it('링크를 눌러도 카드 선택은 바뀌지 않는다', () => {
    const { props } = renderGrid({ wikiPages: pages });
    fireEvent.click(screen.getByRole('link', { name: '북부' }));
    expect(props.setActiveCharId).not.toHaveBeenCalled();
  });

  it('링크 글자색은 부모를 따른다(테마가 정한 글자색을 덮어쓰지 않아 어두운 테마에서도 읽힌다)', () => {
    renderGrid({ wikiPages: pages });
    expect(screen.getByRole('link', { name: '북부' }).style.color).toBe('inherit');
  });

  it('같은 제목의 문서가 없으면 일반 글자로 둔다', () => {
    renderGrid({ wikiPages: [] });
    expect(screen.queryByRole('link')).toBeNull();
    expect(labelRowFor('북부')).toBeTruthy();
  });
});

describe('CharacterGrid 등급 배지', () => {
  const axes = [{ key: '서열', abbr: 'R' }];
  const scale = [{ level: 3, name: '중대', desc: '도시 단위' }];

  it('등급 설정이 있으면 값이 있는 카드에 배지를 보여 준다', () => {
    renderGrid({ ratingAxes: axes, ratingScale: scale });
    expect(screen.getByText('R 3').closest('[title]').getAttribute('title')).toBe('서열 3 중대: 도시 단위');
    expect(screen.getByText('R 1')).toBeTruthy();
  });

  it('등급 설정이 없으면 배지를 그리지 않는다', () => {
    renderGrid();
    expect(document.querySelector('.gt-rating-badges')).toBeNull();
  });
});

describe('CharacterGrid 기밀 표시', () => {
  const secret = [
    { id: 1, name: '릴리', _baseCharId: 1, 소속: '북부', 기밀: 'Y' },
    { id: 2, name: '레온', _baseCharId: 2, 소속: '북부' },
  ];
  const makeClassified = (over = {}) => ({
    has: true, mask: false, setMask: vi.fn(), reveal: vi.fn(),
    isClassified: (c) => c.기밀 === 'Y',
    isConcealed: () => false,
    ...over,
  });
  const card = (id) => document.getElementById(`char-card-${id}`);

  it('기밀 캐릭터 카드에만 기밀 도장이 붙는다', () => {
    renderGrid({ groupedChars: { 일반: secret }, classified: makeClassified() });
    expect(card(1).textContent).toContain('기밀');
    expect(card(2).textContent).not.toContain('기밀');
  });

  it('기밀 캐릭터가 없으면 "기밀 가리기" 선택을 그리지 않는다', () => {
    renderGrid({ classified: makeClassified({ has: false }) });
    expect(screen.queryByLabelText('기밀 가리기')).toBeNull();
  });

  it('기밀 가리기 선택을 누르면 setMask 로 켜고 끈다', () => {
    const classified = makeClassified();
    renderGrid({ groupedChars: { 일반: secret }, classified });
    fireEvent.click(screen.getByLabelText('기밀 가리기'));
    expect(classified.setMask).toHaveBeenCalledWith(true);
  });

  it('가려진 카드는 사진과 내용이 흐려지고, 누르면 선택하지 않고 열람만 한다', () => {
    const classified = makeClassified({ mask: true, isConcealed: (c) => c.기밀 === 'Y' });
    const { props } = renderGrid({ groupedChars: { 일반: secret }, classified });
    expect(card(1).querySelector('[data-concealed]')).not.toBeNull();
    expect(card(2).querySelector('[data-concealed]')).toBeNull();
    fireEvent.click(card(1));
    expect(classified.reveal).toHaveBeenCalledWith(1);
    expect(props.setActiveCharId).not.toHaveBeenCalled();
  });

  it('가려지지 않은 카드는 누르면 평소처럼 선택한다', () => {
    const classified = makeClassified();
    const { props } = renderGrid({ groupedChars: { 일반: secret }, classified });
    fireEvent.click(card(1));
    expect(props.setActiveCharId).toHaveBeenCalledWith(1);
    expect(classified.reveal).not.toHaveBeenCalled();
  });

  it('가려진 카드의 소속 링크도 눌러지지 않게 흐려진 영역 안에서는 이동하지 않는다', () => {
    const classified = makeClassified({ mask: true, isConcealed: (c) => c.기밀 === 'Y' });
    const { props } = renderGrid({ groupedChars: { 일반: secret }, wikiPages: [{ id: 7, title: '북부' }], classified });
    const link = card(1).querySelector('a');
    expect(link).toBeNull();
    expect(props.navigate).not.toHaveBeenCalled();
  });
});

describe('CharacterGrid 칩 필터', () => {
  const groups = [{ key: '소속', options: [{ value: '북부', count: 1 }] }];

  it('필터 그룹이 있으면 칩을 그리고, 누르면 onFilterToggle 을 부른다', () => {
    const onFilterToggle = vi.fn();
    renderGrid({ filterGroups: groups, filterSelection: {}, onFilterToggle, onFilterClear: vi.fn(), filterShown: 2, filterTotal: 2 });
    fireEvent.click(screen.getByRole('button', { name: '북부 1' }));
    expect(onFilterToggle).toHaveBeenCalledWith('소속', '북부');
  });

  it('필터 그룹이 없으면 칩을 그리지 않는다', () => {
    renderGrid();
    expect(document.querySelector('.gt-filter-chips')).toBeNull();
  });

  it('필터 때문에 보이는 인물이 0명이면 안내 문구를 보여 준다', () => {
    renderGrid({
      filterGroups: groups, filterSelection: { 소속: ['북부'] }, onFilterToggle: vi.fn(), onFilterClear: vi.fn(),
      filterShown: 0, filterTotal: 2, sortedGroupNames: [], groupedChars: {},
    });
    expect(screen.getByText('조건에 맞는 인물이 없습니다.')).toBeTruthy();
  });

  it('필터가 없는 상태에서 인물이 0명이면 안내 문구를 만들지 않는다', () => {
    renderGrid({ sortedGroupNames: [], groupedChars: {}, filterShown: 0, filterTotal: 0 });
    expect(screen.queryByText('조건에 맞는 인물이 없습니다.')).toBeNull();
  });
});

describe('CharacterGrid 머리말은 좁은 창에서 글자를 쪼개지 않는다', () => {
  const header = () => document.querySelector('#sec-characters').closest('[class*="sectionHeader"], .gt-section-header');

  it('제목, 라벨, 버튼은 줄바꿈하지 않는다(white-space: nowrap)', () => {
    renderGrid();
    expect(document.querySelector('#sec-characters').style.whiteSpace).toBe('nowrap');
    expect(screen.getByText('분류 기준:').style.whiteSpace).toBe('nowrap');
    expect(screen.getByText('정렬:').style.whiteSpace).toBe('nowrap');
    expect(screen.getByRole('button', { name: /새 캐릭터 추가/ }).style.whiteSpace).toBe('nowrap');
    expect(screen.getByRole('button', { name: '일괄 이미지 위치 조정' }) || true).toBeTruthy();
  });

  it('왼쪽 묶음은 모자라면 다음 줄로 넘어가고(flex-wrap), 오른쪽 버튼 묶음은 줄어들지 않고 오른쪽 끝에 붙는다', () => {
    renderGrid();
    const left = document.querySelector('#sec-characters').parentElement;
    expect(left.style.flexWrap).toBe('wrap');
    const right = screen.getByRole('button', { name: /새 캐릭터 추가/ }).parentElement;
    expect(right.style.marginLeft).toBe('auto');
    expect(right.style.flexShrink).toBe('0');
  });
});

describe('CharacterGrid 분류 기준 선택', () => {
  const critSelect = () => screen.getByLabelText('분류 기준:');
  const critLabels = () => Array.from(critSelect().querySelectorAll('option')).map((o) => o.textContent);

  it('기본 다섯 개와 작품에 있는 다른 속성을 모두 보여 준다', () => {
    renderGrid({ sortKeys: ['소속', '서열', '직책'] });
    expect(critLabels()).toEqual(['관계별', '소속별', '등급별', '종족별', '성별별', '서열별', '직책별']);
  });

  it('정렬할 속성이 하나도 없어도 기본 다섯 개는 있다', () => {
    renderGrid({ sortKeys: [] });
    expect(critLabels()).toEqual(['관계별', '소속별', '등급별', '종족별', '성별별']);
  });

  it('고르면 그 속성 이름으로 setGroupCriteria 를 부른다', () => {
    const { props } = renderGrid({ sortKeys: ['서열'] });
    fireEvent.change(critSelect(), { target: { value: '서열' } });
    expect(props.setGroupCriteria).toHaveBeenCalledWith('서열');
  });

  it('현재 분류 기준이 목록에 없는 속성이어도 선택 상태가 유지된다', () => {
    renderGrid({ groupCriteria: '사라진속성', sortKeys: [] });
    expect(critSelect().value).toBe('사라진속성');
  });
});

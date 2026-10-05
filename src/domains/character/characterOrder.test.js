import { describe, it, expect } from 'vitest';
import { getGroupSortOrder, carryOverCharacterSystemProps } from './characterOrder';

describe('getGroupSortOrder', () => {
  it('그룹 전용 드래그 순서가 있으면 그걸 쓴다', () => {
    expect(getGroupSortOrder({ _groupSortOrders: { 일반: 5 }, sortOrder: 1000 }, '일반')).toBe(5);
  });

  it('그 그룹 값이 없으면 기본 순서(dp.sortOrder)로 내려간다', () => {
    expect(getGroupSortOrder({ _groupSortOrders: { 다른그룹: 5 }, sortOrder: 1000 }, '일반')).toBe(1000);
    expect(getGroupSortOrder({ sortOrder: 1001 }, '일반')).toBe(1001);
  });

  it('둘 다 없으면 999', () => {
    expect(getGroupSortOrder({}, '일반')).toBe(999);
  });

  it('0도 유효한 순서로 취급한다(||가 아니라 ??)', () => {
    expect(getGroupSortOrder({ _groupSortOrders: { 일반: 0 }, sortOrder: 7 }, '일반')).toBe(0);
    expect(getGroupSortOrder({ sortOrder: 0 }, '일반')).toBe(0);
  });

  // 일괄 붙여넣기로 만든 캐릭터는 sortOrder가 1000, 1001, ...로 박혀 있다. 이 값을 읽지 않고
  // 전부 999로 묶으면 정렬이 무동작이 되어 저장 완료 순서대로 뒤죽박죽 보였던 버그의 회귀 테스트.
  it('붙여넣기로 정해둔 순서대로 정렬된다', () => {
    const chars = [
      { name: 'C', dp: { sortOrder: 1002 } },
      { name: 'A', dp: { sortOrder: 1000 } },
      { name: 'B', dp: { sortOrder: 1001 } },
    ];
    const sorted = [...chars].sort((a, b) => getGroupSortOrder(a.dp, '일반') - getGroupSortOrder(b.dp, '일반'));
    expect(sorted.map((c) => c.name)).toEqual(['A', 'B', 'C']);
  });
});

describe('carryOverCharacterSystemProps', () => {
  it('원본에 없으면 이미지 위치 기본값 50/50/1을 쓴다', () => {
    const dp = carryOverCharacterSystemProps({}, {});
    expect(dp).toMatchObject({ cardImgX: 50, cardImgY: 50, cardImgScale: 1 });
  });

  it('원본의 이미지 위치를 그대로 옮긴다(0도 유효한 값)', () => {
    const dp = carryOverCharacterSystemProps({}, { cardImgX: 0, cardImgY: 80, cardImgScale: 1.5 });
    expect(dp).toMatchObject({ cardImgX: 0, cardImgY: 80, cardImgScale: 1.5 });
  });

  it('_groupSortOrders와 sortOrder를 옮긴다', () => {
    const dp = carryOverCharacterSystemProps({}, { _groupSortOrders: { 일반: 3 }, sortOrder: 1001 });
    expect(dp._groupSortOrders).toEqual({ 일반: 3 });
    expect(dp.sortOrder).toBe(1001);
  });

  it('sortOrder가 0이어도 옮긴다', () => {
    expect(carryOverCharacterSystemProps({}, { sortOrder: 0 }).sortOrder).toBe(0);
  });

  it('원본에 sortOrder가 없으면 새로 만들어 넣지 않는다', () => {
    const dp = carryOverCharacterSystemProps({}, {});
    expect('sortOrder' in dp).toBe(false);
    expect('_groupSortOrders' in dp).toBe(false);
  });

  it('dp를 직접 수정해 그대로 돌려주고 기존 필드는 건드리지 않는다', () => {
    const dp = { pageBody: { rawText: '본문' }, themeColor: '#fff' };
    const result = carryOverCharacterSystemProps(dp, { sortOrder: 1000 });
    expect(result).toBe(dp);
    expect(dp.pageBody).toEqual({ rawText: '본문' });
    expect(dp.themeColor).toBe('#fff');
  });

  // 캐릭터를 수정·저장할 때마다 sortOrder가 사라져 999로 떨어지고, 다른 캐릭터는 1000 이상이라
  // 수정한 캐릭터만 목록 맨 앞으로 튀어 오르던 버그의 회귀 테스트.
  it('수정·저장해도 캐릭터 카드의 위치가 바뀌지 않는다', () => {
    const originals = [
      { name: 'A', dp: { sortOrder: 1000 } },
      { name: 'B', dp: { sortOrder: 1001 } },
      { name: 'C', dp: { sortOrder: 1002 } },
    ];
    const afterEditingB = originals.map((c) => (c.name === 'B' ? { ...c, dp: carryOverCharacterSystemProps({ pageBody: {} }, c.dp) } : c));
    const sorted = [...afterEditingB].sort((a, b) => getGroupSortOrder(a.dp, '일반') - getGroupSortOrder(b.dp, '일반'));
    expect(sorted.map((c) => c.name)).toEqual(['A', 'B', 'C']);

    // 옮기지 않았다면(예전 동작) B만 999가 되어 맨 앞으로 튄다는 것도 함께 확인한다.
    const buggy = originals.map((c) => (c.name === 'B' ? { ...c, dp: { pageBody: {} } } : c));
    const buggySorted = [...buggy].sort((a, b) => getGroupSortOrder(a.dp, '일반') - getGroupSortOrder(b.dp, '일반'));
    expect(buggySorted[0].name).toBe('B');
  });
});

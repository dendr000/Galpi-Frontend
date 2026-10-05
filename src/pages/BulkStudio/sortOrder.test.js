import { describe, it, expect } from 'vitest';
import { getNextSortOrderBase } from './sortOrder';

describe('getNextSortOrderBase', () => {
  it('행이 없으면 999', () => {
    expect(getNextSortOrderBase([])).toBe(999);
  });

  it('_sortOrderNum이 없거나 999 이하면 999', () => {
    expect(getNextSortOrderBase([{ name: 'a' }, { _sortOrderNum: 5 }, { _sortOrderNum: 999 }])).toBe(999);
  });

  it('가장 큰 _sortOrderNum을 돌려준다', () => {
    expect(getNextSortOrderBase([{ _sortOrderNum: 1000 }, { _sortOrderNum: 1005 }, { _sortOrderNum: 1002 }])).toBe(1005);
  });

  it('숫자가 아닌 값(문자열, null, undefined)은 무시한다', () => {
    expect(getNextSortOrderBase([{ _sortOrderNum: '2000' }, { _sortOrderNum: null }, { _sortOrderNum: undefined }, { _sortOrderNum: 1001 }])).toBe(1001);
  });

  // 붙여넣은 순서가 곧 정렬 순서가 되도록 새 행마다 base+1, base+2, ...를 받는다. 이어서 또
  // 붙여넣어도 앞선 행들 뒤로 이어져야 한다(전부 999로 같은 값이면 저장 완료 순서대로 섞였다).
  it('연속으로 붙여넣어도 순서값이 겹치지 않고 계속 증가한다', () => {
    let rows = [];
    const paste = (names) => {
      const base = getNextSortOrderBase(rows);
      rows = [...rows, ...names.map((name, i) => ({ name, _sortOrderNum: base + i + 1 }))];
    };
    paste(['시에나', '아나스타샤', '아이리스']);
    paste(['레나', '미아']);

    const orders = rows.map((r) => r._sortOrderNum);
    expect(orders).toEqual([1000, 1001, 1002, 1003, 1004]);
    expect(new Set(orders).size).toBe(orders.length);
    expect([...rows].sort((a, b) => a._sortOrderNum - b._sortOrderNum).map((r) => r.name)).toEqual(['시에나', '아나스타샤', '아이리스', '레나', '미아']);
  });
});

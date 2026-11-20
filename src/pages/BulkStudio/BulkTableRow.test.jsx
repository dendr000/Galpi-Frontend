// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 일괄 스튜디오 한 행: 목록 표시(보임/숨김)와 다음 폼 선택 칸.
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import BulkTableRow from './BulkTableRow';

afterEach(cleanup);

const SELECT_TITLE = '이 캐릭터를 SHIFT+클릭했을 때 다음에 보일 캐릭터';
const base = { id: 1, name: '헬퍼피', _checked: false, pageBodyRaw: '', 부제목: '', _hidden: false, _switchTarget: '헬독' };

const renderRow = (rowOver = {}, over = {}) => {
  const props = {
    row: { ...base, ...rowOver }, rIdx: 0, columns: ['부제목'],
    handleCellChange: vi.fn(), toggleRowCheck: vi.fn(), removeRow: vi.fn(), setActiveRowIdx: vi.fn(), handleKeyDown: vi.fn(), setBodyModal: vi.fn(),
    setRowHidden: vi.fn(), setRowSwitchTarget: vi.fn(), nameOptions: ['헬퍼피', '헬독', '헬가드'],
    ...over,
  };
  const utils = render(<table><tbody><BulkTableRow {...props} /></tbody></table>);
  return { props, ...utils };
};

describe('BulkTableRow 폼 전환 칸', () => {
  it('보임 상태에서 누르면 숨기도록 요청한다', () => {
    const { props } = renderRow();
    fireEvent.click(screen.getByText('보임'));
    expect(props.setRowHidden).toHaveBeenCalledWith(0, true);
  });

  it('숨김 상태는 글자로 나오고 누르면 다시 보이게 요청하며 행에 구분 표시가 붙는다', () => {
    const { props, container } = renderRow({ _hidden: true });
    expect(container.querySelector('tr.hidden-row')).not.toBeNull();
    fireEvent.click(screen.getByText('숨김'));
    expect(props.setRowHidden).toHaveBeenCalledWith(0, false);
  });

  it('보이는 행에는 숨김 구분 표시가 없다', () => {
    expect(renderRow().container.querySelector('tr.hidden-row')).toBeNull();
  });

  it('다음 폼 선택지에서 자기 자신은 빠진다', () => {
    renderRow();
    const select = screen.getByTitle(SELECT_TITLE);
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['', '헬독', '헬가드']);
    expect(select.value).toBe('헬독');
  });

  it('다음 폼을 고르면 그 이름을 넘기고, 없음을 고르면 빈 값을 넘긴다', () => {
    const { props } = renderRow();
    const select = screen.getByTitle(SELECT_TITLE);
    fireEvent.change(select, { target: { value: '헬가드' } });
    expect(props.setRowSwitchTarget).toHaveBeenLastCalledWith(0, '헬가드');
    fireEvent.change(select, { target: { value: '' } });
    expect(props.setRowSwitchTarget).toHaveBeenLastCalledWith(0, '');
  });

  it('없는 캐릭터를 가리키는 연결은 표시를 붙여 그대로 보여 준다', () => {
    renderRow({ _switchTarget: '사라진이름' });
    expect(screen.getByText('사라진이름 (없는 캐릭터)')).toBeTruthy();
  });
});

// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 일괄 스튜디오 표: 행이 없을 때 안내 문구.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import BulkTable from './BulkTable';

afterEach(cleanup);

const renderTable = (over = {}) => render(
  <BulkTable
    columns={['부제목', '나이']} rows={[]} loading={false} tabMode="horizontal" suggestions={{}} selectedWorkId=""
    handleCellChange={vi.fn()} toggleRowCheck={vi.fn()} toggleAllChecks={vi.fn()} removeRow={vi.fn()} removeColumn={vi.fn()}
    changeColOrder={vi.fn()} setActiveRowIdx={vi.fn()} setBodyModal={vi.fn()}
    {...over}
  />
);

describe('BulkTable 빈 표 안내', () => {
  it('작품을 고르지 않았으면 작품을 선택하라고 안내한다', () => {
    renderTable();
    expect(screen.getByText('작품을 선택해 주세요.')).toBeTruthy();
  });

  it('작품은 골랐는데 캐릭터가 없으면 추가 방법을 안내한다(작품을 선택하라고 하지 않는다)', () => {
    renderTable({ selectedWorkId: '5' });
    expect(screen.queryByText('작품을 선택해 주세요.')).toBeNull();
    expect(screen.getByText(/아직 캐릭터가 없습니다/)).toBeTruthy();
    expect(screen.getByText(/붙여넣기로 추가/)).toBeTruthy();
  });

  it('불러오는 중에는 로딩 문구', () => {
    renderTable({ selectedWorkId: '5', loading: true });
    expect(screen.getByText('로딩 중...')).toBeTruthy();
  });

  it('행이 있으면 표를 그린다', () => {
    renderTable({
      selectedWorkId: '5',
      rows: [{ id: 1, name: '릴리', _checked: false, pageBodyRaw: '', 부제목: '', 나이: '20' }],
    });
    expect(screen.getByText('이름 (필수)')).toBeTruthy();
  });
});

// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import FilterChips from './FilterChips';

afterEach(cleanup);

const groups = [
  { key: '소속', options: [{ value: '북부', count: 2 }, { value: '남부', count: 1 }] },
  { key: '등급', options: [{ value: 'S급', count: 2 }] },
];

const renderChips = (over = {}) => {
  const props = { groups, selection: {}, onToggle: vi.fn(), onClear: vi.fn(), shown: 3, total: 3, ...over };
  render(<FilterChips {...props} />);
  return props;
};

describe('FilterChips', () => {
  it('그룹이 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<FilterChips groups={[]} selection={{}} onToggle={() => {}} onClear={() => {}} shown={0} total={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('그룹 이름과 값 칩(인원 수 포함)을 그린다', () => {
    renderChips();
    expect(screen.getByText('소속')).toBeTruthy();
    expect(screen.getByRole('button', { name: '북부 2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '남부 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'S급 2' })).toBeTruthy();
  });

  it('칩을 누르면 그룹과 값으로 onToggle 을 부른다', () => {
    const props = renderChips();
    fireEvent.click(screen.getByRole('button', { name: '남부 1' }));
    expect(props.onToggle).toHaveBeenCalledWith('소속', '남부');
  });

  it('선택된 칩은 aria-pressed 가 true 이고 나머지는 false', () => {
    renderChips({ selection: { 소속: ['북부'] } });
    expect(screen.getByRole('button', { name: '북부 2' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '남부 1' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('선택이 있을 때만 "필터 해제" 버튼과 보이는 인원 수를 보여 준다', () => {
    renderChips();
    expect(screen.queryByRole('button', { name: '필터 해제' })).toBeNull();
    cleanup();
    const props = renderChips({ selection: { 소속: ['북부'] }, shown: 2, total: 3 });
    expect(screen.getByText('2 / 3명')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '필터 해제' }));
    expect(props.onClear).toHaveBeenCalled();
  });

  it('칩 글자색은 부모를 따르고 선택은 테두리와 굵기로 구분한다(테마 글자색을 덮어쓰지 않음)', () => {
    renderChips({ selection: { 소속: ['북부'] } });
    const on = screen.getByRole('button', { name: '북부 2' });
    const off = screen.getByRole('button', { name: '남부 1' });
    expect(on.style.color).toBe('inherit');
    expect(off.style.color).toBe('inherit');
    expect(on.style.fontWeight).not.toBe(off.style.fontWeight);
  });
});

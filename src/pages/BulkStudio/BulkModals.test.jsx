// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 일괄 스튜디오의 "붙여넣기로 추가" 모달: 기본으로 어느 탭이 열리는지.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BulkModals } from './BulkModals';

afterEach(cleanup);

const ROWS = [{ id: 1, name: '릴리', pageBodyRaw: '', 부제목: '', 나이: '20', 성별: '여성' }];
const COLS = ['부제목', '나이', '성별'];

const baseProps = (over = {}) => ({
  bodyModal: { isOpen: false }, setBodyModal: vi.fn(), handleCellChange: vi.fn(),
  findReplaceModal: { isOpen: false }, setFindReplaceModal: vi.fn(), columns: COLS, rows: ROWS, executeFindReplace: vi.fn(),
  pasteModal: { isOpen: true }, setPasteModal: vi.fn(), importRowsFromText: vi.fn(), importRowsFromGrid: vi.fn(),
  ...over,
});

const textTab = () => screen.getByRole('button', { name: /텍스트로 붙여넣기/ });
const gridTab = () => screen.getByRole('button', { name: /표로 입력/ });
const textPanelVisible = () => screen.getByPlaceholderText(/이름 - 나이 - 성별/).parentElement.style.display !== 'none';

describe('BulkModals 붙여넣기로 추가: 기본 탭', () => {
  it('열면 "텍스트로 붙여넣기" 탭이 기본으로 열려 있다', () => {
    render(<BulkModals {...baseProps()} />);
    expect(textTab().getAttribute('aria-pressed')).toBe('true');
    expect(gridTab().getAttribute('aria-pressed')).toBe('false');
    expect(textPanelVisible()).toBe(true);
  });

  it('"표로 입력" 탭으로 바꿀 수 있고, 바꾸면 표에 지금 있는 인물이 불러와져 있다', () => {
    render(<BulkModals {...baseProps()} />);
    fireEvent.click(gridTab());
    expect(gridTab().getAttribute('aria-pressed')).toBe('true');
    expect(textPanelVisible()).toBe(false);
    expect(Array.from(document.querySelectorAll('input')).some((i) => i.value === '릴리')).toBe(true);
  });

  it('텍스트 탭에서 아무것도 안 쓰고 표 탭으로 가도 불러온 인물이 지워지지 않는다', () => {
    render(<BulkModals {...baseProps()} />);
    fireEvent.click(gridTab());
    fireEvent.click(textTab());
    fireEvent.click(gridTab());
    expect(Array.from(document.querySelectorAll('input')).some((i) => i.value === '릴리')).toBe(true);
  });

  it('다시 열 때마다 텍스트 탭부터 시작한다(지난번에 표 탭을 썼어도)', () => {
    const { rerender } = render(<BulkModals {...baseProps()} />);
    fireEvent.click(gridTab());
    rerender(<BulkModals {...baseProps({ pasteModal: { isOpen: false } })} />);
    rerender(<BulkModals {...baseProps()} />);
    expect(textTab().getAttribute('aria-pressed')).toBe('true');
    expect(textPanelVisible()).toBe(true);
  });

  it('텍스트 탭에서 쓴 내용이 반영 버튼으로 넘어간다', () => {
    const props = baseProps({ importRowsFromText: vi.fn(() => ({ count: 1, updatedCount: 0 })) });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<BulkModals {...props} />);
    const text = '이름 - 나이\n서지안 - 29';
    fireEvent.change(screen.getByPlaceholderText(/이름 - 나이 - 성별/), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: '반영' }));
    expect(props.importRowsFromText).toHaveBeenCalledWith(text);
    expect(props.setPasteModal).toHaveBeenCalledWith({ isOpen: false });
  });
});

// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const closeModal = vi.fn();

vi.mock('../../../api/axiosCore', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../store/useModalStore', () => ({
  useModalStore: () => ({ closeModal }),
}));

import BoilerplateModal from './BoilerplateModal';

const ACTIVE = 'galpi-bp-active-folder';
const RESET = 'galpi-bp-reset-on-close';

beforeEach(() => {
  localStorage.clear();
  closeModal.mockClear();
});
afterEach(cleanup);

describe('상용구 모달 — 닫으면 활성 폴더를 "전체"로 자동 복귀', () => {
  it('"전체로 자동 복귀" 체크박스가 스페이스바 자동 치환 바로 옆에 있고, 기본은 켜져 있다', () => {
    render(<BoilerplateModal showToast={() => {}} />);

    const labels = screen.getAllByRole('checkbox').map((box) => box.closest('label').textContent.trim());
    expect(labels).toEqual(['스페이스바 자동 치환 발동', "닫으면 '전체'로 자동 복귀", '타이핑 중 실시간 추천 팝업 표시']);
    expect(screen.getByLabelText("닫으면 '전체'로 자동 복귀").checked).toBe(true);
  });

  it('특정 폴더를 고른 채 × 버튼으로 닫으면 활성 폴더가 "전체"가 된다', () => {
    localStorage.setItem(ACTIVE, '무협');
    render(<BoilerplateModal showToast={() => {}} />);

    fireEvent.click(screen.getByText('×'));

    expect(localStorage.getItem(ACTIVE)).toBe('전체');
    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it('바깥(어두운 배경)을 눌러서 닫아도 똑같이 "전체"가 된다', () => {
    localStorage.setItem(ACTIVE, '무협');
    const { container } = render(<BoilerplateModal showToast={() => {}} />);

    fireEvent.click(container.querySelector('.modal-overlay'));

    expect(localStorage.getItem(ACTIVE)).toBe('전체');
    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it('모달이 열려 있는 동안에는 고른 폴더가 그대로 유지된다 (닫을 때만 복귀)', () => {
    localStorage.setItem(ACTIVE, '무협');
    render(<BoilerplateModal showToast={() => {}} />);

    expect(localStorage.getItem(ACTIVE)).toBe('무협');
    expect(screen.getByRole('combobox').value).toBe('무협');
  });

  it('체크박스를 끄면 설정이 저장되고, 닫아도 고른 폴더가 유지된다', () => {
    localStorage.setItem(ACTIVE, '무협');
    render(<BoilerplateModal showToast={() => {}} />);

    fireEvent.click(screen.getByLabelText("닫으면 '전체'로 자동 복귀"));
    expect(localStorage.getItem(RESET)).toBe('false');

    fireEvent.click(screen.getByText('×'));

    expect(localStorage.getItem(ACTIVE)).toBe('무협');
    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it('이미 꺼 둔 설정은 다음에 모달을 열어도 꺼진 채로 보인다', () => {
    localStorage.setItem(RESET, 'false');
    render(<BoilerplateModal showToast={() => {}} />);

    expect(screen.getByLabelText("닫으면 '전체'로 자동 복귀").checked).toBe(false);
  });

  it('활성 폴더가 이미 "전체"면 닫아도 아무것도 새로 쓰지 않는다', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    render(<BoilerplateModal showToast={() => {}} />);
    spy.mockClear();

    fireEvent.click(screen.getByText('×'));

    expect(spy).not.toHaveBeenCalledWith(ACTIVE, expect.anything());
    spy.mockRestore();
  });
});

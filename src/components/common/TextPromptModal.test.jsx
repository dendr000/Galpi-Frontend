// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import TextPromptModal from './TextPromptModal';

afterEach(cleanup);

const open = (message, defaultValue) => {
  let promise;
  act(() => { promise = window.openTextPromptModal(message, defaultValue); });
  return promise;
};

describe('TextPromptModal', () => {
  it('열기 전에는 아무것도 그리지 않는다', () => {
    const { queryByRole } = render(<TextPromptModal />);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('메시지와 기본값을 보여 주고 엔터로 입력한 글자를 돌려준다', async () => {
    const { getByRole, getByText } = render(<TextPromptModal />);
    const p = open('폴더명:', '기본');
    expect(getByText('폴더명:')).toBeTruthy();
    const input = getByRole('textbox');
    expect(input.value).toBe('기본');
    fireEvent.change(input, { target: { value: '새 폴더' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await expect(p).resolves.toBe('새 폴더');
  });

  it('확인 버튼을 눌러도 입력한 글자를 돌려주고 창이 닫힌다', async () => {
    const { getByRole, getByText, queryByRole } = render(<TextPromptModal />);
    const p = open('폴더명:');
    fireEvent.change(getByRole('textbox'), { target: { value: 'abc' } });
    fireEvent.click(getByText('확인'));
    await expect(p).resolves.toBe('abc');
    expect(queryByRole('dialog')).toBeNull();
  });

  it('Esc, 취소 버튼, 바깥 클릭은 모두 null 로 닫는다', async () => {
    const { getByRole, getByText } = render(<TextPromptModal />);
    let p = open('a');
    fireEvent.keyDown(getByRole('textbox'), { key: 'Escape' });
    await expect(p).resolves.toBeNull();
    p = open('b');
    fireEvent.click(getByText('취소'));
    await expect(p).resolves.toBeNull();
    p = open('c');
    fireEvent.click(getByRole('dialog'));
    await expect(p).resolves.toBeNull();
  });

  it('한글 조합 중의 엔터는 확정으로 보지 않는다', async () => {
    const { getByRole, queryByRole } = render(<TextPromptModal />);
    const p = open('폴더명:');
    const input = getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(queryByRole('dialog')).not.toBeNull();
    fireEvent.keyDown(input, { key: 'Escape' });
    await p;
  });

  it('열려 있는 중에 다시 열면 앞의 질문은 null 로 끝난다', async () => {
    const { getByRole } = render(<TextPromptModal />);
    const first = open('첫째');
    const second = open('둘째');
    await expect(first).resolves.toBeNull();
    fireEvent.keyDown(getByRole('textbox'), { key: 'Escape' });
    await expect(second).resolves.toBeNull();
  });
});

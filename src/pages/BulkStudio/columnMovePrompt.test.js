// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { askColumnPosition } from './columnMovePrompt';

afterEach(() => {
  delete window.openTextPromptModal;
  vi.restoreAllMocks();
});

describe('askColumnPosition', () => {
  it('입력 모달로 묻고, 현재 위치(1부터)를 기본값으로 넘긴다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('4'));
    await expect(askColumnPosition('무기', 2, 6)).resolves.toBe(4);
    const [message, defaultValue] = window.openTextPromptModal.mock.calls[0];
    expect(message).toContain('"무기"');
    expect(message).toContain('현재 3번째');
    expect(message).toContain('2~6번째');
    expect(defaultValue).toBe('3');
  });

  it('취소하면 null', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve(null));
    await expect(askColumnPosition('무기', 2, 6)).resolves.toBeNull();
  });

  it('숫자가 아니거나 비어 있으면 null', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('abc'));
    await expect(askColumnPosition('무기', 2, 6)).resolves.toBeNull();
    window.openTextPromptModal = vi.fn(() => Promise.resolve(''));
    await expect(askColumnPosition('무기', 2, 6)).resolves.toBeNull();
  });

  it('prompt 가 에러를 던지는 Electron 환경에서도 입력 모달로 동작한다', async () => {
    vi.spyOn(window, 'prompt').mockImplementation(() => { throw new Error('prompt() is not supported.'); });
    window.openTextPromptModal = vi.fn(() => Promise.resolve(' 5 '));
    await expect(askColumnPosition('무기', 2, 6)).resolves.toBe(5);
  });
});
